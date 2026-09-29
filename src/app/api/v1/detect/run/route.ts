import { NextResponse } from 'next/server';
import { generateSyntheticCorpus } from '@/data/generator';
import { runDetectionPipeline } from '@/detect/engine';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateLimit = checkRateLimit(`detect:${clientIp}`, { maxTokens: 40, refillRatePerSec: 1 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Detection execution rate limit exceeded. Please wait before re-triggering.',
            retryAfter: rateLimit.retryAfterSec,
          },
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSec || 1) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pack = body.pack === 'A' ? 'A' : 'B';

    // Generate or fetch telemetry pack
    const corpus = generateSyntheticCorpus({ pack });
    const result = runDetectionPipeline(corpus.events);

    return NextResponse.json({
      success: true,
      data: {
        totalEventsProcessed: result.stats.totalEventsProcessed,
        signalsGenerated: result.stats.signalsGenerated,
        incidentsCount: result.incidents.length,
        primaryIncident: result.incidents.find((i) => i.severityTier === 'CRITICAL') || result.incidents[0] || null,
        executionTimeMs: result.stats.executionTimeMs,
      },
      meta: {
        timestamp: new Date().toISOString(),
        pack,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Detection execution failed';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PIPELINE_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
