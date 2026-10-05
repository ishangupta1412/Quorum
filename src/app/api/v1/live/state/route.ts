import { NextResponse } from 'next/server';
import { liveSession } from '@/lib/live/state';
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { SimulationStateRow } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

// ── GET — fetch current simulation state ───────────────────────────────────
export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('simulation_state')
        .select('*')
        .eq('id', 'demo-singleton')
        .maybeSingle();

      if (error) {
        console.error('[Quorum/state] Supabase read error:', error.message);
        // Fall through to in-memory on error
      } else if (data) {
        const row = data as unknown as SimulationStateRow;
        return NextResponse.json({
          success:              true,
          currentScore:         row.current_score,
          severityTier:         row.severity_tier,
          status:               row.status,
          clusters:             row.clusters        ?? [],
          lastPivot:            row.last_pivot_user
                                  ? { userName: row.last_pivot_user, srcIp: row.last_pivot_ip ?? 'proxy', timestamp: row.last_pivot_at ?? '' }
                                  : null,
          reasoning:            row.reasoning,
          events:               [],
          totalEventsProcessed: row.total_events,
          naiveAlerts:          row.naive_alerts,
          loosenedAlerts:       row.loosened_alerts,
          stats: {
            total:       row.total_events,
            failed:      row.failed_events,
            success:     row.success_events,
            uniqueIps:   row.unique_ips,
            uniqueUsers: row.unique_users,
          },
          graphNodes: row.graph_nodes ?? [],
          graphLinks: row.graph_links ?? [],
          backend: 'supabase',
        });
      }
    }

    // Fallback: in-memory snapshot
    const snapshot = liveSession.getSnapshot();
    return NextResponse.json({ success: true, ...snapshot, backend: 'in-memory' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal state error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// ── POST — control actions (reset) ─────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body.action !== 'reset') {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    liveSession.reset();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseServerClient();
      const resetRow: SimulationStateRow = {
        id:              'demo-singleton',
        current_score:   0,
        severity_tier:   'LOW',
        status:          'BASELINE',
        last_pivot_at:   null,
        last_pivot_user: null,
        last_pivot_ip:   null,
        reasoning:       'State reset. Monitoring baseline traffic…',
        clusters:        [] as unknown as SimulationStateRow['clusters'],
        graph_nodes:     [] as unknown as SimulationStateRow['graph_nodes'],
        graph_links:     [] as unknown as SimulationStateRow['graph_links'],
        naive_alerts:    0,
        loosened_alerts: 0,
        total_events:    0,
        failed_events:   0,
        success_events:  0,
        unique_ips:      0,
        unique_users:    0,
        updated_at:      new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('simulation_state')
        .upsert(resetRow, { onConflict: 'id' });

      if (error) console.error('[Quorum/state] Reset write error:', error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Live session reset successfully',
      backend: isSupabaseConfigured() ? 'supabase' : 'in-memory',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal action error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
