# Quorum â€” Tech Stack Document
**Microsoft Innovate 2026 Â· Redmond Labs**

---

## Table of Contents

1. [Stack Decision Summary](#1-stack-decision-summary)
2. [Core Stack](#2-core-stack)
3. [Detection Plane](#3-detection-plane)
4. [Database & Backend](#4-database--backend)
5. [Frontend & UI Libraries](#5-frontend--ui-libraries)
6. [Testing Stack](#6-testing-stack)
7. [CI/CD & DevOps](#7-cicd--devops)
8. [Security Tools](#8-security-tools)
9. [Development Tools](#9-development-tools)
10. [Package Install Commands](#10-package-install-commands)
11. [Environment Variables](#11-environment-variables)
12. [Folder Structure](#12-folder-structure)

---

## 1. Stack Decision Summary

| Dimension | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server Components + Route Handlers; Vercel free-tier deploy |
| Database | Supabase (Postgres 15) | RLS, Realtime, Auth, Storage â€” all in one free-tier project |
| Language | TypeScript strict | `tsc --strict`, zero `any` in detection plane |
| Detection plane | Pure TypeScript, zero dependencies | No ML framework, no compiled extensions, fully unit-testable |
| Auth | Supabase Auth (2 roles) | `analyst` + `admin` â€” JWT evaluated server-side in RLS |
| Deployment | Vercel (free tier) | Zero server/container config; demo runs offline on `supabase start` |
| Testing | Vitest + Playwright | Vitest for pure detection functions; Playwright for 3 e2e journeys |
| Styling | Tailwind CSS v3 | Utility-first, matches 21st.dev component patterns |
| Package manager | pnpm | Faster installs, strict peer-dep resolution |

---

## 2. Core Stack

```
Next.js 14          â†’ App Router, Server Components, Route Handlers
TypeScript 5.x      â†’ strict mode, no any in src/detect/
Supabase            â†’ Postgres 15, Auth, Realtime, Storage
Vercel              â†’ Production deploy (never the live demo dependency)
pnpm                â†’ Package manager
```

### Node Version

```
Node.js >= 20.x LTS
```

---

## 3. Detection Plane

> The detection plane has ZERO runtime npm dependencies. It is pure TypeScript
> that runs in-process inside Next.js Route Handlers.

| Module | File | Dependencies |
|---|---|---|
| AuthEvent normalizer (F2) | `src/detect/normalize.ts` | None |
| Brute-force rule (F5) | `src/detect/bruteForce.ts` | None |
| Single-source spray rule (F6) | `src/detect/spray.ts` | None |
| Campaign graph Union-Find (F7) | `src/detect/campaignGraph.ts` | None |
| Baseline engine (F11) | `src/detect/baseline.ts` | None |
| ML vector scorer (F12) | `src/detect/mlScorer.ts` | None |
| Pivot detector (F10) | `src/detect/pivot.ts` | None |
| Quorum severity engine (F13) | `src/detect/quorum.ts` | None |
| Types | `src/detect/types.ts` | `zod` (validation only) |

### Validation

```bash
# Must always pass â€” enforced in CI
tsc --strict --noEmit
```

---

## 4. Database & Backend

### Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Local development (offline demo)
supabase start

# Check status
supabase status

# Apply migrations
supabase db push

# Generate TypeScript types from DB schema
supabase gen types typescript --local > src/lib/database.types.ts
```

### Key Supabase Features Used

| Feature | Use |
|---|---|
| Postgres 15 | All tables with RLS on every one |
| Supabase Auth | 2 seeded roles: `analyst`, `admin` |
| Supabase Realtime | Incident queue live updates |
| Supabase Storage | Sealed Pack B manifest + export files |
| RPCs (SECURITY DEFINER) | `commit_detection_batch`, `submit_verdict` |
| Row Level Security | Every table â€” `auth.jwt() ->> 'role'` evaluated server-side |

### Environment Variables

```env
# .env.local (NEVER commit this file)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>   # safe to expose â€” RLS scoped

# Server-only (NEVER in client bundle)
SUPABASE_SERVICE_ROLE_KEY=<service-role>   # used only in Route Handlers
SUPABASE_JWT_SECRET=<jwt-secret>

# Demo mode flag
NEXT_PUBLIC_DEMO_MODE=true   # enables tamper fixture + demo routes
                              # MUST be unset on production Vercel deploy
```

---

## 5. Frontend & UI Libraries

### Core UI

```bash
pnpm add tailwindcss postcss autoprefixer
pnpm add @tailwindcss/typography
pnpm add geist                          # Next.js native font
```

### Component Libraries

```bash
# 21st.dev â€” install components individually via their CLI
npx shadcn-ui@latest init              # base (21st.dev uses shadcn patterns)

# Lenis smooth scroll
pnpm add lenis

# Spline 3D (landing hero only)
pnpm add @splinetool/react-spline @splinetool/runtime

# Framer Motion (for 21st.dev animated components)
pnpm add framer-motion

# Animate UI (install from GitHub)
# https://animate-ui.com â€” copy components directly into src/components/animate-ui/
```

### Fonts (Google Fonts + local)

```tsx
// app/layout.tsx
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
// JetBrains Mono via Google Fonts in globals.css
```

### Data / State

```bash
pnpm add @supabase/supabase-js         # Supabase client
pnpm add @supabase/ssr                 # Server-side Supabase helpers for Next.js
pnpm add zod                           # Schema validation (AuthEvent, Signal types)
pnpm add recharts                      # Activity-over-time chart (F16)
```

---

## 6. Testing Stack

```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @testing-library/react @testing-library/user-event
pnpm add -D playwright @playwright/test
```

### Vitest Config

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',         // detection plane â€” pure Node
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/detect/**'],
      threshold: { lines: 90 }   // 90% coverage on detection plane
    }
  }
})
```

### Test Count Target

| Suite | Count | Runner |
|---|---|---|
| Detection plane unit tests | â‰¥ 130 | Vitest |
| RLS + security adversarial tests | â‰¥ 30 | Vitest against local Supabase |
| E2e journeys | 3 | Playwright |

### 3 Playwright E2E Journeys (Appendix E)

1. **Ingest â†’ Detection â†’ Queue** â€” upload corpus, run pipeline, verify incident appears in queue
2. **Incident Detail â†’ Verdict Staging** â€” open incident, read equation, stage a verdict with confirmation modal
3. **Audit Tamper Demo** â€” click tamper button, verify chain breaks and localizes broken row < 3s

---

## 7. CI/CD & DevOps

### GitHub Actions Pipeline

```yaml
# .github/workflows/ci.yml

name: CI
on: [push, pull_request]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --strict --noEmit
      - run: pnpm eslint .

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }    # full history scan
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          extra_args: --only-verified

  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm audit --audit-level=high

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm vitest run --coverage

  build:
    runs-on: ubuntu-latest
    needs: [lint-typecheck, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm next build

  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4
      - run: pnpm playwright install --with-deps
      - run: pnpm playwright test
```

### Merge Rules

- All jobs must be green before merge to `main`
- Any PR touching `/supabase/migrations` requires the `security-sql-reviewed` label
- No direct commits to `main`

### Vercel Deploy

```bash
# One-time setup
npx vercel link
npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
npx vercel env add SUPABASE_JWT_SECRET production
# NEXT_PUBLIC_DEMO_MODE is NOT set on production deploy
```

---

## 8. Security Tools

### STIX Tool (GitHub)

```bash
# Install STIX tool for security testing
# https://github.com/oasis-tcs/stix2-patterns
pip install stix2-patterns

# Validate Quorum's STIX 2.1 exports
stix2-patterns --file exports/stix-bundle.json
```

### TruffleHog (Secret Scanning)

```bash
# Run locally before every commit
docker run --rm -it -v "$PWD:/pwd" trufflesecurity/trufflehog:latest \
  filesystem /pwd --only-verified
```

### npm Audit

```bash
pnpm audit --audit-level=high
# Blocks build on any HIGH or CRITICAL vulnerability
```

### CodeRabbit (GitHub PR Review)

Install from GitHub Marketplace: https://github.com/marketplace/coderabbit

```yaml
# .coderabbit.yaml
language: en-US
reviews:
  auto_review:
    enabled: true
    drafts: false
  request_changes_workflow: true
chat:
  auto_reply: true
```

### Rate Limiting

```ts
// lib/rateLimit.ts â€” app-level rate limiting (backs Supabase Auth)
// 5 failed attempts / IP / 5 minutes â†’ 429
// Stored in Postgres so it survives serverless cold starts
```

---

## 9. Development Tools

### ESLint Config

```bash
pnpm add -D eslint eslint-config-next @typescript-eslint/eslint-plugin
```

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Prettier

```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

### VSCode Settings (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Recommended VSCode Extensions

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "supabase.vscode-supabase",
    "vitest.explorer",
    "ms-playwright.playwright"
  ]
}
```

---

## 10. Package Install Commands

### Initial Setup

```bash
# 1. Create Next.js app
pnpm create next-app@latest quorum --typescript --tailwind --app --src-dir --import-alias "@/*"
cd quorum

# 2. Install core dependencies
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zod
pnpm add geist
pnpm add lenis
pnpm add framer-motion
pnpm add recharts
pnpm add @splinetool/react-spline @splinetool/runtime

# 3. Install dev dependencies
pnpm add -D vitest @vitest/ui @vitest/coverage-v8
pnpm add -D @testing-library/react @testing-library/user-event
pnpm add -D playwright @playwright/test
pnpm add -D eslint-config-next @typescript-eslint/eslint-plugin
pnpm add -D prettier prettier-plugin-tailwindcss

# 4. Install Supabase CLI (global)
npm install -g supabase

# 5. Initialize Supabase
supabase init
supabase start
```

### `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --strict --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "gen:pack-a": "tsx src/generator/index.ts --pack A --seed 42 --users 1200 --days 14",
    "gen:pack-b": "tsx src/generator/index.ts --pack B --seed 1337 --users 1200 --days 14",
    "db:types": "supabase gen types typescript --local > src/lib/database.types.ts",
    "db:push": "supabase db push",
    "audit:secrets": "docker run --rm -it -v $PWD:/pwd trufflesecurity/trufflehog:latest filesystem /pwd --only-verified",
    "gate-runner": "tsx src/evaluation/gateRunner.ts"
  }
}
```

---

## 11. Environment Variables

### Full `.env.example` (commit this â€” no real values)

```env
# Supabase â€” local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Supabase â€” server-only (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Demo mode â€” enables tamper fixture, demo routes
# Set to true locally, NEVER set on Vercel production deploy
NEXT_PUBLIC_DEMO_MODE=false

# Corpus seals (set after generator runs)
PACK_B_SHA256=
PACK_B_SEALED_AT=
```

---

## 12. Folder Structure

```
quorum/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ detect/                  # Detection plane â€” pure TypeScript
â”‚   â”‚   â”œâ”€â”€ types.ts             # AuthEvent, Signal, Incident interfaces
â”‚   â”‚   â”œâ”€â”€ normalize.ts         # F2 â€” AuthEvent normalizer
â”‚   â”‚   â”œâ”€â”€ bruteForce.ts        # F5 â€” Sliding-window brute-force rule
â”‚   â”‚   â”œâ”€â”€ spray.ts             # F6 â€” Single-source spray rule
â”‚   â”‚   â”œâ”€â”€ campaignGraph.ts     # F7 â€” Union-Find bipartite graph
â”‚   â”‚   â”œâ”€â”€ baseline.ts          # F11 â€” Median/MAD baseline engine
â”‚   â”‚   â”œâ”€â”€ mlScorer.ts          # F12 â€” Unsupervised vector anomaly scorer
â”‚   â”‚   â”œâ”€â”€ pivot.ts             # F10 â€” Post-spray pivot detector
â”‚   â”‚   â””â”€â”€ quorum.ts            # F13 â€” Quorum severity engine
â”‚   â”œâ”€â”€ generator/               # F4 â€” Deterministic corpus generator
â”‚   â”‚   â””â”€â”€ index.ts
â”‚   â”œâ”€â”€ ingest/                  # F1 â€” Multi-format ingest
â”‚   â”‚   â”œâ”€â”€ parser.ts
â”‚   â”‚   â””â”€â”€ rejection.ts
â”‚   â”œâ”€â”€ evaluation/              # F22 â€” Gate runner
â”‚   â”‚   â””â”€â”€ gateRunner.ts
â”‚   â”œâ”€â”€ export/                  # F25 â€” Sentinel / STIX exports
â”‚   â”‚   â”œâ”€â”€ sentinel.ts
â”‚   â”‚   â””â”€â”€ stix.ts
â”‚   â””â”€â”€ lib/
â”‚       â”œâ”€â”€ supabase.ts          # Client/server Supabase helpers
â”‚       â””â”€â”€ database.types.ts    # Auto-generated from supabase gen types
â”œâ”€â”€ app/                         # Next.js App Router
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”œâ”€â”€ page.tsx                 # Landing hero (Screen 1)
â”‚   â”œâ”€â”€ incidents/
â”‚   â”‚   â”œâ”€â”€ page.tsx             # Incident queue â€” F15 (Screen 2)
â”‚   â”‚   â””â”€â”€ [id]/page.tsx        # Incident detail â€” F16 (Screen 3)
â”‚   â”œâ”€â”€ audit/
â”‚   â”‚   â””â”€â”€ page.tsx             # Audit ledger â€” F21 (Screen 4)
â”‚   â”œâ”€â”€ quality/
â”‚   â”‚   â””â”€â”€ page.tsx             # Quality gates â€” F22 (Screen 5)
â”‚   â”œâ”€â”€ admin/
â”‚   â”‚   â””â”€â”€ tuning/page.tsx      # F14 tuning workbench
â”‚   â””â”€â”€ api/
â”‚       â”œâ”€â”€ ingest/route.ts      # F1 ingest endpoint
â”‚       â”œâ”€â”€ detect/route.ts      # Detection pipeline trigger
â”‚       â””â”€â”€ verify/route.ts      # F21 chain verification
â”œâ”€â”€ supabase/
â”‚   â”œâ”€â”€ migrations/              # All schema migrations
â”‚   â”‚   â”œâ”€â”€ 001_core_tables.sql
â”‚   â”‚   â”œâ”€â”€ 002_rls_policies.sql
â”‚   â”‚   â”œâ”€â”€ 003_audit_ledger.sql
â”‚   â”‚   â””â”€â”€ 004_rpcs.sql
â”‚   â”œâ”€â”€ seed.sql                 # Analyst + admin role seeding
â”‚   â””â”€â”€ config.toml
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ detect/                  # Vitest unit tests (â‰¥130 tests)
â”‚   â”œâ”€â”€ security/                # RLS adversarial tests
â”‚   â””â”€â”€ e2e/                     # Playwright journeys
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ DESIGN_DOC.md
â”‚   â”œâ”€â”€ TECH_STACK.md
â”‚   â”œâ”€â”€ SECURITY.md
â”‚   â”œâ”€â”€ CODE_STYLE.md
â”‚   â”œâ”€â”€ DATABASE.md
â”‚   â””â”€â”€ API_GUIDE.md
â”‚   â””â”€â”€ kql/                     # F25 KQL reference files
â”œâ”€â”€ .github/
â”‚   â”œâ”€â”€ workflows/ci.yml
â”‚   â””â”€â”€ .coderabbit.yaml
â”œâ”€â”€ .env.example
â”œâ”€â”€ .env.local                   # GITIGNORED â€” never commit
â”œâ”€â”€ .gitignore
â””â”€â”€ README.md
```

---

## 13. Master Single-Task Execution Roadmap (One Task at a Time)

To avoid regressions, state drift, and context pollution, engineering on Quorum follows the strict **Single-Task Execution Protocol**:
- Only ONE task may be in progress at any given moment.
- Every task must conclude with the **Reticle Verification Loop**: `npm.cmd run reticle` (`tsc --noEmit && vitest run`).
- No task is marked complete unless 0 TypeScript errors exist and 100% of unit tests pass.

### Execution Tasks:

- [x] **TASK-01: Canonical Normalizer & Ingestion Plane (F1, F2)**
  - Strict UTC timestamp conversion, IPv4-mapped IPv6 unwrapping, RFC1918 scope tagging.
  - Zero raw credentials persisted; drop passwords prior to hash computation.
  - *Verification:* `npm.cmd test` passes 7/7 normalizer tests.

- [x] **TASK-02: Deterministic Synthetic Corpus Generator (F4)**
  - Synthetic Pack A (baseline organic traffic) & Pack B (organic + 20-proxy distributed spray attack).
  - Byte-reproducible generation with fixed seed.
  - *Verification:* Unit test asserts exact benign/attack event ratio.

- [x] **TASK-03: Sliding-Window Brute Force & Single-Source Spray Detectors (F5, F6)**
  - F5 detects high-volume brute force bursts (> 5 failures/IP).
  - F6 detects loosened single-source spray.
  - *Verification:* Unit tests assert correct signal generation for isolated IP attacks.

- [x] **TASK-04: Bipartite Campaign Graph Union-Find Clusterer (F7) [FLAGSHIP]**
  - Pure TypeScript Union-Find disjoint-set data structure.
  - Correlates disjoint residential proxies attacking overlapping corporate accounts into connected components.
  - *Verification:* Unit test asserts cluster formation across 20 proxies targeting 45 accounts.

- [x] **TASK-05: Post-Spray Pivot Detector (F10)**
  - Correlates auth failure clusters with subsequent successful auth on the same account.
  - Confirms post-spray account compromise.
  - *Verification:* Unit test detects `marcus.chen` compromise following spray.

- [x] **TASK-06: Multi-Family Consensus Severity Engine (F13)**
  - Calculates deterministic severity equation: $\text{Base} \times \text{Multiplier} + \text{Boost}$.
  - Enforces Critical floor (score $\ge 80$) when F10 pivot is present.
  - *Verification:* Unit test asserts severity score = 100 [CRITICAL].

- [x] **TASK-07: Cryptographic Hash-Chained Audit Ledger (F21)**
  - SHA-256 hash chaining where record $N$ hashes record $N-1$.
  - Post-hoc tamper detection pinpoints the exact tampered record index.
  - *Verification:* Unit test asserts genesis chain validation and tamper detection.

- [x] **TASK-08: Interoperability Export Builders (F25)**
  - Microsoft Sentinel Incident JSON builder.
  - OASIS STIX 2.1 Threat Intel Bundle builder with MITRE ATT&CK T1110.003 mapping.
  - *Verification:* Validated against STIX 2.1 JSON schema.

- [x] **TASK-09: Multi-Model AI Router & Token Preservation Layer**
  - Supports Gemini, Claude, OpenAI, Hermes, Ollama, FreeLLMAPI.
  - In-memory circuit breaker and instant deterministic rule-based fallback for air-gapped demo resilience.
  - *Verification:* Zero crashes when offline or without API keys.

- [x] **TASK-10: Route Handlers & Server-Side Security Hardening**
  - Token-bucket rate limiting on `/api/v1/ingest`, `/api/v1/detect/run`, `/api/v1/ai/route`.
  - Strict 10MB payload size limits and Zod schema validation.
  - Type-safe generic error responses without stack trace leakage.
  - *Verification:* `npm.cmd run typecheck` passes with zero errors.

- [x] **TASK-11: The Core UI (App Router)**
  - 45-Second Demo Contrast Ticker (0 Naive vs 97 Loosened vs 1 Quorum).
  - Inspectable mathematical severity equation breakdown.
  - Cryptographic audit ledger with live tamper demonstration.
  - 21st.dev / OriginKit / Inspira UI / Skipper UI technical dark terminal styling.
  - *Verification:* Full UI builds cleanly, zero console errors.

- [x] **TASK-12: Full Reticle Pre-Launch CI Verification**
  - Automated GitHub Actions workflow (`.github/workflows/reticle-verify.yml`).
  - CodeRabbit configuration (`.coderabbit.yaml`).
  - Secret scanning for zero exposed keys.
  - *Verification:* `npm.cmd run reticle` exits with code 0.

---

*Quorum Tech Stack Document â€” Redmond Labs Â· Microsoft Innovate 2026 Â· v4.0.0*


