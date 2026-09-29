import { NextResponse } from 'next/server';
import { parseJsonLines } from '@/normalize/parsers';
import { checkRateLimit } from '@/lib/rate-limiter';

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateLimit = checkRateLimit(`ingest:${clientIp}`, { maxTokens: 100, refillRatePerSec: 2 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Ingestion rate limit exceeded. Please throttle batch dispatch.',
            retryAfter: rateLimit.retryAfterSec,
          },
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSec || 1) } }
      );
    }

    const rawText = await request.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Telemetry payload exceeds maximum allowed size of 10MB.',
          },
        },
        { status: 413 }
      );
    }

    const body = (() => {
      try {
        return JSON.parse(rawText);
      } catch {
        return {};
      }
    })();

    const rawContent = body.content || (Array.isArray(body.lines) ? body.lines.join('\n') : '');
    const sourceSystem = body.sourceSystem || 'CiscoAnyConnect';

    if (!rawContent || rawContent.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_PAYLOAD',
            message: 'No log content provided in request body.',
          },
        },
        { status: 400 }
      );
    }

    const { accepted, rejected } = parseJsonLines(rawContent, sourceSystem);

    return NextResponse.json({
      success: true,
      data: {
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        rejectedSample: rejected.slice(0, 5),
      },
      meta: {
        timestamp: new Date().toISOString(),
        sourceSystem,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process ingestion payload';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INGESTION_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
