# Technology Stack

> Auto-generated for Quorum on 2026-09-30

## Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 20 LTS | Server runtime environment |
| Next.js | 14.2.15 | Full-stack App Router, Route Handlers & UI framework |
| TypeScript | 5.6.3 | Type safety, zero-any verification, interface definitions |
| React | 18.3.1 | UI library for The Core |

## Core Technologies

### Detection Plane (Pure TypeScript, Zero External Dependencies)
| Feature | System / Location | Purpose |
|---------|-------------------|---------|
| Canonical Normalizer | `src/normalize/` | Strict 6-value outcome enum, UTC normalization, IPv4/IPv6 sanitization |
| Synthetic Corpus Generator | `src/data/generator.ts` | Deterministic pseudo-random Pack A (benign) & Pack B (attack + pivot) |
| Brute-Force Detector (F5) | `src/detect/brute-force.ts` | Sliding-window single-IP high volume burst detection |
| Single Spray Detector (F6) | `src/detect/spray-single.ts` | Single IP spraying multiple target accounts |
| Bipartite Graph Clusterer (F7) | `src/detect/campaign-graph.ts` | Union-Find with path compression & rank optimization across IP/account nodes |
| Post-Spray Pivot Detector (F10)| `src/detect/pivot.ts` | Detects instant authentication success on sprayed accounts |
| Multi-Family Consensus (F13) | `src/detect/consensus.ts` | Multi-family consensus arithmetic with human-readable formula string |

### Trust, Interoperability & Governance
| Feature | System / Location | Purpose |
|---------|-------------------|---------|
| SHA-256 Audit Ledger (F21) | `src/lib/crypto/` | Hash-chained tamper-evident verification ledger |
| Microsoft Sentinel Exporter (F25A) | `src/lib/export/sentinel.ts` | Formats correlated incidents into native Sentinel JSON |
| OASIS STIX 2.1 Exporter (F25B) | `src/lib/export/stix.ts` | Threat intelligence bundle generation |
| Multi-Model AI Router | `src/lib/ai/router.ts` | Resilient router with circuit breaker (Gemini/Claude/OpenAI) |

## Dependencies

### External Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.2.15 | Full-stack framework |
| react | 18.3.1 | Core UI library |
| zod | 3.23.8 | Strict server input validation schemas |
| lucide-react | 0.453.0 | Technical icons for The Core UI |
| clsx | 2.1.1 | Conditional class merging |
| tailwind-merge | 2.5.4 | Conflict-free Tailwind class resolution |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| typescript | 5.6.3 | Static type checker |
| vitest | 2.1.2 | Fast unit testing runner |
| tailwindcss | 3.4.13 | Utility-first CSS styling engine |
| eslint | 8.57.0 | Code quality and linting |

---

*Last updated: 2026-09-30*

