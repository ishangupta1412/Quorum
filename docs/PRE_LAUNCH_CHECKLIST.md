# Quorum — Pre-Launch Hardening & "Don't Get Sued" Master Checklist
**Microsoft Innovate 2026 · Redmond Labs**

---

## Part 1: "Don't Ship Your Vibecoded App Before..." (The 15 Technical Guardrails)

| Guardrail Item | Quorum Implementation & Verification | Status |
|---|---|---|
| **1. Remove Test Data** | Deterministic synthetic generator (`src/data/generator.ts`) produces isolated test packs (Pack A & B) with synthetic IPs and fake names (`marcus.chen`). Zero production or real user credentials exist. | **VERIFIED** |
| **2. Hide API Keys** | API keys (`ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are accessed strictly on the server in Route Handlers. Never exposed with `NEXT_PUBLIC_` prefixes. Verified via secret regex in CI. | **VERIFIED** |
| **3. Protect Admin Routes** | Supabase JWT claims and server-side route checks verify roles (`analyst` vs `admin`) for actions such as suppression rule creation and audit ledger tamper simulations. | **VERIFIED** |
| **4. Check Auth & Permissions** | Row-Level Security (RLS) policies defined in PostgreSQL (`docs/DATABASE.md`) enforce tenant isolation. Unauthenticated requests receive 401 Unauthorized. | **VERIFIED** |
| **5. Secure Database Rules** | PostgreSQL tables (`auth_events`, `signals`, `incidents`, `audit_ledger`) enforce foreign keys, non-null constraints, and immutable trigger `trg_audit_lock` preventing `UPDATE` and `DELETE`. | **VERIFIED** |
| **6. Validate User Inputs** | Every Route Handler (`/api/v1/ingest`, `/api/v1/detect/run`, `/api/v1/ai/route`) strictly validates incoming JSON using Zod schemas (`safeParse`). Malformed payloads return structured HTTP 400. | **VERIFIED** |
| **7. Add API Rate Limits** | Token-bucket rate limiter (`src/lib/rate-limiter.ts`) enforces rate limits on public ingest (100 req/min) and AI routes (30 req/min) with `Retry-After` headers on HTTP 429. | **VERIFIED** |
| **8. Test File Uploads** | Ingest route enforces a strict 10MB payload size limit (`MAX_PAYLOAD_BYTES`), verifies JSON/text formatting, and routes unparseable lines to an isolated `rejected_lines` inspection bucket. | **VERIFIED** |
| **9. Handle API Errors** | API errors return uniform, generic envelopes (`{ success: false, error: { code, message } }`). Internal stack traces and database schemas are stripped. | **VERIFIED** |
| **10. Remove Debug Logs** | Production build strips `console.log` statements containing raw event hashes or usernames. ESLint rules enforce zero raw log leakage. | **VERIFIED** |
| **11. Hide Sensitive Errors** | Next.js custom error boundaries (`error.tsx`) render technical error panels without leaking server environment variables or raw SQL queries. | **VERIFIED** |
| **12. Test Mobile Layouts** | Responsive Tailwind breakpoints (`sm:`, `md:`, `lg:`) ensure the Analyst Cockpit renders cleanly on desktop terminals, tablets, and mobile triage viewports. | **VERIFIED** |
| **13. Test Slow Internet / Latency** | Offline Demo Mode (`NEXT_PUBLIC_DEMO_OFFLINE=true`) and deterministic fallback in `src/lib/ai/router.ts` guarantee instant sub-50ms rendering even on stage Wi-Fi drops. | **VERIFIED** |
| **14. Payment & Webhooks** | Out-of-scope for enterprise SOC detection layer. System includes zero third-party billing webhooks or payment processors to eliminate financial attack surface. | **N/A (Enterprise Tool)** |
| **15. Try to Break Your App** | Fuzz testing and edge-case unit tests in `tests/` test for clock drift (< year 2000), IPv6-mapped IPv4, zero-division in consensus arithmetic, and tampering detection. | **VERIFIED** |

---

## Part 2: "The Don't Get Sued Checklist" (20 Legal, Compliance & Privacy Directives)

Before deploying or demonstrating Quorum at Microsoft Innovate 2026, verify these 20 enterprise compliance controls:

1. **Check Your Data Retention:** Automated 30-day purge policy for transient VPN telemetry; persistent records restricted to closed/active critical incidents.
2. **Remove Exposed API Keys:** Automated pre-commit git hook and CI scan (`reticle-verify.yml`) blocks any commit containing API key patterns.
3. **Fix Insecure Authentication:** Strict Supabase Auth JWT verification; no hardcoded admin credentials or backdoor bypasses.
4. **Password Reset Protection:** Passwords are never collected, hashed, or processed by Quorum; auth outcomes are purely read-only event statuses (`SUCCESS` or `FAILURE_*`).
5. **Check User Permissions:** Granular RBAC (`SOC_ANALYST_L1`, `SOC_ANALYST_L2`, `SOC_LEAD_ADMIN`).
6. **Remove Admin Backdoors:** Zero debug routes (`/api/test-admin` or `?bypass=true`) exist in production code.
7. **Audit Database Access:** Every analyst action and automated detection is cryptographically signed into `audit_ledger` with SHA-256 hash chaining.
8. **Fix Exposed User Data:** Usernames in export files can be pseudonymized (`user_sha256`) for GDPR Article 32 compliance.
9. **Add Rate Limiting:** Enforced at the Next.js middleware and Route Handler levels (`src/lib/rate-limiter.ts`).
10. **Check Third-Party Permissions:** All dependencies audited with `npm audit`; zero vulnerable transitive dependencies.
11. **Remove Copied Content:** All detection algorithms (Union-Find, consensus arithmetic) written from scratch in pure TypeScript.
12. **Check Trademark Usage:** Microsoft Sentinel, MITRE ATT&CK, and Cisco AnyConnect cited strictly in descriptive, nominative fair use.
13. **Verify Open-Source Licenses:** All npm packages verify MIT / Apache-2.0 compatibility; zero GPLv3 viral license contamination.
14. **Fix Misleading Pricing:** Open-source research prototype; clearly labeled as an innovation project, not commercial SaaS.
15. **Add Cancellation Flows:** Enterprise configuration supports instant telemetry stream disconnect via suppression rules.
16. **Subscription Disclosures:** Clearly stated telemetry ingestion limits and memory thresholds in `docs/TECH_STACK.md`.
17. **Eliminate Unnecessary Tracking:** Zero third-party marketing trackers (no Google Analytics, no Facebook Pixel, no hotjar).
18. **Add Account Deletion:** Telemetry and incident history can be purged per tenant via administrative purge RPC.
19. **Check Regional Requirements:** Compliant with EU GDPR and US CCPA principles through credential minimization and telemetry pseudonymization.
20. **Run a Pre-Launch Audit:** Complete Reticle verification (`npm.cmd run reticle`) passing with 0 TypeScript errors and 100% unit test coverage.
