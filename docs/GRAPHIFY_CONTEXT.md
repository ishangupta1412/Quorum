# Quorum â€” Graphify Knowledge Graph Context
**Project:** Quorum Â· Campaign-Correlation Detection Layer for VPN Authentication Telemetry  
**Event:** Microsoft Innovate 2026 Â· Redmond Labs  
**Version:** 4.2.0 (Last sync: 2026-09-29 Â· Freebuff security pass merged Â· All 54 tests passing Â· TypeScript clean)

> **How to use this doc:** Paste the "Universal Prompt Header" (Section 5) at the top of any task you send to an external AI agent (Freebuff, OpenCode, Claude, Manus, Ollama). The agent receives full type contracts, architectural constraints, and a build-status snapshot â€” no manual re-explanation needed.

---

## 1. System Architecture (Mermaid Topology)

```mermaid
graph TD
    subgraph Ingestion_Plane [1. Ingestion & Normalization Plane]
        RAW[Raw Telemetry: Syslog / JSONL / CSV] --> F1[F1: Multi-Format Ingestion Parser]
        F1 --> F2[F2: Canonical AuthEvent Normalizer]
        F2 --> CORPUS[Synthetic Corpus: Pack A / Pack B sealed]
    end

    subgraph Detection_Plane [2. Pure TypeScript Detection Plane â€” ZERO external deps]
        CORPUS --> F5[F5: Sliding-Window Brute-Force Detector]
        CORPUS --> F6[F6: Single-Source Spray Detector]
        CORPUS --> F7[F7: Bipartite Campaign Graph Union-Find â€” FLAGSHIP]
        CORPUS --> F10[F10: Post-Spray Pivot Detector]

        F5 --> SIGNALS[Signals Array]
        F6 --> SIGNALS
        F7 --> SIGNALS
        F10 --> SIGNALS

        SIGNALS --> F13[F13: Quorum Multi-Family Consensus Severity Engine]
        F13 --> INCIDENTS[Correlated Incidents Array]
    end

    subgraph Trust_Plane [3. Evidence & Governance Plane]
        INCIDENTS --> F21[F21: SHA-256 Hash-Chained Audit Ledger]
        INCIDENTS --> F25A[F25A: Microsoft Sentinel JSON Exporter]
        INCIDENTS --> F25B[F25B: OASIS STIX 2.1 Threat Intel Exporter]
    end

    subgraph The Core_Plane [4. The Core UI & API]
        INCIDENTS --> The Core[The Core â€” Next.js 14 App Router]
        The Core --> ROUTER[Multi-Model AI Router: Gemini / Claude / Hermes / Ollama / FreeLLM]
        ROUTER --> FALLBACK[Deterministic Rule-Based Fallback Engine]
    end
```

---

## 2. Build Status (Live Snapshot)

### âœ… Fully Built & Test-Covered

| ID | Feature | File(s) | Tests |
|---|---|---|---|
| F2 | Canonical AuthEvent Normalizer | `src/normalize/parsers.ts` | 7 passing |
| F4 | Deterministic Synthetic Corpus Generator | `src/data/generator.ts` | 2 passing |
| F5 | Sliding-Window Brute-Force Detector | `src/detect/brute-force.ts` | 1 passing |
| F6 | Single-Source Spray Detector | `src/detect/spray-single.ts` | â€” |
| F7 | Bipartite Graph Union-Find Campaign Clusterer | `src/detect/campaign-graph.ts` | 1 passing |
| F10 | Post-Spray Pivot Detector | `src/detect/pivot.ts` | â€” |
| F13 | Multi-Family Consensus Severity Engine | `src/detect/consensus.ts` | 1 passing |
| F21 | SHA-256 Hash-Chained Audit Ledger | `src/lib/crypto/audit-ledger.ts` | 2 passing |
| F25A | Microsoft Sentinel JSON Exporter | `src/lib/export/sentinel.ts` | â€” |
| F25B | OASIS STIX 2.1 Exporter | `src/lib/export/stix.ts` | â€” |
| â€” | Detection Engine (orchestrates F5/F6/F7/F10/F13) | `src/detect/engine.ts` | 1 E2E passing |
| â€” | Multi-Model AI Router (Gemini/Claude/OpenAI/Hermes/Ollama/FreeLLM) | `src/lib/ai/router.ts` | â€” |
| â€” | Ingest API Route (rate-limited, 10MB cap, 413 guard) | `src/app/api/v1/ingest/route.ts` | â€” |
| â€” | Detect Run API Route | `src/app/api/v1/detect/run/route.ts` | â€” |
| â€” | Audit API Route | `src/app/api/v1/audit/route.ts` | â€” |
| â€” | AI Query API Route (server-side, keys never reach browser) | `src/app/api/v1/ai/route/route.ts` | â€” |
| â€” | Token-Bucket Rate Limiter | `src/lib/rate-limiter.ts` | â€” |
| â€” | The Core UI (45-second demo contrast, severity equation, export) | `src/app/page.tsx` | â€” |
| â€” | Ralph Loop Regression Tests (3 continuous passes) | `tests/ralph-loop.test.ts` | 3 passing |

