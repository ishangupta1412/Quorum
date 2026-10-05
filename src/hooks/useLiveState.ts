'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { LiveStateSnapshot } from '@/lib/live/state';
import type { SimulationStateRow } from '@/lib/supabase/database.types';

const POLL_INTERVAL_MS = 1500; // fallback polling when Supabase RT is unavailable
const SINGLETON_ID = 'demo-singleton';

// Map Supabase DB row → LiveStateSnapshot shape used by all UI components
function rowToSnapshot(row: SimulationStateRow): Partial<LiveStateSnapshot> {
  return {
    currentScore:          row.current_score,
    severityTier:          row.severity_tier as LiveStateSnapshot['severityTier'],
    status:                row.status as LiveStateSnapshot['status'],
    clusters:              (row.clusters as LiveStateSnapshot['clusters']) ?? [],
    lastPivot:             row.last_pivot_user
                             ? { userName: row.last_pivot_user, srcIp: row.last_pivot_ip ?? 'proxy', timestamp: row.last_pivot_at ?? '' }
                             : null,
    reasoning:             row.reasoning,
    events:                [],   // ring-buffer events are not persisted to Supabase
    totalEventsProcessed:  row.total_events,
    naiveAlerts:           row.naive_alerts,
    loosenedAlerts:        row.loosened_alerts,
    stats: {
      total:       row.total_events,
      failed:      row.failed_events,
      success:     row.success_events,
      uniqueIps:   row.unique_ips,
      uniqueUsers: row.unique_users,
    },
    graphNodes: (row.graph_nodes as LiveStateSnapshot['graphNodes']) ?? [],
    graphLinks: (row.graph_links as LiveStateSnapshot['graphLinks']) ?? [],
  };
}

interface UseLiveStateOptions {
  /** Called on every state update (Realtime or poll) */
  onUpdate?: (snapshot: Partial<LiveStateSnapshot>) => void;
  /** Called when a new pivot is confirmed (pivot timestamp changed) */
  onPivot?: (pivotUser: string, pivotIp: string) => void;
  /** Disable Realtime and force HTTP polling regardless of Supabase config */
  forcePoll?: boolean;
}

interface UseLiveStateReturn {
  /** How the hook is receiving data */
  transport: 'realtime' | 'polling' | 'connecting';
  /** Whether at least one update has been received */
  connected: boolean;
}

/**
 * useLiveState — unified live-state delivery hook.
 *
 * Priority:
 * 1. Supabase Realtime (postgres_changes on simulation_state) when available → ~50ms latency
 * 2. HTTP polling of /api/v1/live/state every 1.5s as fallback
 *
 * The hook is purely reactive — it calls onUpdate() on every change and
 * never returns stale state itself (the caller owns the snapshot state).
 */
