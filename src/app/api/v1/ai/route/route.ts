import { NextResponse } from 'next/server';
import { z } from 'zod';
import { routeAiRequest, getProviderHealthStatus } from '@/lib/ai/router';
import { AiTaskCategory } from '@/types/ai-router';

const AiTaskSchema = z.object({
  taskCategory: z.enum([
    'INCIDENT_NARRATIVE',
    'TRIAGE_SUGGESTION',
    'CAMPAIGN_SUMMARY',
    'SUPPRESSION_REASON',
    'KQL_TRANSLATION',
  ]),
  payload: z.record(z.unknown()),
  maxOutputTokens: z.number().int().min(64).max(2048).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } },
        { status: 400 }
      );
    }

    const parsed = AiTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid request schema.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const response = await routeAiRequest(parsed.data);

    return NextResponse.json({
      success: true,
      data: response,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI router encountered an error.';

    // If all providers failed, return 503 Service Unavailable
    if (message.includes('All AI providers failed')) {
      return NextResponse.json(
        { success: false, error: { code: 'ALL_PROVIDERS_UNAVAILABLE', message } },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'AI_ROUTER_ERROR', message } },
      { status: 500 }
    );
  }
}

// Health check: GET /api/v1/ai/route
export async function GET() {
  const health = getProviderHealthStatus();
  const allDown = health.every((h) => !h.available);

  return NextResponse.json(
    {
      success: true,
      data: {
        providers: health,
        allProvidersAvailable: health.every((h) => h.available),
        anyProviderAvailable: health.some((h) => h.available),
      },
    },
    { status: allDown ? 503 : 200 }
  );
}
