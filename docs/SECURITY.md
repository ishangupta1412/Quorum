# Quorum — Security Architecture & Guidelines
**Microsoft Innovate 2026 · Redmond Labs**

---

## 1. Threat Model & Security Principles

Quorum handles enterprise VPN authentication telemetry and outputs high-severity security incidents. It must adhere to the highest standard of defense-in-depth:

1. **Zero Raw Credentials Persisted:** Passwords, hashes, and session tokens must never enter the ingestion pipeline. If found in raw telemetry, they are stripped and discarded before normalization (`test_credential_minimization`).
2. **Server-Side Authorization & RLS:** All database access is governed by Postgres Row-Level Security (RLS) policies based on verified Supabase JWT claims (`analyst` vs `admin`).
3. **Immutability of Audit Trails:** The `audit_ledger` table uses a cryptographic hash chain (SHA-256) where each record hashes its contents concatenated with the previous record's hash. A PostgreSQL trigger (`trg_audit_lock`) strictly forbids `UPDATE` and `DELETE` operations.
4. **Input Sanitization & Schema Validation:** Every incoming payload (ingestion batch, suppression rule, triage note) is validated strictly with Zod schemas on Route Handlers.
5. **No Blind Trust in Client State:** All detection arithmetic (consensus scoring, bipartite graph clustering) runs deterministically in protected server-side execution contexts.

---

## 2. Pre-Launch "Don't Ship Vibecoded" Security Checklist

Before publishing or demonstrating Quorum, every item on this checklist must pass verification:

- [ ] **Remove Test Data:** Ensure no mock credentials, dummy passwords, or fake API keys exist in version control.
- [ ] **Hide API Keys:** Environment variables (`.env.local`) must keep `SUPABASE_SERVICE_ROLE_KEY` server-only. `NEXT_PUBLIC_*` is strictly restricted to non-sensitive client identifiers.
- [ ] **Protect Admin Routes:** Next.js middleware and Supabase RLS verify user role (`admin` vs `analyst`) for sensitive actions like suppression rule creation or ledger tampering simulations.
- [ ] **Secure Database Rules:** RLS enabled on all tables (`auth_events`, `signals`, `incidents`, `audit_ledger`, `suppression_rules`). Direct client `anon` access is restricted to read-only views where permitted.
- [ ] **Validate User Inputs:** Every API route validates input length, types, and disallowed characters via Zod.
- [ ] **API Rate Limits:** Implement token-bucket or Upstash Redis / in-memory rate limiting on public ingest endpoints (maximum 100 requests/min per IP).
- [ ] **Handle API Errors Gracefully:** Generic error messages returned to clients (`{"error": "INVALID_REQUEST", "code": 400}`); stack traces and internal DB schemas are never exposed.
- [ ] **Clean Debug Logs:** Remove all `console.log` statements containing raw telemetry or user names prior to production bundle build.
- [ ] **Content Security Policy (CSP):** Strict HTTP headers configured in `next.config.js` preventing XSS, clickjacking, and unauthorized frame embedding.

---

## 3. Cryptographic Audit Chain (`audit_ledger`)

```sql
-- Hash-chain record structure
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

-- Trigger preventing UPDATE and DELETE
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit ledger records are strictly append-only. Modification or deletion is forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_lock
BEFORE UPDATE OR DELETE ON public.audit_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
```

---

## 4. Vulnerability Disclosure & Compliance

- **Data Retention Policy:** Telemetry older than 30 days is auto-purged unless attached to an open Critical incident.
- **Incident Privacy:** Analyst notes and incident reports allow pseudonymization of usernames for GDPR/CCPA compliance audits.