**Total: 54/54 tests pass. TypeScript: 0 errors.**

### Freebuff Security Pass (merged 2026-09-29)

| Area | Change | Why (attack path closed) |
|---|---|---|
| F25B STIX 2.1 | Deterministic UUIDv5 object ids (`src/lib/crypto/uuid-v5.ts`), spec-valid SCO/SDO common properties, bounded pattern (100 values), quote-escaped pattern values, `validateStixBundle()` pre-flight validator | Non-deterministic ids broke idempotent SIEM/TIP ingestion; hostile IP/username values could break out of STIX pattern strings |
| F25A Sentinel | Field clamps (title 256 / description 4096 / extended 1024), control-char sanitization, MITRE technique-id regex validation, pivot-aware `TruePositive` classification, `validateSentinelPayload()` | Oversized/uncontrolled incident fields surfaced as opaque ARM 400s; no pre-flight validation existed |
| F5/F6 detectors | O(nÂ²) filter-per-event sliding windows replaced with output-identical two-pointer scans (amortized O(n)) | A hostile 100k-event burst against one (user, IP) pair pinned a CPU core (timing test now asserts < 5s) |
| F7 evidence bundle | `eventHashes` capped (default 500, `maxEvidenceHashes`), deterministic sorted IP/account lists | A dense hostile cluster previously serialized unbounded arrays into every signal |
| F10 pivot | Window anchored to each account's FIRST spray failure; SUCCESS must be â‰¥ anchor; pivot srcIp must belong to campaign IP evidence | Pre-attack SUCCESS + whole-directory spraying weaponized the old window anchor into analyst-visible false positives; normal corporate logins no longer flag as compromise |
| Ingest boundary | Zod envelope schema, early `Content-Length` 413, byte-accurate UTF-8 size check, credential-key stripping, rejection `rawLine` truncation (120 chars) | Naive length check under-counted multi-byte payloads; rejection bucket echoed attacker-controlled lines unbounded (log-dumping); credential-shaped keys could survive into evidence |
| Rate limiter | `MAX_BUCKETS` population eviction + `getRateLimitBucketCount()` observability | Identifier rotation via `x-forwarded-for` grew the bucket map unboundedly |
| F21 audit ledger | `tamperRecordForDemo()` removed â†’ `createTamperedCopy()` returns an attacker-mutated copy; live chain stays immutable | The demo helper mutated the evidence chain in place |
| New tests | `tests/export.test.ts` (10) + `tests/redteam.test.ts` (13): timing attacks, pivot FP exploits, ingestion boundary, determinism/state-pollution invariants | Locks every closed attack path against regression |

### âš ï¸ PRD Features NOT Yet Built (P0 Priority)

| ID | Feature | Priority | Notes |
|---|---|---|---|
| F1 | Multi-Format Log Ingestion (Cisco ASA, Windows Evtlog, Linux auth.log) | P0 | Ingest API route skeleton exists; real parsers not wired |
| F14 | Tuning Workbench UI | P1 | Post-spine |
| F22 | Live Quality Dashboard (Precision/Recall/A2TP metrics display) | P1 | Post-spine |
| F23 | Real-Time Supabase Postgres Integration | P1 | Currently in-memory only |
| F26 | AI Narrative Summarizer (post-severity, clearly labeled) | P1 | Router exists; UI trigger not built |

---

## 3. Core Type Contracts (Source of Truth)

