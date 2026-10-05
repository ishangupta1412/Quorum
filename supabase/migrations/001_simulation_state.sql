-- ============================================================
-- Quorum · Supabase Migration
-- simulation_state — Live Demo Singleton Table
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Create the simulation state table
CREATE TABLE IF NOT EXISTS public.simulation_state (
  id                TEXT        PRIMARY KEY DEFAULT 'demo-singleton',

  -- Detection engine outputs
  current_score     FLOAT       NOT NULL DEFAULT 0    CHECK (current_score BETWEEN 0 AND 100),
  severity_tier     TEXT        NOT NULL DEFAULT 'LOW' CHECK (severity_tier IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  status            TEXT        NOT NULL DEFAULT 'BASELINE' CHECK (status IN ('BASELINE', 'SPRAY', 'PIVOT')),
  reasoning         TEXT        NOT NULL DEFAULT 'Monitoring baseline traffic…',

  -- Pivot tracking
  last_pivot_at     TIMESTAMPTZ,
  last_pivot_user   TEXT,
  last_pivot_ip     TEXT,

  -- JSONB graph data (arrays of objects)
  clusters          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  graph_nodes       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  graph_links       JSONB       NOT NULL DEFAULT '[]'::jsonb,

  -- Aggregated counters
  naive_alerts      INTEGER     NOT NULL DEFAULT 0,
  loosened_alerts   INTEGER     NOT NULL DEFAULT 0,
  total_events      INTEGER     NOT NULL DEFAULT 0,
  failed_events     INTEGER     NOT NULL DEFAULT 0,
  success_events    INTEGER     NOT NULL DEFAULT 0,
  unique_ips        INTEGER     NOT NULL DEFAULT 0,
  unique_users      INTEGER     NOT NULL DEFAULT 0,

  -- Timestamp used by Realtime to detect row changes
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comment
COMMENT ON TABLE public.simulation_state IS
  'Singleton row (id = demo-singleton) holding the live Quorum detection state for the Microsoft Innovate demo. Updated by the /api/v1/live/ingest route after every detection pipeline run.';

-- 2. Seed the singleton row (idempotent)
INSERT INTO public.simulation_state (id)
VALUES ('demo-singleton')
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (required for Realtime subscriptions)
ALTER TABLE public.simulation_state ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous read (used by the browser Realtime subscription)
--    The anon key can read but NEVER write — writes are server-only (service-role key).
CREATE POLICY "anon_read_simulation_state"
  ON public.simulation_state
  FOR SELECT
  USING (true);

-- 5. Allow service-role writes (API routes use the service-role key)
--    No explicit policy needed — service-role bypasses RLS by default.
--    This comment documents that intent.

-- 6. Enable Supabase Realtime on this table
--    Go to: Supabase Dashboard → Database → Replication
--    OR run the statements below:
ALTER PUBLICATION supabase_realtime ADD TABLE public.simulation_state;

-- 7. (Optional) GIN index for fast JSONB queries on clusters
CREATE INDEX IF NOT EXISTS idx_simulation_state_clusters
  ON public.simulation_state USING GIN (clusters);

-- 8. Reset helper function (callable from the API)
CREATE OR REPLACE FUNCTION public.reset_simulation_state()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.simulation_state
  SET
    current_score   = 0,
    severity_tier   = 'LOW',
    status          = 'BASELINE',
    reasoning       = 'State reset. Monitoring baseline traffic…',
    last_pivot_at   = NULL,
    last_pivot_user = NULL,
    last_pivot_ip   = NULL,
    clusters        = '[]'::jsonb,
    graph_nodes     = '[]'::jsonb,
    graph_links     = '[]'::jsonb,
    naive_alerts    = 0,
    loosened_alerts = 0,
    total_events    = 0,
    failed_events   = 0,
    success_events  = 0,
    unique_ips      = 0,
    unique_users    = 0,
    updated_at      = NOW()
  WHERE id = 'demo-singleton';
END;
$$;

-- ============================================================
-- VERIFICATION QUERY — run after setup to confirm everything
-- ============================================================
-- SELECT id, status, current_score, severity_tier, updated_at
-- FROM public.simulation_state
-- WHERE id = 'demo-singleton';