export function useLiveState({
  onUpdate,
  onPivot,
  forcePoll = false,
}: UseLiveStateOptions = {}): UseLiveStateReturn {
  const [transport, setTransport] = useState<'realtime' | 'polling' | 'connecting'>('connecting');
  const [connected, setConnected] = useState(false);

  const lastPivotAtRef  = useRef<string | null>(null);
  const onUpdateRef     = useRef(onUpdate);
  const onPivotRef      = useRef(onPivot);
  const pollCleanupRef  = useRef<(() => void) | null>(null);
  onUpdateRef.current   = onUpdate;
  onPivotRef.current    = onPivot;

  // Shared update handler — called by both transports
  const handleRow = useCallback((row: SimulationStateRow) => {
    const snapshot = rowToSnapshot(row);

    // Detect pivot change
    const newPivotAt = row.last_pivot_at;
    if (newPivotAt && newPivotAt !== lastPivotAtRef.current && row.last_pivot_user) {
      lastPivotAtRef.current = newPivotAt;
      onPivotRef.current?.(row.last_pivot_user, row.last_pivot_ip ?? 'proxy');
    }

    onUpdateRef.current?.(snapshot);
    setConnected(true);
  }, []);

  // ── HTTP poll fallback ────────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollCleanupRef.current) {
      pollCleanupRef.current();
    }
    setTransport('polling');
    const controller = new AbortController();

    const poll = async () => {
      try {
        const res = await fetch('/api/v1/live/state', {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-store' },
        });
        if (!res.ok) return;
                const data = await res.json() as Record<string, any>;
        if (data['success'] === false) return;

        // Convert the API response shape to a SimulationStateRow-compatible object
        const syntheticRow: SimulationStateRow = {
          id:               SINGLETON_ID,
          current_score:    data.currentScore    ?? 0,
          severity_tier:    data.severityTier    ?? 'LOW',
          status:           data.status          ?? 'BASELINE',
          last_pivot_at:    data.lastPivot?.timestamp  ?? null,
          last_pivot_user:  data.lastPivot?.userName   ?? null,
          last_pivot_ip:    data.lastPivot?.srcIp      ?? null,
          reasoning:        data.reasoning       ?? '',
          clusters:         data.clusters        ?? [],
          graph_nodes:      data.graphNodes      ?? [],
          graph_links:      data.graphLinks      ?? [],
          naive_alerts:     data.naiveAlerts     ?? 0,
          loosened_alerts:  data.loosenedAlerts  ?? 0,
          total_events:     data.stats?.total    ?? 0,
          failed_events:    data.stats?.failed   ?? 0,
          success_events:   data.stats?.success  ?? 0,
          unique_ips:       data.stats?.uniqueIps   ?? 0,
          unique_users:     data.stats?.uniqueUsers ?? 0,
          updated_at:       new Date().toISOString(),
        };

        // Also merge live events from the API (not in Supabase row)
        const fullSnapshot: Partial<LiveStateSnapshot> = {
          ...rowToSnapshot(syntheticRow),
          events: data.events ?? [],
          totalEventsProcessed: data.totalEventsProcessed ?? syntheticRow.total_events,
        };
        onUpdateRef.current?.(fullSnapshot);

        // Pivot detection for poll path
        if (syntheticRow.last_pivot_at && syntheticRow.last_pivot_at !== lastPivotAtRef.current && syntheticRow.last_pivot_user) {
          lastPivotAtRef.current = syntheticRow.last_pivot_at;
          onPivotRef.current?.(syntheticRow.last_pivot_user, syntheticRow.last_pivot_ip ?? 'proxy');
        }

        setConnected(true);
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
        // Network error — stay silent, keep polling
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    const cleanup = () => {
      clearInterval(id);
      controller.abort();
    };
    pollCleanupRef.current = cleanup;
    return cleanup;
  }, []);

  // ── Supabase Realtime path ────────────────────────────────────────────────
  useEffect(() => {
    if (forcePoll) {
      return startPolling();
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      // Supabase not configured — fall back to polling
      return startPolling();
    }

    let rtWorking = false;
    const timeoutId = setTimeout(() => {
      // If Realtime hasn't delivered its first update in 3s, fall back to polling
      if (!rtWorking) {
        startPolling();
      }
    }, 3000);

    const channel = client
      .channel('simulation_state_changes')
      .on(
        'postgres_changes',
        {
          event: '*',             // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'simulation_state',
          filter: `id=eq.${SINGLETON_ID}`,
        },
        (payload) => {
          clearTimeout(timeoutId);
          rtWorking = true;

          if (!transport || transport !== 'realtime') {
            setTransport('realtime');
          }

          const row = (payload.new ?? payload.old) as SimulationStateRow;
          if (row) handleRow(row);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTransport('realtime');

          // Fetch the current row immediately after subscribing to populate UI
          client
            .from('simulation_state')
            .select('*')
            .eq('id', SINGLETON_ID)
            .maybeSingle()
            .then(({ data }) => {
              if (data) {
                rtWorking = true;
                clearTimeout(timeoutId);
                handleRow(data as SimulationStateRow);
              }
            });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeoutId);
          startPolling();
        }
      });

    return () => {
      clearTimeout(timeoutId);
      pollCleanupRef.current?.();
      client.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcePoll]);

  return { transport, connected };
}