```typescript
// â”€â”€â”€ 1. Canonical Auth Event â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface AuthEvent {
  readonly eventHash: string;      // SHA-256(timestamp|srcIp|userName|outcome) â€” dedup primary key
  readonly timestamp: string;      // ISO 8601 UTC strictly
  readonly tsTzAssumed: boolean;   // true if timezone was assumed UTC
  readonly srcIp: string;          // IPv4 un-mapped from IPv6 (e.g. 198.51.100.22)
  readonly ipScope: 'public' | 'private'; // RFC1918 classification
  readonly userName: string;       // Stripped of DOMAIN\ and @realm
  readonly userRaw: string;        // Original untouched identifier
  readonly eventOutcome:
    | 'SUCCESS' | 'FAILURE_BAD_CREDENTIALS' | 'FAILURE_LOCKED'
    | 'FAILURE_MFA' | 'FAILURE_EXPIRED' | 'UNKNOWN';
  readonly sourceSystem: string;   // e.g. CiscoAnyConnect, Fortinet, PaloAlto
}

// â”€â”€â”€ 2. Detection Signal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Signal {
  readonly id: string;
  readonly detectorId: 'F5_brute' | 'F6_spray' | 'F7_campaign' | 'F10_pivot';
  readonly detectorFamily: 'VOLUME' | 'STATISTICAL' | 'GRAPH' | 'PIVOT';
  readonly confidenceScore: number; // 0.00 to 1.00
  readonly entityKey: string;      // 'ip:...' | 'user:...' | 'cluster:...'
  readonly eventHashes: readonly string[];
  readonly evidenceBundle: Record<string, unknown>;
}

// â”€â”€â”€ 3. Correlated Incident â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface Incident {
  readonly id: string;
  readonly title: string;
  readonly severityScore: number;  // 0 to 100
  readonly severityTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly severityEquation: string; // e.g. "Base 100 (F10_pivot) Ã— 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]"
  readonly familiesPresent: readonly ('VOLUME' | 'STATISTICAL' | 'GRAPH' | 'PIVOT')[];
  readonly signalIds: readonly string[];
  readonly contributingIps: readonly string[];
  readonly targetedAccounts: readonly string[];
  readonly compromisedAccounts: readonly string[];
}

// â”€â”€â”€ 4. SHA-256 Audit Record â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export interface AuditRecord {
  readonly sequenceId: number;
  readonly timestamp: string;
  readonly actorId: string;
  readonly actionType: string;
  readonly targetEntityType: string;
  readonly targetEntityId: string;
  readonly payloadHash: string;
  readonly prevRecordHash: string; // "0".repeat(64) for genesis block
  readonly recordHash: string;     // SHA-256(prevRecordHash + payloadHash + sequenceId + actorId)
}
```

---

## 4. Flagship Detection Formulae

### The 45-Second Demo Contrast (MEASURED, not estimated)
- **Naive Volume SIEM Rule (F5 alone):** â‰¥5 failures/IP. Spray stays at 3/IP â†’ **0 alerts.**
- **Loosened Threshold Rule:** â‰¥2 failures. â†’ **97 false-positive alerts (SOC fatigue).**
- **Quorum Consensus Engine:** Bipartite graph Union-Find â†’ **1 Correlated Critical Incident.**
- **Demo equation printed on screen:** `Base 100 (F10_pivot) Ã— 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]`

### F13 Multi-Family Consensus Equation
```
Base        = max(confidenceScore_per_family Ã— 100)
Multiplier  = 0.40 (1 family) | 0.75 (2 families) | 1.00 (â‰¥3 families OR GRAPH+PIVOT)
AdditiveBoost = +15 if compromised account confirmed in cluster
Severity    = min(100, round(Base Ã— Multiplier + AdditiveBoost))
Floor Rule  = If PIVOT family confirmed â†’ Severity â‰¥ 80 (CRITICAL)
```

---

## 5. Architectural Invariants (NEVER VIOLATE)

1. **Zero External Runtime Dependencies in `src/detect/`** â€” Pure functional TypeScript. No lodash, ML libs, or math.js.
2. **Zero Raw Credentials Persisted or Logged** â€” Passwords/hashes stripped before entering the normalizer.
3. **Deterministic Output** â€” Identical `AuthEvent[]` always produces identical `Incident[]` and hashes.
4. **Anti-Vibecoding UI** â€” True-black `#000000` canvas, slate `#080C14` cards, 1px borders `rgba(255,255,255,0.08)`, JetBrains Mono for machine data, semantic color for severity only.
5. **LLM Never In Detection Path** â€” AI Router only used for post-incident narrative summarization (F26), never for scoring.
6. **Server-Side API Keys** â€” AI provider keys (GEMINI_API_KEY, ANTHROPIC_API_KEY, OPENAI_API_KEY) stay server-side only. Never exposed to browser.

