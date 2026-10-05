# SPEC.md â€” Quorum Project Specification

> **Status**: `FINALIZED`
>
> ðŸ”’ **Planning Lock**: Specification is locked and verified against Quorum PRD v4.

## Vision
Quorum is a campaign-correlation detection layer for enterprise VPN authentication telemetry. It demonstrates how Midnight Blizzard (NOBELIUM) style distributed password sprays bypass traditional SIEM threshold rules and are stopped using bipartite graph clustering and multi-family consensus arithmetic.

## Goals
1. **The 45-Second Demo Contrast** â€” Clear contrast against the identical 3-day telemetry corpus:
   - Naive Volume Rule: 0 alerts (spray stays below 5 failures/IP).
   - Loosened Threshold Rule: 97 alerts (alert fatigue, flood of false positives).
   - Quorum Consensus Engine: 1 Correlated Critical Incident (`Base 100 Ã— 1.00 + 15 â†’ 100 [CRITICAL]`).
2. **Deterministic Detection Plane** â€” Pure TypeScript algorithms with zero external ML dependencies (F5 Brute-Force, F6 Single Spray, F7 Union-Find Bipartite Graph, F10 Pivot, F13 Consensus).
3. **Cryptographic Trust & Governance** â€” F21 SHA-256 hash-chained audit ledger with post-hoc tamper detection.
4. **Enterprise Interoperability** â€” F25A Microsoft Sentinel JSON and F25B OASIS STIX 2.1 export formats.

## Non-Goals (Out of Scope)
- Black-box ML models, embeddings, or non-deterministic heuristic scoring.
- Storing or transmitting plaintext passwords, hashes, or session tokens.
- Replacing the entire enterprise SIEM (Quorum is a correlation layer, not a log warehouse).
- Fluff UI, harsh rainbow gradients, or vibecoding clichÃ©s.

## Constraints
- **Zero Raw Credentials**: Passwords, hashes, and session tokens must never be written to disk, stored in memory, or logged.
- **Deterministic Arithmetic**: Identical input packets must produce byte-identical output JSON.
- **Strict TypeScript**: 100% strict type safety, zero `any`, `tsc --noEmit` must pass cleanly.
- **True-Black UI**: Black canvas (`#000000`), technical slate cards (`#080C14`), JetBrains Mono machine typography.

## Success Criteria
- [x] 17/17 Vitest unit tests passing across all detection engines, normalizer, and audit ledger.
- [x] Zero TypeScript errors with strict checking.
- [x] SHA-256 audit ledger with tamper simulation detecting any post-hoc modification.
- [x] 45-second demo contrast clearly visible in the The Core UI.
- [x] Sentinel JSON and STIX 2.1 threat intelligence export formats operational.

## Technical Requirements

| Requirement | Priority | Notes |
|-------------|----------|-------|
| F2 Canonical Normalizer | Must-have | 6-value outcome enum, UTC normalization, IPv4/IPv6 sanitization |
| F4 Synthetic Corpus Generator | Must-have | Deterministic Pack A (benign) and Pack B (attack + pivot) |
| F7 Bipartite Campaign Graph | Must-have | Union-Find with path compression and rank optimization |
| F10 Pivot Detector | Must-have | Detects successful auth following distributed spray across IP cluster |
| F13 Multi-Family Consensus | Must-have | Bounded severity calculation with human-readable formula |
| F21 Cryptographic Ledger | Must-have | SHA-256 hash-chained immutable audit ledger |
| F25 Export Interoperability | Must-have | Microsoft Sentinel & OASIS STIX 2.1 exporters |

---

*Last updated: 2026-09-30*

