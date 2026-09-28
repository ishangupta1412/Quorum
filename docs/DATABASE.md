# Quorum — Database Schema & Data Architecture
**PostgreSQL 15 / Supabase · Microsoft Innovate 2026**

---

## 1. Schema Overview

Quorum operates on four core tables and two supporting tables:

```
auth_events (Raw normalized VPN auth log rows)
  │
  ├──> signals (Discrete rule firings from F5, F6, F7, F10)
  │      │
  │      └──> incidents (Consensus-correlated multi-family security incidents)
  │             │
  │             └──> audit_ledger (Cryptographic hash-chain of all mutations)
  │
suppression_rules (Active tuning & triage exceptions)
rejected_lines (Malformed lines dropped during ingest)
```

---

## 2. Table Definitions & Constraints

### 2.1 `auth_events`
Stores canonicalized authentication events (`AuthEvent`).
```sql
CREATE TABLE public.auth_events (
    event_hash TEXT PRIMARY KEY, -- SHA-256(timestamp || user_name || src_ip || outcome)
    timestamp TIMESTAMPTZ NOT NULL,
    ts_tz_assumed BOOLEAN NOT NULL DEFAULT false,
    user_name TEXT NOT NULL,
    user_raw TEXT NOT NULL,
    src_ip INET NOT NULL,
    ip_scope TEXT NOT NULL CHECK (ip_scope IN ('public', 'private')),
    event_outcome TEXT NOT NULL CHECK (event_outcome IN ('SUCCESS', 'FAILURE_BAD_CREDENTIALS', 'FAILURE_LOCKED', 'FAILURE_MFA', 'FAILURE_EXPIRED', 'UNKNOWN')),
    source_system TEXT NOT NULL,
    batch_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_auth_events_time_ip ON public.auth_events(timestamp, src_ip);
CREATE INDEX idx_auth_events_time_user ON public.auth_events(timestamp, user_name);
```

### 2.2 `signals`
Stores detector firings from independent detection families.
```sql
CREATE TABLE public.signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detector_id TEXT NOT NULL, -- 'F5_brute', 'F6_spray', 'F7_campaign', 'F10_pivot'
    detector_family TEXT NOT NULL CHECK (detector_family IN ('VOLUME', 'STATISTICAL', 'GRAPH', 'PIVOT')),
    incident_id UUID,
    confidence_score NUMERIC(5,2) NOT NULL,
    entity_key TEXT NOT NULL, -- e.g., 'ip:198.51.100.2' or 'user:john.doe'
    event_hashes TEXT[] NOT NULL,
    evidence_bundle JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_signals_detector_family ON public.signals(detector_family);
CREATE INDEX idx_signals_incident_id ON public.signals(incident_id);
```

### 2.3 `incidents`
Consolidated multi-family security incidents evaluated by the Quorum severity engine.
```sql
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    severity_score INTEGER NOT NULL CHECK (severity_score BETWEEN 0 AND 100),
    severity_tier TEXT NOT NULL CHECK (severity_tier IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    severity_equation TEXT NOT NULL, -- e.g. "Base 100 (F10) * 1.00 (GRAPH+PIVOT) + 15 -> 100"
    families_present TEXT[] NOT NULL,
    signal_ids UUID[] NOT NULL,
    contributing_ips INET[] NOT NULL,
    targeted_accounts TEXT[] NOT NULL,
    compromised_accounts TEXT[] NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'FALSE_POSITIVE')),
    triage_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_incidents_severity ON public.incidents(severity_score DESC);
CREATE INDEX idx_incidents_status ON public.incidents(status);
```

### 2.4 `audit_ledger`
Cryptographic tamper-evident log of analyst actions and automated pipeline decisions.
```sql
CREATE TABLE public.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id BIGSERIAL NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    actor_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    prev_record_hash TEXT NOT NULL,
    record_hash TEXT NOT NULL
);
```

---

## 3. Transactional Guarantees (`commit_detection_batch`)

To prevent inconsistent reads during real-time UI queries, detector outputs are committed atomically:

```sql
CREATE OR REPLACE FUNCTION commit_detection_batch(
    p_batch_id UUID,
    p_incidents JSONB,
    p_signals JSONB,
    p_audit_entries JSONB
) RETURNS VOID AS $$
BEGIN
    -- Atomic write of signals, incidents, and audit entries
    -- Ensures an analyst never views an incident without its linked signals
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
