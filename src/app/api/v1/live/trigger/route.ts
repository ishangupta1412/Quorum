import { NextResponse } from 'next/server';
import { liveSession } from '@/lib/live/state';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import type { SimulationStateRow } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

// The demo secret key (same as ingest)
const EXPECTED_SECRET_KEY =
  process.env.QUORUM_SECRET_KEY ||
  process.env.SIMULATION_INGEST_KEY ||
  'quorum-secret-key-2026';

// Rate limit: max 10 trigger requests per 10 s per IP
const TRIGGER_RATE_CONFIG = { maxTokens: 10, refillRatePerSec: 1 };

type TriggerMode = 'BASELINE' | 'SPRAY' | 'PIVOT' | 'RESET';

// ---------------------------------------------------------------------------
// Spray seed events — 12 distinct residential proxy subnets × 3–4 targets
// ---------------------------------------------------------------------------
const RESIDENTIAL_SUBNETS = [
  '185.220.101', '194.26.29', '198.98.56', '45.154.255',
  '103.149.130', '193.148.18', '91.240.118', '176.119.25',
  '45.139.122',  '77.247.108', '164.132.89', '167.99.200',
];

const USER_POOL = [
  ...Array.from({ length: 40 }, (_, i) => `user_${String(i + 1).padStart(4, '0')}`),
  'ciso_admin', 'finance_lead', 'corp_vp', 'it_support', 'service_account',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildSprayEvents(): object[] {
  const numIps = 8 + Math.floor(Math.random() * 6); // 8–13
  const numTargets = 20 + Math.floor(Math.random() * 16); // 20–35
  const ips = RESIDENTIAL_SUBNETS.slice(0, numIps).map(
    (s) => `${s}.${Math.floor(Math.random() * 253) + 2}`
  );
  const targets = shuffle(USER_POOL).slice(0, numTargets);
  const events: object[] = [];
  for (const ip of ips) {
    const subset = shuffle(targets).slice(0, 2 + Math.floor(Math.random() * 3));
    for (const user of subset) {
      events.push({ ip, user, outcome: 'FAILURE', timestamp: new Date().toISOString() });
    }
  }
  return events;
}

function buildBaselineEvents(): object[] {
  const corporateIps = Array.from({ length: 12 }, () => `10.0.${Math.floor(Math.random()*10)+1}.${Math.floor(Math.random()*248)+2}`);
  return Array.from({ length: 15 }, () => ({
    ip:        pick(corporateIps),
    user:      pick(USER_POOL),
    outcome:   Math.random() < 0.94 ? 'SUCCESS' : 'FAILURE',
    timestamp: new Date().toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Supabase helper
// ---------------------------------------------------------------------------
async function persistToSupabase(snapshot: ReturnType<typeof liveSession.getSnapshot>) {
  const supabase = getSupabaseServerClient();
  const row: SimulationStateRow = {
    id:              'demo-singleton',
    current_score:   snapshot.currentScore,
    severity_tier:   snapshot.severityTier,
    status:          snapshot.status,
    last_pivot_at:   snapshot.lastPivot?.timestamp ?? null,
    last_pivot_user: snapshot.lastPivot?.userName  ?? null,
    last_pivot_ip:   snapshot.lastPivot?.srcIp     ?? null,
    reasoning:       snapshot.reasoning,
    clusters:        snapshot.clusters     as unknown as SimulationStateRow['clusters'],
    graph_nodes:     snapshot.graphNodes   as unknown as SimulationStateRow['graph_nodes'],
    graph_links:     snapshot.graphLinks   as unknown as SimulationStateRow['graph_links'],
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
  if (error) console.error('[Quorum/trigger] Supabase upsert error:', error.message);
}

async function resetSupabase() {
  const supabase = getSupabaseServerClient();
  const resetRow: SimulationStateRow = {
    id: 'demo-singleton', current_score: 0, severity_tier: 'LOW', status: 'BASELINE',
    last_pivot_at: null, last_pivot_user: null, last_pivot_ip: null,
    reasoning: 'State reset. Monitoring baseline traffic…',
    clusters: [] as unknown as SimulationStateRow['clusters'],
    graph_nodes: [] as unknown as SimulationStateRow['graph_nodes'],
    graph_links: [] as unknown as SimulationStateRow['graph_links'],
    naive_alerts: 0, loosened_alerts: 0, total_events: 0, failed_events: 0,
    success_events: 0, unique_ips: 0, unique_users: 0,
    updated_at: new Date().toISOString(),
  };
    const { error } = await (supabase as any)
    .from('simulation_state')
    .upsert(resetRow, { onConflict: 'id' });
  if (error) console.error('[Quorum/trigger] Supabase reset error:', error.message);
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = (forwarded?.split(',')[0].trim()) ?? req.headers.get('x-real-ip') ?? '127.0.0.1';

    const rateCheck = checkRateLimit(`trigger:${clientIp}`, TRIGGER_RATE_CONFIG);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSec ?? 5) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { mode } = body as { mode?: TriggerMode };

    if (!mode || !['BASELINE', 'SPRAY', 'PIVOT', 'RESET'].includes(mode)) {
      return NextResponse.json({ success: false, error: 'Invalid mode. Expected BASELINE | SPRAY | PIVOT | RESET' }, { status: 400 });
    }

    if (mode === 'RESET') {
      liveSession.reset();
      if (isSupabaseConfigured()) resetSupabase().catch(console.error);
      return NextResponse.json({ success: true, message: 'Engine reset — ready for fresh demo' });
    }

    if (mode === 'BASELINE') {
      const events = buildBaselineEvents();
      liveSession.ingest(events);
      if (isSupabaseConfigured()) persistToSupabase(liveSession.getSnapshot()).catch(console.error);
      return NextResponse.json({ success: true, message: `Baseline seeded — ${events.length} benign events` });
    }

    if (mode === 'SPRAY') {
      const events = buildSprayEvents();
      liveSession.ingest(events);
      if (isSupabaseConfigured()) persistToSupabase(liveSession.getSnapshot()).catch(console.error);
      return NextResponse.json({ success: true, message: `Spray launched — ${events.length} events across ${new Set(events.map((e: any) => e.ip)).size} proxies` });
    }

    if (mode === 'PIVOT') {
      // Grab an active cluster target for authenticity
      const snap = liveSession.getSnapshot();
      const cluster = snap.clusters[0];
      let pivotIp   = '185.220.101.77';
      let pivotUser = 'user_0001';

      if (cluster?.contributingIps?.length && cluster?.targetedAccounts?.length) {
        pivotIp   = pick(cluster.contributingIps);
        pivotUser = pick(cluster.targetedAccounts);
      } else if (snap.graphNodes.length > 0) {
        const ipNodes   = snap.graphNodes.filter((n) => n.type === 'ip');
        const userNodes = snap.graphNodes.filter((n) => n.type === 'user');
        if (ipNodes.length)   pivotIp   = pick(ipNodes).label;
        if (userNodes.length) pivotUser = pick(userNodes).label;
      }

      // Seed a prior failure from this IP/user to ensure cluster context
      liveSession.ingest([{ ip: pivotIp, user: pivotUser, outcome: 'FAILURE', timestamp: new Date(Date.now() - 4000).toISOString() }]);
      // Then the breach
      liveSession.ingest([{ ip: pivotIp, user: pivotUser, outcome: 'SUCCESS', timestamp: new Date().toISOString() }]);
      if (isSupabaseConfigured()) persistToSupabase(liveSession.getSnapshot()).catch(console.error);

      return NextResponse.json({
        success:   true,
        message:   `CRITICAL: Pivot confirmed — ${pivotUser} @ ${pivotIp}`,
        pivotUser,
        pivotIp,
      });
    }

    return NextResponse.json({ success: false, error: 'Unhandled mode' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Trigger internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