---

## 6. Project File Map

```
Microsoft Innovate/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # The Core UI (45-sec demo, full)
â”‚   â”‚   â”œâ”€â”€ globals.css                 # Dark theme base styles
â”‚   â”‚   â”œâ”€â”€ layout.tsx                  # Root layout
â”‚   â”‚   â””â”€â”€ api/v1/
â”‚   â”‚       â”œâ”€â”€ ingest/route.ts         # POST log ingestion (rate-limited, 413-guard)
â”‚   â”‚       â”œâ”€â”€ detect/run/route.ts     # POST trigger detection pipeline
â”‚   â”‚       â”œâ”€â”€ audit/route.ts          # GET audit ledger records
â”‚   â”‚       â””â”€â”€ ai/route/route.ts       # POST AI query (server-side, secure)
â”‚   â”œâ”€â”€ detect/
â”‚   â”‚   â”œâ”€â”€ brute-force.ts              # F5: Sliding-window brute force
â”‚   â”‚   â”œâ”€â”€ spray-single.ts             # F6: Single-source spray
â”‚   â”‚   â”œâ”€â”€ campaign-graph.ts           # F7: Union-Find bipartite graph (FLAGSHIP)
â”‚   â”‚   â”œâ”€â”€ pivot.ts                    # F10: Post-spray pivot detector
â”‚   â”‚   â”œâ”€â”€ consensus.ts                # F13: Multi-family consensus severity engine
â”‚   â”‚   â””â”€â”€ engine.ts                   # Orchestrator: runs F5â†’F6â†’F7â†’F10â†’F13
â”‚   â”œâ”€â”€ normalize/
â”‚   â”‚   â””â”€â”€ parsers.ts                  # F2: Canonical AuthEvent normalizer
â”‚   â”œâ”€â”€ data/
â”‚   â”‚   â””â”€â”€ generator.ts                # F4: Deterministic synthetic corpus (Pack A/B)
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â”œâ”€â”€ ai/router.ts                # Multi-model AI router (Gemini/Claude/Hermes/Ollama/FreeLLM)
â”‚   â”‚   â”œâ”€â”€ crypto/audit-ledger.ts      # F21: SHA-256 hash-chained audit ledger
â”‚   â”‚   â”œâ”€â”€ export/sentinel.ts          # F25A: Microsoft Sentinel JSON exporter
â”‚   â”‚   â”œâ”€â”€ export/stix.ts              # F25B: OASIS STIX 2.1 exporter
â”‚   â”‚   â””â”€â”€ rate-limiter.ts             # Token-bucket rate limiter
â”‚   â””â”€â”€ types/
â”‚       â””â”€â”€ ai-router.ts                # AI router type definitions
â”œâ”€â”€ tests/
â”‚   â”œâ”€â”€ detect.test.ts                  # Core detection + normalizer + audit ledger tests
â”‚   â””â”€â”€ ralph-loop.test.ts              # Ralph Loop: 3-pass regression (Pack A, Pack B, tamper)
â”œâ”€â”€ docs/
â”‚   â”œâ”€â”€ GRAPHIFY_CONTEXT.md             # THIS FILE â€” share with external AI agents
â”‚   â”œâ”€â”€ PRD_REVIEW.md                   # PRD checklist & gap analysis
â”‚   â”œâ”€â”€ DESIGN_DOC.md                   # UI/UX spec & The Core component map
â”‚   â”œâ”€â”€ TECH_STACK.md                   # Full stack decisions & rationale
â”‚   â”œâ”€â”€ AI_COLLABORATION_GUIDE.md       # How to use each AI agent optimally
â”‚   â”œâ”€â”€ ANTI_VIBECODE_AUDIT.md          # Pre-flight anti-vibecoding checklist
â”‚   â”œâ”€â”€ PRE_LAUNCH_CHECKLIST.md         # Security, auth, rate-limit checklist
â”‚   â”œâ”€â”€ HACKATHON_FRAMEWORK.md          # 45-sec demo script & judge Q&A
â”‚   â”œâ”€â”€ CODE_STYLE.md                   # Coding conventions
â”‚   â”œâ”€â”€ DATABASE.md                     # Supabase Postgres schema
â”‚   â”œâ”€â”€ API_GUIDE.md                    # API endpoint docs
â”‚   â””â”€â”€ SECURITY.md                     # Security hardening guide
â”œâ”€â”€ .github/workflows/
â”‚   â”œâ”€â”€ ci.yml                          # GitHub Actions: typecheck + test on every PR
â”‚   â””â”€â”€ reticle-verify.yml              # Reticle: continuous ground-truth regression
â”œâ”€â”€ Quorum_PRD_v4.md                    # Full 1203-line PRD (source of truth)
â”œâ”€â”€ AGENTS.md                           # Operational directives for all AI agents
â””â”€â”€ .env.example                        # Required env vars (keys stay server-side)
```

