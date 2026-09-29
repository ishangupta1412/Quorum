# Quorum — Security Policy & Operational Security Architecture
**Microsoft Innovate 2026 · Redmond Labs**

For the comprehensive security architecture and RLS policies, refer to [`docs/SECURITY.md`](file:///c:/Users/Ishan%20Gupta/OneDrive/Desktop/Microsoft%20Innovate/docs/SECURITY.md).

---

## 1. Reporting Security Vulnerabilities
If you discover a security vulnerability in Quorum, please submit an issue or contact the Redmond Labs team directly. All reports are investigated with high urgency.

---

## 2. Core Security Guarantees
1. **Zero Raw Credentials:** Passwords, hashes, and session tokens are never written to disk, stored in memory, or logged.
2. **Cryptographic Immutability:** All mutations and pipeline triggers are sealed in a SHA-256 hash-chained audit ledger (`audit_ledger`). Postgres triggers strictly forbid `UPDATE` and `DELETE`.
3. **Deterministic Detection:** All detection algorithms run in-process in pure TypeScript without black-box ML models.
4. **Server-Side Validation:** All Route Handlers enforce strict Zod schema parsing and token-bucket rate limiting (`src/lib/rate-limiter.ts`).
5. **Role-Based Access Control:** Supabase Auth JWT claims govern tenant isolation via PostgreSQL Row-Level Security (RLS).
