import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJsonLines } from '@/normalize/parsers';
import { checkRateLimit } from '@/lib/rate-limiter';
import { getClientIp, utf8ByteLength } from '@/lib/security/redteam';

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

const IngestSchema = z.object({
  // Telemetry content: JSONL or CSV text. Bounded at schema level.
  content: z.string().max(MAX_PAYLOAD_BYTES).optional(),
  lines: z.array(z.string().max(64 * 1024)).max(200_000).optional(),
  sourceSystem: z.string().max(128).optional(),
});

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
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

    // Early rejection before buffering: a 1GB+ crafted body is refused by header,
    // not absorbed into memory (F1 acceptance: 413 before full buffering).
    const declaredLength = Number(request.headers.get('content-length') ?? '0');
    if (Number.isFinite(declaredLength) && declaredLength > MAX_PAYLOAD_BYTES) {
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

    const rawText = await request.text();
    // Byte-accurate enforcement (a string can exceed its char count in UTF-8).
    if (utf8ByteLength(rawText) > MAX_PAYLOAD_BYTES) {
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

    const parsed = IngestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Ingest envelope failed schema validation.',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const rawContent = parsed.data.content ?? (parsed.data.lines ? parsed.data.lines.join('\n') : '');
    const sourceSystem = parsed.data.sourceSystem ?? 'CiscoAnyConnect';

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