---

## 7. Universal Prompt Header for External AI Delegation

**Copy this block verbatim at the TOP of every task you send to Freebuff / OpenCode / Claude / Manus / Ollama:**

```
[CONTEXT: QUORUM v4.1.0 â€” Microsoft Innovate 2026 Â· Redmond Labs]
Project: Enterprise VPN Authentication Campaign-Correlation Plane.
Stack: Next.js 14 App Router, TypeScript strict mode, Vitest/Node test runner.
Detection Plane (src/detect/): Pure functional TypeScript. ZERO external dependencies. Must stay zero-dep.
Build Status: 17/17 tests passing. TypeScript: 0 errors.

Canonical Types (do NOT redefine, import from existing files):
  AuthEvent  â†’ { eventHash, timestamp (UTC), srcIp (IPv4 unmapped), ipScope ('public'|'private'), userName, userRaw, eventOutcome ('SUCCESS'|'FAILURE_BAD_CREDENTIALS'|'FAILURE_LOCKED'|'FAILURE_MFA'|'FAILURE_EXPIRED'|'UNKNOWN'), tsTzAssumed, sourceSystem }
  Signal     â†’ { id, detectorId ('F5_brute'|'F6_spray'|'F7_campaign'|'F10_pivot'), detectorFamily ('VOLUME'|'STATISTICAL'|'GRAPH'|'PIVOT'), confidenceScore (0â€“1), entityKey, eventHashes[], evidenceBundle }
  Incident   â†’ { id, title, severityScore (0-100), severityTier ('LOW'|'MEDIUM'|'HIGH'|'CRITICAL'), severityEquation (string), familiesPresent[], signalIds[], contributingIps[], targetedAccounts[], compromisedAccounts[] }
  AuditRecord â†’ SHA-256 hash-chained block (see src/lib/crypto/audit-ledger.ts)

Hard Constraints:
  - Zero external runtime deps in src/detect/
  - Zero raw credentials persisted or logged
  - All outputs deterministic (identical input â†’ identical output)
  - UI: true-black #000000, slate #080C14, 1px borders rgba(255,255,255,0.08), JetBrains Mono for machine data
  - Semantic color for severity only: #64748B Low, #F59E0B Medium, #EF4444 High, #DC2626 Critical
  - After ANY code change: run `npm.cmd run typecheck` AND `npm.cmd test` â€” both must pass before finishing

Verification Loop (MANDATORY before marking task done):
  1. npm.cmd run typecheck   â†’ must exit code 0
  2. npm.cmd test            â†’ must show "pass 54, fail 0" (or higher if you added tests)

[TASK SPECIFICATION BELOW]:
```

---

## 8. Agent Delegation Playbook (Who Does What)

| Task Type | Best Agent | Why |
|---|---|---|
| TypeScript detection plane logic (F5/F6/F7/F10/F13) | **You (main)** | Needs full PRD context + type contracts + test runner access |
| Next.js UI component builds | **You (main)** or **OpenCode** | The Core design requires anti-vibecoding rules |
| Supabase schema + RLS policies | **You (main)** or **Claude** | Security-critical; needs DATABASE.md context |
| STIX 2.1 / Sentinel JSON schema validation | **Freebuff** | Security research specialist, good at OASIS specs |
| Red-team "break my app" testing | **Freebuff** | Attack-path enumeration and adversarial input crafting |
| PR review / code quality | **CodeRabbit** (auto) | Already configured in `.coderabbit.yaml` |
| Narrative AI summarization (F26) | **Hermes / Ollama** | LLM narrative; never in scoring path |
| Offline fallback / demo resilience | **Ollama** | Local execution, no API keys needed |
| Judge Q&A prep / pitch narrative | **Manus** | Long-form strategic reasoning |

---

*Last updated: 2026-09-29 | Maintained by: Antigravity (Quorum primary agent) | Auto-synced with every checkpoint.*

