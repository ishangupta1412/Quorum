import { NextResponse } from 'next/server';
import { z } from 'zod';
import { liveSession } from '@/lib/live/state';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { SimulationStateRow } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

// ── Rate Limiter Config: Max 20 requests per 10 seconds per IP ─────────────
const RATE_LIMIT_CONFIG = {
  maxTokens: 20,
  refillRatePerSec: 2, // 2 tokens/sec = 20 tokens per 10 seconds
};

// ── Ingest Gatekeeping Secret Key ──────────────────────────────────────────
const EXPECTED_SECRET_KEY =
  process.env.QUORUM_SECRET_KEY ||
  process.env.SIMULATION_INGEST_KEY ||
  'quorum-secret-key-2026';

// ── Sanitization Utilities ──────────────────────────────────────────────────
function sanitizeString(str: string, maxLength = 128): string {
  return str
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '') // strip control / zero-width chars
    .replace(/[<>'"`\\;]/g, '')                                       // strip XSS / injection quotes
    .trim()
    .slice(0, maxLength);
}

function sanitizeIp(rawIp: string): string {
  const cleaned = sanitizeString(rawIp, 64);
  // Allow valid IPv4 and IPv6 format characters only
  if (!cleaned || !/^[a-fA-F0-9.:]+$/.test(cleaned)) {
    return '127.0.0.1';
  }
  return cleaned;
}

function sanitizeUsername(rawUser: string): string {
  const cleaned = sanitizeString(rawUser, 128);
  // Retain standard enterprise username characters
  const safeUser = cleaned.replace(/[^a-zA-Z0-9._@-]/g, '');
  return safeUser || 'anonymous_user';
}

// ── Strict Input Validation Schemas ─────────────────────────────────────────
const EventItemSchema = z
  .object({
    ip: z.string().optional(),
    srcIp: z.string().optional(),
    user: z.string().optional(),
    userName: z.string().optional(),
    outcome: z.string().optional(),
    eventOutcome: z.string().optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
  })
  .transform((raw, ctx) => {
    const ip = sanitizeIp(raw.ip || raw.srcIp || '127.0.0.1');
    const user = sanitizeUsername(raw.user || raw.userName || 'unknown_user');

    const outcomeRaw = (raw.outcome || raw.eventOutcome || '').trim().toUpperCase();
    if (!outcomeRaw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing 'outcome' field. Must be 'SUCCESS' or 'FAILURE'.",
      });
      return z.NEVER;
    }

    const outcomeNormalized = outcomeRaw.includes('SUCC')
      ? 'SUCCESS'
      : outcomeRaw.includes('FAIL') || outcomeRaw.includes('LOCK') || outcomeRaw.includes('MFA')
      ? 'FAILURE'
      : null;

    if (!outcomeNormalized) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid outcome '${outcomeRaw}'. Expected 'SUCCESS' or 'FAILURE'.`,
      });
      return z.NEVER;
    }

    return {
      ip,
      user,
      outcome: outcomeNormalized as 'SUCCESS' | 'FAILURE',
      timestamp: raw.timestamp ?? new Date().toISOString(),
    };
  });

const IngestPayloadSchema = z.union([
  EventItemSchema.transform((item) => [item]),
  z.array(EventItemSchema).min(1, 'Empty batch provided').max(1000, 'Batch size exceeds 1,000 events limit'),
]);

// ── Helper: Client IP extraction ───────────────────────────────────────────
function extractClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}

// ── Supabase persistence ───────────────────────────────────────────────────
async function persistToSupabase(snapshot: ReturnType<typeof liveSession.getSnapshot>) {
  const supabase = getSupabaseServerClient();

  const row: SimulationStateRow = {
    id: 'demo-singleton',
    current_score:   snapshot.currentScore,
    severity_tier:   snapshot.severityTier,
    status:          snapshot.status,
    last_pivot_at:   snapshot.lastPivot?.timestamp ?? null,
    last_pivot_user: snapshot.lastPivot?.userName  ?? null,
    last_pivot_ip:   snapshot.lastPivot?.srcIp     ?? null,
    reasoning:       snapshot.reasoning,
    clusters:        snapshot.clusters        as unknown as SimulationStateRow['clusters'],
    graph_nodes:     snapshot.graphNodes      as unknown as SimulationStateRow['graph_nodes'],
    graph_links:     snapshot.graphLinks      as unknown as SimulationStateRow['graph_links'],
    naive_alerts:    snapshot.naiveAlerts,
    loosened_alerts: snapshot.loosenedAlerts,
    total_events:    snapshot.stats.total,
    failed_events:   snapshot.stats.failed,
    success_events:  snapshot.stats.success,
    unique_ips:      snapshot.stats.uniqueIps,
    unique_users:    snapshot.stats.uniqueUsers,
    updated_at:      new Date().toISOString(),
  };

    const { error } = await (supabase as any)
    .from('simulation_state')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('[Quorum/ingest] Supabase upsert error:', error.message);
  }
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const clientIp = extractClientIp(req);

    // 1. Rate Limiting Check (20 requests per 10s per IP)
    const rateCheck = checkRateLimit(clientIp, RATE_LIMIT_CONFIG);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too Many Requests: Rate limit exceeded (max 20 requests per 10 seconds)',
          retryAfterSec: rateCheck.retryAfterSec ?? 5,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.retryAfterSec ?? 5),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Secret Token / API Gatekeeping
    const clientSecretKey =
      req.headers.get('x-quorum-secret-key') ||
      req.headers.get('x-simulation-key');

    if (!clientSecretKey || clientSecretKey !== EXPECTED_SECRET_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Invalid or missing x-quorum-secret-key header',
        },
        { status: 403 }
      );
    }

    // 3. Body Parsing & Strict Schema Validation
    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json(
        { success: false, error: 'Malformed or empty JSON body' },
        { status: 400 }
      );
    }

    const parseResult = IngestPayloadSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid event payload structure',
          issues: parseResult.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 422 }
      );
    }

    const validatedEvents = parseResult.data;

    // 4. Feed validated & sanitized events into Quorum live engine
    const result = liveSession.ingest(validatedEvents);

    // 5. Fire-and-forget Supabase persistence
    if (isSupabaseConfigured()) {
      const snapshot = liveSession.getSnapshot();
      persistToSupabase(snapshot).catch((err) =>
        console.error('[Quorum/ingest] Supabase write failed:', err)
      );
    }

    return NextResponse.json({
      success:      true,
      processed:    result.processed,
      currentScore: result.currentScore,
      status:       result.status,
      backend:      isSupabaseConfigured() ? 'supabase' : 'in-memory',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal ingest error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
