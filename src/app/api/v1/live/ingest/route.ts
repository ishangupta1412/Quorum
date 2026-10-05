import { NextResponse } from 'next/server';
import { liveSession } from '@/lib/live/state';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { SimulationStateRow } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

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

  // upsert on fixed singleton PK — triggers Supabase Realtime diff
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Malformed or empty JSON' },
        { status: 400 }
      );
    }

    const events = Array.isArray(body) ? body : [body];

    // 1. Always update the in-memory store
    const result = liveSession.ingest(events);

    // 2. Fire-and-forget Supabase write — non-blocking so ingest stays <50ms
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
