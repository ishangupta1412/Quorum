import { NextResponse } from 'next/server';
import {
  parseWebhookPayload,
  createWebhookReceipt,
  WebhookReceipt,
} from '@/lib/sentinel/webhook';
import { checkRateLimit } from '@/lib/rate-limiter';

// Demo-scoped in-memory receipt store (mirrors the audit verify route pattern).
// Production wiring streams to Microsoft Sentinel via Logic App / Event Hub.
const webhookReceipts: WebhookReceipt[] = [];

function unauthorized(message: string, code: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

export async function POST(request: Request) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateLimit = checkRateLimit(`sentinel-webhook:${clientIp}`, {
      maxTokens: 30,
      refillRatePerSec: 1,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Sentinel webhook rate limit exceeded. Retry after backoff.',
            retryAfter: rateLimit.retryAfterSec,
          },
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSec || 1) } }
      );
    }

    const rawText = await request.text();
    if (rawText.length > 1024 * 1024) {
      return unauthorized(
        'Webhook payload exceeds maximum allowed size of 1MB.',
        'PAYLOAD_TOO_LARGE',
        413
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawText);
    } catch {
      return unauthorized('Request body must be valid JSON.', 'INVALID_JSON', 400);
    }

    const parsed = parseWebhookPayload(body);
    if (!parsed.ok || !parsed.body) {
      return unauthorized(
        'Sentinel incident payload failed strict schema validation.',
        'SCHEMA_VALIDATION_FAILED',
        400
      );
    }

    const receipt = createWebhookReceipt(parsed.body);
    webhookReceipts.push(receipt);

    return NextResponse.json(
      {
        success: true,
        data: {
          receiptId: receipt.receiptId,
          incidentName: receipt.incidentName,
          severity: receipt.severity,
          streamedAt: receipt.receivedAt,
          queueDepth: webhookReceipts.length,
        },
        meta: { timestamp: new Date().toISOString(), target: 'sentinel-demo-stream' },
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sentinel webhook streaming failed';
    return NextResponse.json(
      { success: false, error: { code: 'WEBHOOK_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      receipts: webhookReceipts,
      count: webhookReceipts.length,
    },
    meta: { timestamp: new Date().toISOString() },
  });
}
