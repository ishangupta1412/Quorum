# Quorum â€” Code Style & Engineering Standards
**TypeScript Strict Mode Â· Microsoft Innovate 2026**

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
â”œâ”€â”€ app/                  # Next.js 14 App Router (pages & layout)
â”‚   â”œâ”€â”€ api/              # Route Handlers (Server-side endpoints)
â”‚   â””â”€â”€ core/          # The Core UI pages
â”œâ”€â”€ components/           # Reusable React components (Tailwind + Lucide/OriginKit)
â”‚   â”œâ”€â”€ core/          # Domain-specific The Core widgets
â”‚   â””â”€â”€ ui/               # Primitive UI tokens (Buttons, Cards, Badges)
â”œâ”€â”€ detect/               # Pure TypeScript Detection Plane
â”‚   â”œâ”€â”€ brute-force.ts    # F5: Sliding-window brute force
â”‚   â”œâ”€â”€ spray-single.ts   # F6: Single-source password spray
â”‚   â”œâ”€â”€ campaign-graph.ts # F7: Bipartite graph Union-Find clusterer
â”‚   â”œâ”€â”€ pivot.ts          # F10: Post-spray pivot detector
â”‚   â””â”€â”€ consensus.ts      # F13: Quorum consensus severity engine
â”œâ”€â”€ normalize/            # Ingestion & Canonicalization (F1, F2)
â”‚   â”œâ”€â”€ normalizer.ts     # AuthEvent normalizer
â”‚   â””â”€â”€ parsers/          # CSV, Syslog, JSONL parsers
â”œâ”€â”€ lib/                  # Shared utilities
â”‚   â”œâ”€â”€ supabase/         # Supabase client (client & server instances)
â”‚   â”œâ”€â”€ crypto/           # SHA-256 hash chaining & verification
â”‚   â””â”€â”€ export/           # Sentinel JSON and STIX 2.1 serialization
â””â”€â”€ types/                # Canonical TypeScript types & interfaces
    â””â”€â”€ auth-event.ts     # AuthEvent, Signal, Incident, AuditRecord definitions
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

