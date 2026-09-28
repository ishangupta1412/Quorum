# Quorum — PRD Review & Improvement Strategy
**Microsoft Innovate 2026 · Redmond Labs**

---

## Executive Summary

This review analyzes `Quorum_PRD_v4.md` against hackathon judging criteria, production security standards, and real-world SOC feasibility. The PRD is exceptionally detailed (1,200+ lines, mathematical definitions, strict boundary contracts), but requires specific execution guardrails and strategic refinements to ensure a definitive win at Microsoft Innovate 2026.

---

## 1. Core PRD Strengths

| Dimension | Assessment | Impact on Judges |
|---|---|---|
| **Problem Formulation** | Grounds problem in the Midnight Blizzard (NOBELIUM) VPN password spray attack. | Instant credibility with Microsoft enterprise security judges. |
| **Architectural Discipline** | Pure TypeScript detection plane; zero external heavy ML dependencies; deterministic consensus arithmetic. | Eliminates "black box" skepticism; 100% inspectable and unit-testable. |
| **Demo Contrast** | Explicit 3-way contrast: Naive SIEM rule (0 alerts) vs Loosened threshold (97 alerts) vs Quorum (1 correlated Critical incident). | 45-second high-impact demonstration that immediately wins attention. |
| **Evidence & Cryptography** | Hash-chained audit ledger (`audit_ledger`) with tamper-evident SHA-256 verification and trigger locks. | Enterprise trust proof that prevents post-facto log tampering. |
| **Honest Scope** | Explicit Kill List (LLM incident narratives cut in favor of deterministic template strings; entity deep-dives cut). | Prevents demo-day crashes and hallucinations on stage. |

---

## 2. Identified Vulnerabilities & High-Value Improvements

### A. Attack Generation & Test Realism (F4)
- **Current PRD:** Synthetic generator produces labeled Pack A and Pack B with 1,200 users and 8 attack scenarios.
- **Improvement:** 
  1. Implement realistic residential proxy subnet distributions (CIDR /24 variations, ISP ASN diversity) so the bipartite graph cluster test is mathematically robust against realistic CIDR grouping.
  2. Include organic noise corner cases: VPN reconnection churn, ISP geo-IP flapping, and dual-auth mobile app timeouts to stress-test the normalizer (`F2`).

### B. Fallback Strategy for Stage Wi-Fi & Live Latency
- **Current PRD:** Relies on local Supabase instance (`supabase start`) with fallback to 5s polling if Supabase Realtime websocket flakes.
- **Improvement:**
  1. Package a self-contained SQLite / In-Memory TypeScript mock layer switchable via a single environment flag (`NEXT_PUBLIC_DEMO_OFFLINE=true`) to guarantee 100% offline air-gapped demo capability if Docker/Supabase restarts during stage setup.
  2. Pre-seed the exact Pack B state into client memory snapshot for sub-50ms instant UI rendering.

### C. The 11 P0 Spine vs "Vibe Coding" Pitfalls
- **PRD Guardrail:** The UI must adhere strictly to the "Dark Intelligence Terminal" aesthetic.
- **Improvement:**
  1. Replace any generic charts with bespoke SVG/Canvas bipartite attack graph visualizations.
  2. Implement strict skeleton loaders for all asynchronous calculations.
  3. Ensure all numbers (A2TP, recall, precision, severity score) display the exact arithmetic breakdown in an expandable tooltip or inspector panel.

### D. Interoperability & Microsoft Ecosystem Alignment (F25)
- **Current PRD:** Deterministic Sentinel JSON and STIX 2.1 offline export builders.
- **Improvement:**
  1. Include copy-paste ready KQL (Kusto Query Language) rules in the UI sidebar for instant side-by-side comparison.
  2. Highlight the exact KQL architectural gap: *"KQL evaluates row-by-row or time-binned tables; it cannot run Union-Find bipartite graph clustering or seasonal Median/MAD baselines across heterogeneous auth streams in real time."*

---

## 3. The 11 P0 Feature Checklist & Gate Status

```
[Phase 1] Core Ingestion & Normalization
  ├── F1: Multi-format ingest + rejection bucket (JSON lines, CSV, Syslog)
  ├── F2: Canonical AuthEvent normalizer (UTC, IP unwrapping, RFC1918 scope)
  └── F4: Deterministic synthetic generator & Pack A/B corpus

[Phase 2] Detection Plane (Pure TypeScript)
  ├── F5: Sliding-window brute force detector (Baseline rule)
  ├── F6: Single-source password spray detector (Loosened rule)
  ├── F7: Bipartite campaign graph (Union-Find clustering) [FLAGSHIP]
  ├── F10: Post-spray pivot detector (Auth failure cluster -> auth success)
  └── F13: Quorum consensus severity engine (Deterministic equation)

[Phase 3] Analyst Cockpit & Enterprise Trust
  ├── F15/F16: Incident triage dashboard + interactive evidence timeline
  ├── F21: Hash-chained audit ledger + live tamper demonstration
  └── F22: Quality gates & honest limitations panel

[Phase 4] Trust Extras (Post-P0)
  ├── F14: Suppression & tuning workbench (<60s recompute)
  └── F25: Sentinel JSON / STIX 2.1 deterministic export + KQL gap docs
```

---

## 4. Implementation Next Steps

1. **Security & Standards Documentation:**
   - `docs/SECURITY.md`: Zero-trust policies, RLS definitions, credential scrubbing, sanitized inputs.
   - `docs/DATABASE.md`: Postgres schema, constraints, indexes, hash-chain triggers, and migration plans.
   - `docs/CODE_STYLE.md`: Strict TypeScript rules, zero `any` policy, error handling conventions.
   - `docs/API_GUIDE.md`: Route Handlers, payload validation with Zod, and rate limiting.

2. **Project Initialization:**
   - Initialize Next.js 14 App Router project with TypeScript and Tailwind CSS.
   - Set up Vitest for pure detection engine unit tests.
   - Implement the `AuthEvent` canonical interface and normalizer first.
