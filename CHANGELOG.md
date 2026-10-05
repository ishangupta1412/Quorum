# Changelog

All notable changes to Quorum are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.0.0] — 2026-10-06

### Added
- **F25 Export Suite** — STIX 2.1 bundle, Microsoft Sentinel ARM payload, RFC 4180 CSV
  - `GET /api/v1/export/stix?incidentId=` — deterministic UUIDv5 bundle per incident
  - `GET /api/v1/export/csv?incidentId=` — RFC 4180 compliant single or batch CSV
  - `POST /api/v1/sentinel/webhook` — Zod-validated Sentinel ingestion endpoint
- **Raw Evidence Modal** — one-click inspector for STIX 2.1, Sentinel JSON, CSV, and raw incident data with clipboard copy and download
- **Audio Cues** — procedural Web Audio API sounds for SOC triage events (zero external assets)
  - Threat alert: 880Hz → 440Hz sweep on Critical/High incident detection
  - Pivot chime: ascending triad on F10 pivot confirmation
  - Dispatch sound: confirmation chime on Sentinel webhook dispatch
  - Telemetry tick: subtle 15ms impulse during event ingestion
- **AudioControl** component in CoreNav bottom rail — persists mute state to localStorage
- **Forensics page** — Intel & Interop card with Inspect STIX 2.1 & Sentinel button
- Red-team test suite: timing exhaustion, pivot false-positive exploits, ingestion boundary attacks, determinism invariants

### Fixed
- CoreNav text clipping — widened to 72px, typography updated to `text-[9px] font-mono`
- Global layout padding `pl-[72px]` applied to all core pages
- Forensics page JSX tag mismatch in Intelligence & Interop card
- `exportToCsv` → `exportIncidentToCsv` incorrect function name in route and modal

### Changed
- `tsconfig.test.json` excludes `src/lib/sound/**` — browser APIs unavailable in Node test env

---

## [3.0.0] — 2026-09-20

### Added
- **F21 SHA-256 Hash-Chained Audit Ledger** — tamper detection in O(n)
- **F15 Baseline Contrast Comparators** — Naive vs. Loosened vs. Quorum side-by-side
- **Forensics** page — ledger visualization, tamper simulation, chain verification
- **Analysis** page — per-event evidence stream with severity timeline
- Ralph Loop regression suite — three-pass ground truth assertion (Pack A, Pack B, tamper)

---

## [2.0.0] — 2026-09-01

### Added
- **F7 Bipartite Graph Spray Detector** — Union-Find clustering, multi-IP distributed spray
- **F10 Pivot Detector** — post-spray SUCCESS within 2h window confirms credential compromise
- **F13 Multi-Family Consensus Engine** — `Base x Multiplier + PivotBonus` scoring
- **Nexus** page — interactive D3 bipartite graph with community clustering
- **SentinelDispatcher** — webhook client component with live status

---

## [1.0.0] — 2026-08-15

### Added
- **F2 Canonical AuthEvent Normalizer** — credential stripping, IPv4-mapped IPv6 unwrapping, UTC normalization
- **F5 Single-Source Burst Detector** — >50 failures/15min threshold
- **Core** SOC console with detection pipeline runner
- **Pack A** (benign corpus) and **Pack B** (NOBELIUM attack corpus) synthetic generators
- Next.js 14 App Router foundation, TypeScript strict mode, Zod validation
