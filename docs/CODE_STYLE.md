# Quorum — Code Style & Engineering Standards
**TypeScript Strict Mode · Microsoft Innovate 2026**

---

## 1. Golden Rules

1. **Zero `any` in Detection & Ingestion:** Every function in `src/detect/`, `src/normalize/`, and `src/eval/` must have explicit parameter and return types.
2. **Pure Functions for Detection:** Detection algorithms must not produce side effects (no direct DB writes, no network calls, no mutating passed arrays). They take `AuthEvent[]` and return `Signal[]` or `Incident[]`.
3. **Immutability First:** Use `readonly` arrays, Object spread, and functional array methods (`map`, `filter`, `reduce`) instead of state mutations.
4. **Explicit Error Boundaries:** Never catch errors silently. Use typed error classes with domain codes (`NormalizationError`, `ClusteringError`, `AuditVerificationError`).
5. **No Blind Dependencies:** The core detection plane (`src/detect/`) must have **zero external runtime dependencies** (no Lodash, no ML libraries). Only standard TypeScript and Web APIs.

---

## 2. Directory Conventions

```
src/
├── app/                  # Next.js 14 App Router (pages & layout)
│   ├── api/              # Route Handlers (Server-side endpoints)
│   └── cockpit/          # Analyst Cockpit UI pages
├── components/           # Reusable React components (Tailwind + Lucide/OriginKit)
│   ├── cockpit/          # Domain-specific cockpit widgets
│   └── ui/               # Primitive UI tokens (Buttons, Cards, Badges)
├── detect/               # Pure TypeScript Detection Plane
│   ├── brute-force.ts    # F5: Sliding-window brute force
│   ├── spray-single.ts   # F6: Single-source password spray
│   ├── campaign-graph.ts # F7: Bipartite graph Union-Find clusterer
│   ├── pivot.ts          # F10: Post-spray pivot detector
│   └── consensus.ts      # F13: Quorum consensus severity engine
├── normalize/            # Ingestion & Canonicalization (F1, F2)
│   ├── normalizer.ts     # AuthEvent normalizer
│   └── parsers/          # CSV, Syslog, JSONL parsers
├── lib/                  # Shared utilities
│   ├── supabase/         # Supabase client (client & server instances)
│   ├── crypto/           # SHA-256 hash chaining & verification
│   └── export/           # Sentinel JSON and STIX 2.1 serialization
└── types/                # Canonical TypeScript types & interfaces
    └── auth-event.ts     # AuthEvent, Signal, Incident, AuditRecord definitions
```

---

## 3. Naming Conventions

| Entity | Pattern | Example |
|---|---|---|
| Types & Interfaces | PascalCase | `AuthEvent`, `DetectionSignal`, `QuorumIncident` |
| Functions & Methods | camelCase | `normalizeAuthEvent()`, `clusterBipartiteGraph()` |
| React Components | PascalCase | `IncidentCard.tsx`, `AuditChainInspector.tsx` |
| Constants & Enums | UPPER_SNAKE_CASE | `SEVERITY_FLOOR_PIVOT`, `MAX_SUPPRESSION_WINDOW_HOURS` |
| Files (utility/engine) | kebab-case | `campaign-graph.ts`, `audit-ledger.ts` |

---

## 4. Linting & Formatting Commands

```bash
# Type check without emitting files
pnpm tsc --noEmit

# Run Vitest unit tests on detection engine
pnpm test

# Run ESLint check
pnpm lint
```
