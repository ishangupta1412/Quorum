# Quorum — Product Requirements Document v4
**A Campaign-Correlation Detection Layer for VPN Authentication Telemetry**

---

## Table of Contents

- [Section 0 — Document Control](#section-0--document-control)
- [Section 1 — The Five-Line Thesis Contract](#section-1--the-five-line-thesis-contract)
- [Section 2 — Feasibility & Boundary Pre-Check](#section-2--feasibility--boundary-pre-check)
- [Section 3 — Executive Build Decision](#section-3--executive-build-decision)
- [Section 4 — Executive Summary](#section-4--executive-summary)
- [Section 5 — Problem Deep Dive](#section-5--problem-deep-dive)
- [Section 6 — Product Vision, Goals, Boundaries](#section-6--product-vision-goals-boundaries)
- [Section 7 — Complete Feature Specification](#section-7--complete-feature-specification)
- [Section 8 — Cockpit UI/UX Specification](#section-8--cockpit-uiux-specification)
- [Section 9 — Data Model & Security](#section-9--data-model--security)
- [Section 10 — Evaluation Specification](#section-10--evaluation-specification)
- [Section 11 — Build Plan & Execution Roadmap](#section-11--build-plan--execution-roadmap)
- [Section 12 — The 3-Minute Demo Script](#section-12--the-3-minute-demo-script)
- [Section 13 — Judge Q&A War Room](#section-13--judge-qa-war-room)
- [Section 14 — Risk Register & Contingency Playbooks](#section-14--risk-register--contingency-playbooks)
- [Section 15 — Appendices](#section-15--appendices)

---

# SECTION 0 — DOCUMENT CONTROL

| Field | Value |
| :--- | :--- |
| Document Version | 4.0 (Rebuild Edition) |
| Classification | Implementation-Ready Hackathon PRD |
| Event | Microsoft Innovate 2026 (Bennett University SCSET × Microsoft) |
| Problem Statement | PS-22 — "Someone's Spraying the VPN" |
| Team | Redmond Labs, 1st-year undergraduate CS, Bennett University |
| Evaluator Audience | Microsoft Enterprise Security Architects, Senior SCSET Faculty |
| Budget | ₹0.00 / $0.00 — free tiers only, offline-capable demo |
| Build Scope | 11-feature P0 spine + 2 trust extras (Section 3.2) |
| Prior Version Context | v1 shipped and measured on a sealed corpus (Section 5, 10); v4 is a full rebuild onto Next.js + Supabase + deterministic TypeScript, required to meet or beat every v1 number |

**How to read this document, by audience:**

- **If you are a judge:** read Section 1 (thesis), Section 5 (problem), Section 7's F7/F10/F13 (the technical core), Section 12 (demo script), and Section 13 (Q&A) — that sequence tells you everything you need in under fifteen minutes.
- **If you are an engineer on this team:** Section 7 is your spec, Section 9 is your schema, Section 11 is your schedule, and every acceptance criterion names the test that proves you're done. Do not start Phase 2 in Section 11 until Phase 1's gate is green.
- **If you are the designer:** Section 8 is written for you specifically — component-to-pattern mapping, screen-by-screen walkthrough, and a performance/taste budget so "premium" doesn't become "slow."

A note on numbers before you read further: this document treats a prior internal build ("v1") as already measured on a sealed synthetic corpus, and every metric target in Sections 6 and 10 is set at or below what v1 already achieved. Where an earlier draft of this PRD estimated a number before it was actually measured (the loosened-threshold alert count was originally estimated at 431), this document uses the measured value (97) and says so once, here, rather than silently changing it.

---

# SECTION 1 — THE FIVE-LINE THESIS CONTRACT

1. **User Problem:** Security analysts are overwhelmed by thousands of disconnected failed-login alerts while distributed, low-and-slow password sprays stay statistically invisible beneath any single account's or IP's local threshold.
2. **Product Promise:** Quorum correlates authentication telemetry across the entire directory into campaign-level incidents and raises a Critical alarm only when independent detector families reach mathematical consensus.
3. **Technical Differentiator:** Instead of counting rows per IP, Quorum extracts bipartite IP-to-account graph topology across a multi-day window via Union-Find, catching distributed sweeps that per-row threshold rules cannot structurally see.
4. **Proof Standard:** Every claim is measured on an independently seeded, cryptographically sealed synthetic corpus (Pack B) never touched during tuning, reported as Precision, Recall, and Alert-to-True-Positive ratio — never generic "accuracy."
5. **Operational Boundary:** Quorum is a local triage layer that augments a SIEM; it is NOT a SIEM replacement, NOT an autonomous responder, and NEVER auto-locks an account under any severity level.

> **Thesis line, verbatim, used on the closing slide and in the UI footer of every screen:**
> *"Every alert needs evidence. Every incident needs independent agreement."*

---

# SECTION 2 — FEASIBILITY & BOUNDARY PRE-CHECK

| Question | Answer | Engineering Resolution |
| :--- | :---: | :--- |
| Is the problem scope too broad? | Yes | Narrowed to exactly one attack class: distributed password spraying (MITRE T1110.003) plus the spray-to-pivot transition (T1078). Credential stuffing (T1110.004) and impossible-travel-only detection are explicitly out of the P0 spine (Section 3.3). |
| Does the architecture exceed the build window? | Yes | Locked to an 11-feature P0 spine (Section 3.2). All infrastructure choices are managed free-tier services (Supabase, Vercel) — zero hours spent on servers, containers, or orchestration. |
| Do the empirical claims need external proof? | Yes | Every real-world statistic in Section 5 is tagged with a primary source and cross-referenced in Appendix B; every product-internal number is tagged with its measurement methodology in Appendix C. |
| Is there a team skill gap? | Yes | Detection logic is pure, dependency-free TypeScript — no ML framework, no compiled extensions, no infrastructure DSL. The hardest single algorithm (Union-Find) is under 80 lines and fully unit-testable without mocks. |
| Can the demo survive a venue with no reliable Wi-Fi? | Yes | The stage demo runs against a local `supabase start` instance on the presenting laptop. The Vercel + cloud-Supabase deployment exists only to prove "this is a real, deployed product," never as the live demo dependency. |

---

# SECTION 3 — EXECUTIVE BUILD DECISION

## 3.1 Is This a Winning Problem Statement?

| Dimension | Rating | Evidence |
| :--- | :---: | :--- |
| Real-world relevance | Strong | Credential-based attacks and edge-device exploitation are both documented as rising primary breach vectors in the 2025 Verizon DBIR (Section 5.1, Appendix B). |
| Sponsor alignment (Microsoft) | Strong | Directly mirrors the low-and-slow spray tactic Microsoft's own MSRC publicly documented in the Midnight Blizzard nation-state compromise. |
| 45-second demo contrast | Strong | Live, same-corpus run: naive rule 0 alerts → loosened rule 97-alert flood → Quorum 1 correlated Critical incident. All three computed live (Section 10, Section 12). |
| Technical differentiation | Strong | Bipartite Union-Find campaign graph + deterministic multi-family consensus arithmetic + hash-chained audit ledger — three defensible, explainable mechanisms, not one black box. |
| First-year team feasibility | Moderate → Strong after scoping | Feasible specifically because the stack is fully managed (Supabase) and the detection plane is pure TypeScript with no ML/infra dependency. |
| Scope-collapse risk | Was High, now Controlled | Mitigated by the explicit 11-feature spine and kill list below — there is no ambiguity about what "done" means. |

**Verdict: GO, with the kill list enforced without exception.**

## 3.2 The Winning MVP — 11 P0 Capabilities

| ID | Capability | Demo-Visible | Why Indispensable |
| :---: | :--- | :---: | :--- |
| F1 | Multi-format ingest + rejection bucket | Yes | Real, honest ingestion — no silently-dropped rows inflating recall claims. |
| F2 | Canonical `AuthEvent` normalizer | Yes | One schema means every detector below is a pure, independently testable function. |
| F4 | Deterministic generator + sealed Pack B | Yes | Without this, every metric in this document is an assertion, not a measurement. |
| F5 | Sliding-window brute-force rule | Yes | Table-stakes baseline; also literally the "naive SIEM" comparator in the demo. |
| F6 | Single-source spray rule | Yes | Catches the loud version of the attack; also the "loosened threshold" comparator. |
| F7 | Bipartite campaign graph (Union-Find) | **Yes — Flagship** | The one thing no per-row SIEM rule can do. |
| F10 | Post-spray pivot detector | **Yes — Climax** | Turns "suspicious pattern" into "confirmed compromise" the instant it happens. |
| F13 | Quorum consensus severity engine | Yes | The deterministic arithmetic core — printed, inspectable, never a black box. |
| F15/F16 | Analyst cockpit + evidence timeline | Yes | Where the judge watches the entire story unfold. |
| F21 | Hash-chained audit ledger + tamper demo | Yes | The enterprise-trust moment — integrity you can prove, not just claim. |
| F22 | Quality gates + limitations panel | Yes | Proves the numbers are real and honestly bounded. |

**Two trust extras**, built only after the spine above is green end-to-end:

| ID | Capability | Why |
| :---: | :--- | :--- |
| F14 | Suppression + tuning workbench, `<60s` recompute | Demonstrates understanding of false-positive economics, not just raw detection. |
| F25 | Deterministic Sentinel/STIX 2.1 exports + KQL gap docs | Demonstrates where Quorum sits relative to a real SOC stack, not in competition with it. |

## 3.3 The Explicit Kill List

| Killed | Exact Fallback That Preserves the Demo |
| :--- | :--- |
| LLM incident narratives | Deterministic template strings built from the same evidence bundle — same information, zero non-determinism risk on stage. |
| Entity deep-dive history pages | The incident evidence table (F16) already proves entity correlation end to end. |
| Credential-stuffing detector | Documented as a roadmap item in Appendix A; different attack shape, would dilute the one story that must land perfectly. |
| Full 4-tier RBAC matrix | Two seeded Supabase Auth roles (`analyst`, `admin`) plus table-level RLS proves server-side enforcement without a combinatorial test-surface trap. |
| Live Tor exit-node feed | A bundled static snapshot file, refreshed at build time, with its age displayed in the admin panel. |
| Custom replay/streaming engine | The generator (F4) writes directly into Supabase; "replay" is just re-running the gate runner against the same sealed pack. |
| Docker / Kubernetes / microservices | Managed Supabase + a single Next.js app; zero orchestration surface to fail on stage. |
| Any paid API | Every dependency in Section 4's stack table is free-tier by construction. |

**In the product's own voice (UI copy, footer, every screen):** *"Quorum stages remediation actions for human confirmation. It does not, and will not, automatically disable accounts or lock out users — an attacker who could trigger that automatically would be able to weaponize this tool into a denial-of-service against your own workforce."*


---

# SECTION 4 — EXECUTIVE SUMMARY

## 4.1 Name Rationale

In distributed systems, a *quorum* is the minimum number of independent nodes that must agree before an operation is allowed to commit. Applied to detection: no single event, and no single detector family, can ever escalate an incident to Critical on its own — escalation requires independent agreement, the same way a distributed database requires independent agreement before it trusts a write. The name is the architecture.

## 4.2 The Pitch

**31-word executive pitch:** Quorum is a campaign-correlation layer for VPN authentication telemetry that detects distributed password sprays by requiring independent agreement across graph, rule, and pivot detectors — collapsing tens of thousands of failed logins into one high-confidence incident.

**10-word closing version:** *Every alert needs evidence. Every incident needs independent agreement.*

## 4.3 Architecture Diagram

```text
                          RAW AUTHENTICATION TELEMETRY
        (Cisco ASA/FTD syslog · Linux auth.log/sshd · Windows 4624/4625 · Entra ID JSON)
                                        │
                                        ▼
        ╔═══════════════════════════════════════════════════════════════════╗
        ║  SUPABASE (single free-tier project)                              ║
        ║  Postgres 15 (all tables, RLS on every one) · Auth (2 roles)      ║
        ║  Storage (sealed Pack B, exports)  ·  Realtime (incident channel) ║
        ╚═══════════════════════╤═══════════════════════════════════════════╝
                                 │ fetched by, written back to
                                 ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │  NEXT.JS SERVER — Route Handlers (orchestration only, zero logic)│
        └──────────────────────────┬───────────────────────────────────────┘
                                    │ pure in-process function calls, no I/O
                                    ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │        DETECTION PLANE — pure, deterministic TypeScript          │
        │  ┌───────────┬────────────┬────────────┬────────────┬──────────┐│
        │  │ RULE       │ GRAPH      │ ML          │ BASELINE   │ PIVOT    ││
        │  │ F5 · F6    │ F7         │ F12         │ F11        │ F10      ││
        │  └─────┬──────┴──────┬─────┴──────┬──────┴──────┬─────┴────┬─────┘│
        │        └─────────────┼─────────────┼─────────────┼─────────┘     │
        │                      ▼             ▼             ▼               │
        │              STANDARDIZED SIGNAL STREAM (Section 4.4)            │
        └──────────────────────┬───────────────────────────────────────────┘
                                ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │   QUORUM CORRELATION & SEVERITY ENGINE (F13)                     │
        │   Union-Find clustering → family consensus multiplier →         │
        │   contextual adjustments → hard overrides → printed equation    │
        └──────────────────────┬───────────────────────────────────────────┘
                                ▼
        ┌──────────────────────────────────────────────────────────────────┐
        │  GOVERNED TRIAGE — Next.js Cockpit                                │
        │  F15/F16 incident queue + evidence timeline                      │
        │  F19 staged, human-confirmed verdicts (never auto-enforced)      │
        │  F21 hash-chained audit ledger      F22 quality/limitations panel│
        └──────────────────────────────────────────────────────────────────┘
```

## 4.4 The Signal Protocol

Detectors never raise alerts directly — they emit typed `Signal` objects that function as evidence *votes* submitted to the Quorum engine (F13). This single invariant is what makes the severity arithmetic auditable: an incident's severity is always traceable back to a specific, printable list of votes.

```typescript
type DetectorFamily = "RULE" | "GRAPH" | "ML" | "BASELINE" | "PIVOT";
type EntityType = "user" | "source_ip" | "subnet_24" | "asn" | "campaign";

interface Signal {
  detectorId: string;
  detectorFamily: DetectorFamily;
  entityType: EntityType;
  entityValue: string;
  windowStart: string;              // ISO-8601 UTC
  windowEnd: string;                // ISO-8601 UTC
  rawScore: number;
  normalisedScore: number;          // 0–100, saturating
  evidenceEventHashes: string[];    // direct links to backing AuthEvent rows
  mitreTechnique: string;           // e.g. "T1110.003", "T1078"
  paramsSnapshot: Record<string, unknown>; // exact detector params at execution time
}

// THE INVARIANT: a Signal is a vote, never an alert.
// F13 is the only component permitted to turn Signals into a user-visible Incident.
```

---

# SECTION 5 — PROBLEM DEEP DIVE

## 5.1 Three Hard Facts

| # | Claim | Publisher / Source | Status | Operational Relevance |
| :---: | :--- | :--- | :---: | :--- |
| 1 | Stolen credentials account for **22% of all initial-access breaches**; exploitation of edge infrastructure surged **8× year-over-year**. | Verizon, *2025 Data Breach Investigations Report (DBIR)*, Executive Summary, pp. 5–8 | VALIDATED FACT | Perimeter authentication gateways (VPN, remote access) are a primary target for initial corporate access, not a secondary concern. |
| 2 | Global password-spray campaigns actively target **Cisco, Fortinet, and SonicWall VPNs** via Tor and residential-proxy botnets. | Cisco Talos, *Threat Advisory: Large-scale brute-force activity targeting VPNs*, April 16, 2024 | VALIDATED FACT | Confirms attackers deliberately distribute attempts across large, clean IP pools specifically to evade per-IP volume thresholds. |
| 3 | The **Midnight Blizzard** nation-state actor breached **Microsoft corporate email** via a low-and-slow password spray against a tenant lacking MFA enforcement. | Microsoft MSRC, *Guidance for responders on nation-state attack*, January 25, 2024 | VALIDATED FACT | Demonstrates that even world-class security organizations can be breached when attack traffic is engineered to match the statistical shape of normal login noise. |

## 5.2 The Alert-Fatigue Crisis

The Microsoft & Omdia *State of the SOC 2025* report found that **46% of all triaged security alerts are false positives**, and **42% go completely uninvestigated**. Concurrently, Vectra AI (2026) documented that enterprise SOCs receive an average of **2,992 alerts per day**, with **63% left unaddressed** due to cognitive exhaustion (both cited in full in Appendix B). The synthesis: a modern distributed spray is engineered to be statistically indistinguishable from benign login noise, and the analyst who would need to catch it is already structurally unable to review most of their queue.

## 5.3 Threat Model Covered by This Product

| Attack Pattern | MITRE Technique | Detector(s) Responsible |
| :--- | :---: | :--- |
| Sustained single-account brute force | T1110.001 | F5 |
| Single-source horizontal spray | T1110.003 | F6 |
| Distributed, multi-day, multi-IP spray | T1110.003 | F7 (flagship) |
| Lockout evasion via built-in Administrator / non-lockout-policy accounts | T1110.001 (variant) | F5 (`ADMIN_LOCKOUT_IMMUNE` escalation) |
| Post-spray successful pivot into the environment | T1110 → T1078 | F10 (climax) |

**Explicitly out of scope for v4** (see kill list, Section 3.3): credential stuffing / breach replay (T1110.004), and any lateral-movement detection after the initial pivot login.

## 5.4 A Day in the Life

> **ILLUSTRATIVE SYNTHETIC SCENARIO — NOT A REAL INCIDENT.**
>
> Priya is a Tier-1 SOC analyst. Her queue opens the shift with 2,847 alerts. In ninety minutes she triages 61 of them — all benign: a locked-out contractor, a handful of Monday-morning password typos, one noisy service account she already knows to ignore.
>
> Over the same six hours, a botnet quietly tries two passwords each against 1,180 usernames from 312 residential proxy IPs. No single account ever accumulates more than two failures. No single IP ever sends more than eight attempts. The volume-threshold rule her SIEM runs — more than ten failures in five minutes from one IP — fires exactly zero times, because the attack was built specifically to stay under that line.
>
> At 04:47 UTC, one of the sprayed accounts authenticates successfully from a proxy IP that has never touched the corporate network before. It scrolls past in the queue as a single, unremarkable successful login.
>
> Priya's shift report is accurate, given the tooling she was given. Twenty-one days later, an incident-response firm reconstructs the breach from the very logs she ingested that night. The telemetry existed in full. The mathematical abstraction needed to see the shape of it did not.

## 5.5 Root-Cause Analysis

| Root Cause | Observable Symptom | Why It Persists | Quorum's Response | Remaining Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **Wrong mathematical abstraction.** `GROUP BY ip, COUNT(*)` cannot compute graph topology — it can only count rows. | Threshold rules see volume, never shape; a spray engineered to stay under any single threshold is invisible by construction. | SIEM query languages were built for row filtering, not topological analysis, and retrofitting graph logic into them is expensive and rare. | F7 builds an actual bipartite graph and extracts connected components via Union-Find — the correct abstraction for "is this one coordinated campaign." | Campaigns targeting fewer than 25 accounts fall below F7's structural floor and rely on F5/F6 alone (Section 6.5). |
| **Absent ground-truth feedback loop.** Analyst verdicts (true positive / false positive) are rarely fed back into rule tuning. | The same false-positive patterns recur shift after shift; institutional memory of "this is normal for us" lives in people's heads, not in the system. | Building a closed tuning loop requires labeled data and a safe place to tune without breaking production detection — most teams don't have both. | F14's suppression/tuning workbench re-runs the full labeled evaluation on every threshold change in under 60 seconds, making the cost of testing a tuning change near zero. | Tuning against Pack A (open) is structurally firewalled from reporting against Pack B (sealed) — the feedback loop cannot leak into the proof standard (F4). |
| **Institutional knowledge loss.** "We always ignore alerts from this IP range" lives in a senior analyst's head, or an undocumented allowlist file. | New analysts re-investigate already-resolved false positives; when the senior analyst leaves, the knowledge leaves with them. | Ad-hoc allowlists are rarely time-bounded, owned, or audited, so nobody trusts removing them later. | F14 suppressions are mandatorily scoped, owned, time-bounded (≤180 days), and require a written reason — the knowledge becomes a queryable, auditable record instead of tribal memory. | A suppression still requires a human to have correctly identified the pattern as benign in the first place — Quorum cannot invent that judgment. |

## 5.6 Personas

| Field | Priya — Tier-1 SOC Analyst | Marcus — Detection Engineer | Sandhya — Head of IT (Non-Technical) |
| :--- | :--- | :--- | :--- |
| Company scale | ~2,000-seat enterprise | Same org, security engineering team | Same org, reports to the CIO |
| Tenure | 8 months in role | 4 years, owns the SIEM rule library | 12 years, owns compliance posture |
| Tools used daily | SIEM console, ticketing queue | SIEM rule editor, Python notebooks | Executive dashboards, audit reports |
| Verbatim quote | *"I know most of this queue is noise, but I can't prove which alerts are the noise without opening every single one."* | *"Every time I tighten a threshold to catch more, I flood the queue. Every time I loosen it for peace, I miss things."* | *"When the auditor asks 'how do you know nobody edited this record after the fact,' I need an answer that isn't 'we trust our admins.'"* |
| Current workaround | Skims by severity label, trusts gut instinct on the rest | Maintains a manually-tuned allowlist nobody fully understands anymore | Relies on vendor claims and periodic third-party audits |
| Why it fails | Gut instinct doesn't scale and isn't defensible after an incident | Tuning is a blind trade-off with no feedback loop | Vendor claims aren't independently verifiable in real time |
| Success metric | Queue she works top-to-bottom is short enough to fully clear, and she trusts it's complete | A2TP ratio low enough that tuning changes are testable in minutes, not days | A tamper-evident record she can show an auditor and mean it |

---

# SECTION 6 — PRODUCT VISION, GOALS, BOUNDARIES

## 6.1 North Star

> An analyst opens the queue, sees fifteen correlated incidents instead of three thousand disconnected alerts, works every one of them, and is mathematically justified in trusting that the list is complete.

## 6.2 Primary Goals

| ID | Goal | Metric | Target | Methodology | Failure Consequence |
| :---: | :--- | :--- | :---: | :--- | :--- |
| P-1 | Keep the triage queue actionable | Alert-to-True-Positive ratio (A2TP) | ≤ 3.0 | `incidents / true-positive campaigns` on sealed Pack B | Above target, the queue degrades back into the exact fatigue problem Quorum exists to solve |
| P-2 | Catch what threshold rules miss | Distributed / low-and-slow campaign recall | ≥ 92% | `campaigns detected / campaigns planted` on sealed Pack B | Below target, the flagship claim (F7) is unsupported |
| P-3 | Detect fast enough to matter | Median time-to-detect (MTTD) | ≤ 5 minutes | Wall-clock from first attack event to incident creation, sealed Pack B | Above target, the pivot window (F10) risks closing before an analyst can act |

## 6.3 Secondary Goals

| ID | Goal | Metric | Target |
| :---: | :--- | :--- | :---: |
| S-1 | Every claim is traceable | Evidence citation coverage | 100% of incident-detail claims link to a real `event_hash` |
| S-2 | Tuning is cheap to test | F14 full re-evaluation time | < 60 seconds on Pack A |
| S-3 | Tamper is detectable, fast | F21 chain-verification + localization latency | < 3 seconds across 100,000 ledger rows |

## 6.4 Explicit Non-Goals

| Non-Goal | Why | Revisit Condition |
| :--- | :--- | :--- |
| NOT a SIEM replacement | Quorum has no long-term raw-log retention story or general-purpose query language; it is a correlation layer in front of an existing SIEM. | Never in this build; roadmap item only if pursued as a standalone product post-hackathon. |
| NOT an autonomous responder | An attacker who can trigger false spray signals must never be able to weaponize automatic lockout into a denial-of-service against real employees. | Never — this is a permanent architectural boundary, not a v1 limitation. |
| NEVER an LLM in the detection path | Non-deterministic, prompt-injectable via attacker-controlled log content, and unexplainable in a way that undermines the "printed equation" trust story. | Revisit only for optional, clearly-labeled narrative summarization *after* severity is already deterministically computed — never for scoring itself. |

## 6.5 The Full Instrument Panel

| Metric | Formula | Poor | Acceptable | Good | Target | Source |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| Event Precision | `TP / (TP + FP)` at the event level | < 0.70 | 0.70–0.85 | 0.85–0.95 | ≥ 0.85 | Sealed Pack B |
| Event Recall | `TP / (TP + FN)` at the event level | < 0.70 | 0.70–0.85 | 0.85–0.95 | ≥ 0.90 | Sealed Pack B |
| Event F1 | Harmonic mean of Precision/Recall | < 0.75 | 0.75–0.85 | 0.85–0.92 | ≥ 0.87 | Sealed Pack B |
| Campaign Recall | `campaigns detected / campaigns planted` | < 75% | 75–90% | 90–98% | ≥ 92% | Sealed Pack B |
| A2TP | `incidents raised / true campaigns` | > 6.0 | 3.0–6.0 | 1.5–3.0 | ≤ 3.0 | Sealed Pack B |
| Median MTTD | Wall-clock, first event → incident | > 10 min | 5–10 min | 2–5 min | ≤ 5 min | Sealed Pack B |
| Clean-Corpus FP | Incidents raised on zero-attack corpus | > 5 | 3–5 | 1–2 | ≤ 3 | Clean corpus (no planted attacks) |
| API p95 Latency | Incident queue page response | > 800ms | 400–800ms | 200–400ms | < 400ms | Benchmark run, 500k-event DB |
| Pipeline Throughput | Events processed per second | < 2k/s | 2k–8k/s | 8k–20k/s | ≥ 12k/s | Benchmark run |

**Permanent limitations statement, printed verbatim on the F22 dashboard:** *"Metrics above are measured against a synthetic, labeled corpus generated under controlled parameters. They demonstrate detection performance against modeled attack topologies — they do not prove equivalent recall against unobserved enterprise network anomalies, proprietary log dialect shifts, or novel evasion tactics. Campaigns targeting fewer than 25 accounts fall below the graph detector's structural floor and rely on rule-level detection alone. The clean corpus does not model load-balancer misconfigurations or mobile-carrier retry storms, which are known sources of benign volume spikes in real networks."*

---

# SECTION 7 — COMPLETE FEATURE SPECIFICATION

**Priority system:** P0 = the demo dies without it, never cut. P1 = material enhancement, cut only if P0 is incomplete. T = trust extra, built only after the spine is green end-to-end.

---

## F1 — Multi-Format Ingestion & Rejection Bucket

**User Story:** As Marcus, I upload raw VPN/identity logs and get a transparent parse report, never a silent partial import.

**Scope Boundary — DOES:** Parse Cisco ASA/FTD syslog (`%ASA-6-113004`, `%ASA-6-113005`, `%ASA-6-113015`), Linux `auth.log`/`sshd`, Windows Security Event IDs 4624/4625, Entra ID sign-in JSON/JSONL, and the F4 synthetic generator's labeled format. Captures unparsed lines into an inspectable `rejected_lines` bucket.
**DOES NOT:** Support non-authentication telemetry (DNS, NetFlow) or live network syslog listeners in v4.

| Acceptance Criteria | Test |
| :--- | :--- |
| Chunked streaming keeps memory < 1.0 GB RSS on a 2,000,000-line file | `test_ingest_memory_boundary` |
| Format auto-detected from the first 200 non-empty lines; a parser must score ≥ 0.70 or the job returns `422` with per-parser diagnostic ratios | `test_format_autodetect` |
| Malformed lines route to `rejected_lines` with line number and raw text, capped at 1,000 samples | `test_rejection_bucket_sampling` |
| Re-uploading an identical file (`SHA256(file_bytes)`) returns the existing `job_id`, never a duplicate | `test_ingest_idempotency` |
| A 1 GB+ crafted payload is rejected with `413` before it is fully buffered | `test_zip_bomb_rejection` |
| Malformed UTF-8 is sanitized with byte offsets recorded in the rejection sample | `test_malformed_encoding_replace` |
| A single file mixing multiple syslog dialects is parsed per-line; non-matching lines route to rejection, matching lines still ingest | `test_mixed_syslog_dialects` |
| A zero-byte or header-only file is rejected immediately as `422 EMPTY_CORPUS` | `test_empty_file_handling` |

| Edge Case | Behavior | Test |
| :--- | :--- | :--- |
| Rejection ratio > 30% | Job completes but is flagged `DEGRADED`; UI surfaces a warning banner | `test_rejection_ratio_warning` |
| Job states | `COMPLETED` / `DEGRADED` / `REJECTED` are the only three terminal states; there is no silent partial-success state | `test_ingest_job_state_machine` |

**Evidence & Audit:** Total lines parsed vs. rejected is surfaced on the F22 quality dashboard; unparsed lines remain queryable for analyst audit.
**Enterprise-Grade Touch:** Rejected lines are a first-class auditable asset. Legacy pipelines silently discard unparseable rows, which inflates recall claims — Quorum makes parse failure visible instead of hiding it.
**Priority:** P0, non-cuttable.

---

## F2 — Canonical `AuthEvent` Normalizer

**User Story:** As the system, I reduce every log dialect to one typed shape so every detector below is a pure function over an identical structure.

**Scope Boundary — DOES:** Normalize to the strict `AuthEvent` shape (Zod-validated, `.strict()`, no extra fields tolerated). **DOES NOT:** enrich with geolocation/ASN data — deferred to post-hackathon roadmap (Appendix A); F6/F7's discriminators use only fields already present in the raw log.

```typescript
type AuthOutcome = "success" | "failure" | "lockout" | "mfa_challenge" | "mfa_denied" | "unknown";

interface AuthEvent {
  eventHash: string;          // SHA256(ts_utc|user_clean|src_ip|outcome|source) — dedup primary key
  timestampUtc: string;       // ISO-8601, timezone-aware, always converted to UTC
  tsTzAssumed: boolean;       // true if the source log lacked an explicit timezone
  userName: string;           // canonical: lowercase, DOMAIN\ and @upn stripped
  userNameRaw: string;        // verbatim source string, preserved
  isPrivilegedAccount: boolean; // matched against built-in Administrator / Domain Admin patterns
  isServiceAccount: boolean;
  sourceIp: string;           // normalized IPv4/IPv6, ::ffff: unwrapped
  ipScope: "public" | "private";
  eventOutcome: AuthOutcome;
  sourceSystem: string;
}
```

| Acceptance Criteria | Test |
| :--- | :--- |
| Outcome strictly mapped to the 6-value enum; unmapped raw values map to `unknown`, never dropped | `test_outcome_mapping` |
| Timestamps without a timezone are flagged `tsTzAssumed = true` and assumed UTC | `test_utc_normalization` |
| IPv4-mapped IPv6 (`::ffff:192.0.2.1`) unwrapped to canonical IPv4 | `test_ipv6_unwrapping` |
| RFC1918 private IPs tagged `ipScope = "private"` | `test_private_ip_scope_tag` |
| Username lowercased, `DOMAIN\` and `@upn` stripped, raw string preserved separately | `test_username_canonicalization` |
| Future timestamps (> now + 1h) are flagged `ts_anomaly = "future"` but isolated from baselines, never silently dropped | `test_future_timestamp_isolation` |
| Timestamps before 2000-01-01 are rejected to `rejected_lines` as `IMPLAUSIBLE_TS` | `test_ancient_timestamp_rejection` |
| Missing username (pre-auth error) sets `userName = "__unknown__"`, `userPresent = false` | `test_missing_username_tag` |
| Credentials (passwords, password hashes) are dropped at this stage and never persisted | `test_credential_minimization` |
| Pure normalizer processes ≥ 20,000 events/sec single-threaded on reference hardware | `test_normalizer_throughput` |

**Evidence & Audit:** `eventHash` is the row's primary key; duplicate insertions are silent no-ops.
**Enterprise-Grade Touch:** Every timezone assumption is explicitly recorded, not silently guessed — a 5.5-hour offset error turns 3:30am anomalous activity into 9:00am normal business behavior, and Quorum makes that reasoning inspectable.
**Priority:** P0, non-cuttable.

---

## F4 — Deterministic Generator & Sealed Pack B

**User Story:** As Marcus, I need a reproducible labeled log corpus so Precision, Recall, and A2TP are measurements, not marketing.

**Scope Boundary — DOES:** Deterministic TypeScript generator (`npm run gen -- --pack A|B --users 1200 --days 14`) emitting realistic benign noise plus labeled attack scenarios. **DOES NOT:** ingest live traffic or simulate real network handshakes.

**Benign realism:** bimodal daily peaks at 09:00 and 14:00, a 65% weekend volume drop, a 2.5% organic password-typo rate, Monday-morning credential-reset spikes, and 4–8 persistently noisy service accounts.

**Eight labeled scenarios:**

| ID | Scenario | Parameters |
| :---: | :--- | :--- |
| A1 | Brute force | Single account, single IP, sustained high-volume failures |
| A2 | Single-source spray | One IP, ≥ 12 accounts, low per-account failure count |
| A3 | Low-and-slow single-IP | Same shape as A2, stretched across days at 3 events/day |
| A4 | Distributed botnet spray — **FLAGSHIP** | ~1,180 accounts, 312 residential-proxy IPs, ~1,888 events, 5-day window |
| A5 | Credential stuffing (out of P0 scope, generator supports it for roadmap testing) | ≥ 200 accounts, 0.5–15% success ratio |
| A6 | Impossible travel (out of P0 scope) | Two logins, > 500km apart, < 60 minutes |
| A7 | Spray-to-pivot | A2/A4 shape followed by one successful login on a targeted account |
| A8 | Insider off-hours (out of P0 scope) | Legitimate credentials, anomalous hours |

| Acceptance Criteria | Test |
| :--- | :--- |
| CLI invocation is deterministic and documented | `test_generator_cli` |
| Benign distribution matches the realism parameters above | `test_benign_distribution_realism` |
| All eight scenarios are generated with correct labels | `test_attack_scenarios_generated` |
| Pack A (seed 42) is open for tuning; Pack B (seed 1337) is sealed with a manifest (name, seed, user count, day count, per-scenario breakdown, SHA-256 hash) stored in Supabase Storage, immutable after sealing | `test_sealed_corpus_manifest` |
| Identical seed reruns produce byte-identical output | `test_generator_determinism` |
| **Anti-leak guardrail:** any object carrying a `_truth` key that reaches a detector function throws a fatal validation error at the type boundary | `test_truth_leakage_prevention` |

| Edge Case | Behavior | Test |
| :--- | :--- | :--- |
| Attacker IP collides with a benign employee IP | Regenerate up to 50 times; fail deterministically if still colliding | `test_ip_collision_retry` |
| Small directory (`--users 50`) requested | Scenario volumes scale to `min(requested, users)`, adjustment logged in the manifest | `test_small_directory_scaling` |
| Attempt to tune the F14 workbench against Pack B | Blocked with `403 SEALED_CORPUS_TUNING_BLOCKED` | `test_tuning_on_sealed_pack_blocked` |

**Enterprise-Grade Touch:** if the tuning-corpus hash ever equals the reporting-corpus hash, the F22 dashboard refuses to render final metrics and shows a red `METRICS INVALIDATED` banner instead of silently reporting a number.
**Priority:** P0, non-cuttable.

---

## F5 — Sliding-Window Brute-Force Rule (T1110.001)

**User Story:** As Priya, sustained failures against one account should collapse into one signal, not hundreds of rows — and this is also the exact rule that plays the role of "the naive SIEM" in the live demo.

**DOES:** Detect ≥ 12 failures against one `userName` within a 300-second sliding window from ≤ 3 distinct source IPs. **DOES NOT:** detect multi-account spraying (F6/F7's job).

| Acceptance Criteria | Test |
| :--- | :--- |
| Fires at ≥ 12 failures / 300s / ≤ 3 IPs per user | `test_brute_force_firing` |
| True sliding window, not tumbling — a burst spanning a window boundary is still caught | `test_sliding_window_boundary` |
| Logarithmic score saturation: `score = min(100, 40 + 60 · log10(fails/12 + 1) / log10(11))` | `test_logarithmic_score_saturation` |
| Built-in Administrator accounts (immune to standard lockout policy) escalate an `ADMIN_LOCKOUT_IMMUNE` flag | `test_ad_admin_lockout_immune` |
| Maps strictly to MITRE T1110.001 | `test_mitre_mapping_t1110_001` |
| A matched active suppression tags the signal `suppressed` rather than silently discarding it | `test_service_account_suppression` |

**Priority:** P0, non-cuttable — this rule, run alone, is exactly what produces the demo's "0 alerts" naive baseline.

---

## F6 — Single-Source Spray Rule (T1110.003)

**User Story:** As Priya, one IP quietly trying many accounts with few attempts each should be flagged as coordinated — and this is also the rule that, deliberately loosened, produces the demo's "97-alert flood."

**DOES:** Detect a single `sourceIp` hitting ≥ 12 distinct accounts within 1,800 seconds, ≤ 3 failures per account. **DOES NOT:** correlate across multiple IPs (F7's job).

| Acceptance Criteria | Test |
| :--- | :--- |
| Fires at ≥ 12 accounts / 1800s / ≤ 3 fails-per-account, single IP | `test_single_source_spray_firing` |
| Fanout ratio `distinctAccounts / totalAttempts` must exceed 0.80 | `test_fanout_ratio_calculation` |
| Requires a corporate-NAT/CGNAT discriminator gate (timing coefficient of variation < 0.25 OR new-account ratio > 0.5) before firing | `test_corporate_nat_discrimination` |
| Inter-arrival coefficient of variation `CV = σΔt/μΔt < 0.25` flags automated timing | `test_timing_cv_gate` |

**Enterprise-Grade Touch:** the discriminator decision is published on every evaluated candidate, including negative cases — an administrative view shows exactly which corporate-NAT candidates were evaluated and correctly suppressed, proving the system's false-positive discipline rather than just asserting it.
**Priority:** P0, non-cuttable.

---

## F7 — Distributed Campaign Graph via Union-Find (T1110.003) — THE FLAGSHIP

**User Story:** As Marcus, I need to see a spray distributed across hundreds of residential-proxy IPs over multiple days, even when no single IP or account ever crosses a local threshold.

**DOES:** Build a bipartite IP-to-account graph over a rolling 7-day window; extract connected components via a pure-TypeScript, integer-mapped Disjoint-Set Union (union by rank + path compression). **DOES NOT:** evaluate authentication successes (F10's job).

```text
Coverage    C = |targeted users| / |directory size|
Dispersion  D = |distinct IPs| / |distinct /24 subnets|
Uniformity  U = 1 − NormalizedVariance(attempts per user)
Regularity  R = μ(Δt) / σ(Δt)                         [inverse CV of inter-arrival times]

S_campaign  = 0.35·C + 0.25·D + 0.20·U + 0.20·R
```

| Acceptance Criteria | Test |
| :--- | :--- |
| Usernames/IPs mapped to integer IDs; components extracted via Union-Find | `test_unionfind_correctness` |
| Connected-component firing on components targeting ≥ 25 distinct accounts | `test_campaign_component_firing` |
| High-degree hubs (`degree > 200`, e.g. corporate NAT egress) pruned before graph construction | `test_hub_pruning` |
| Edge-count ceiling of 2,000,000; exceeding it deterministically shrinks the window to 3 days with a visible `WINDOW_DEGRADED` flag, never silent data loss | `test_edge_ceiling_degradation` |
| Detects low-and-slow, multi-day distributed shapes via structure, not volume | `test_low_and_slow_multi_day_detection` |
| Detects the flagship scenario (A4: ~1,180 accounts, 312 IPs, ~1,888 events, 5 days) at Critical severity | `test_flagship_campaign_detection` |

| Edge Case | Behavior | Test |
| :--- | :--- | :--- |
| Two unrelated campaigns run concurrently | Form two separate connected components → two separate incidents | `test_multi_campaign_separation` |
| Corporate NAT would otherwise link the whole directory into one giant node | Pruned before graph build, logged with hub IP + degree | `test_hub_pruning` (shared with above) |

**Enterprise-Grade Touch:** the incident detail renders a live comparison, computed from the same query the queue's contrast view uses: *"Coordinated spray targeting 1,180 accounts across 312 IPs over 5 days. Naive volume threshold: 0 alerts. Quorum: 1 Critical incident."*
**Priority:** P0, non-cuttable flagship component.

---

## F10 — Post-Spray Pivot Detector (T1110 → T1078) — THE CLIMAX

**User Story:** As Priya, the instant a previously-sprayed account logs in successfully, I need an immediate Critical alarm, not a queue entry I'll notice an hour later.

**DOES:** Correlate successful logins against the target set of any active F5/F6/F7 signal from the preceding 24 hours. **DOES NOT:** monitor post-login lateral movement.

| Acceptance Criteria | Test |
| :--- | :--- |
| Continuously evaluates a 24h correlation window against F5/F6/F7 target sets | `test_pivot_window_monitoring` |
| Emits a `PIVOT` signal on `outcome === "success"` for any targeted account | `test_pivot_signal_emission` |
| **Strict temporal ordering:** a success recorded before the spray signal's window start is never treated as a pivot | `test_pivot_strict_temporal_ordering` |
| Hard severity floor: locked to Critical (80–100), bypassing the multi-family minimum | `test_pivot_floor_80` |
| A success that pre-dates any spray activity on that account produces no pivot signal at all | `test_pivot_no_false_positive_on_pre_existing_success` |

**Priority:** P0, non-cuttable.

---

## F11 — Behavioural Baseline Engine (Robust Median/MAD)

**User Story:** As the system, I need historical per-account baselines that adapt to individual behavior rather than one global threshold.

**DOES:** Calculate 30-day rolling Median and Median Absolute Deviation per account. **DOES NOT:** use mean/standard deviation, which active attacks inflate and distort.

| Acceptance Criteria | Test |
| :--- | :--- |
| Robust z-score: `M = 0.6745 × (x − median) / MAD`; if `MAD == 0`, floors to `MAD = 1.0` | `test_mad_baseline_scoring` |
| Accounts with fewer than 50 historical events are tagged `baseline_immature` and capped at Low severity contribution | `test_immature_baseline_gate` |

**Priority:** P1 — defer to after the P0 spine is green if time is constrained; F11 corroborates but never independently escalates an incident.

---

## F12 — Unsupervised Vector Anomaly Scorer

**User Story:** As Marcus, I want an unsupervised model to surface complex multi-dimensional anomalies without generating unexplainable alerts.

**DOES:** Score aggregated 5-minute IP-bucket feature vectors (≥ 18 dimensions: volume, distinct accounts, fanout, timing statistics, and structural flags). **DOES NOT:** evaluate raw individual rows, and cannot independently reach above Medium severity.

| Acceptance Criteria | Test |
| :--- | :--- |
| Feature vectors extracted at the documented dimensionality | `test_ml_vector_scorer` |
| **Authority ceiling:** an ML-only signal (no corroborating family) is hard-capped at Medium (40–59) | `test_ml_medium_cap` |
| Top feature attributions computed via ablation for explainability | `test_ml_ablation_attribution` |

**Priority:** P1 — cut first from the live demo path if inference introduces latency; the flagship story (F7/F10/F13) does not depend on F12.

---

## F13 — Quorum Correlation & Severity Engine — THE CORE

**User Story:** As Priya, I want one deterministic severity score per incident, backed by a formula I can defend on the spot.

**DOES:** Cluster signals into incidents by shared entity key (Union-Find over `user`/`ip`/`/24`/`campaignId`); apply the multiplier table and hard overrides below. **DOES NOT:** use any non-deterministic input — ML output is a single vote among five, never a tiebreaker.

```text
Base                = max(normalisedScore across contributing signals)
QuorumMultiplier    = { 1: 0.75, 2: 1.00, 3: 1.25, 4: 1.40, 5: 1.50 }[familyCount]
Context             = (+15 Tor/proxy) + (+15 success observed)
                      + (+10 privileged account) + (+10 first-seen country)
                      − (20 all corporate egress) − (15 baseline immature)
RawSeverity         = clip(Base × QuorumMultiplier + Context, 0, 100)
```

**Hard overrides, applied in this exact sequence:**

1. `PIVOT` signal present → floor to Critical (80–100).
2. `familyCount === 1` and the sole family is `ML` → ceiling to Medium (40–59).
3. **Single-family anti-contradiction ceiling:** `familyCount === 1 AND family !== PIVOT` → hard ceiling at 79, no matter how much Context stacks.
4. **Anti-evidence-laundering guard:** if signals claim ≥ 3 agreeing families but collectively cite fewer than 3 unique underlying raw events, the multiplier is clamped to the 2-family level.
5. Active suppression match → reclassify to Informational (0–19), hidden from the default queue but never deleted.

**Example rendered equation (printed verbatim in the UI):**
`Base 100 (F10_pivot) × 1.00 (2 families: GRAPH, PIVOT) + 15 (auth success) → PIVOT floor 80 → clipped 100 [CRITICAL]`

| Acceptance Criteria | Test |
| :--- | :--- |
| Multiplier table applied exactly as specified | `test_quorum_multiplier_table` |
| Single-family ceiling of 79 holds regardless of context stacking | `test_single_family_critical_prevention` |
| Evidence-laundering guard clamps the multiplier correctly | `test_evidence_laundering_guard` |
| Flagship scenario detected at Critical via multi-family consensus | `test_midnight_blizzard_detection` |
| The `severity_equation` string persisted on the incident matches the actual arithmetic performed | `test_severity_equation_rendering` |
| Recurring detections extend an existing incident's occurrence count and promote to the peak severity observed, never duplicate the row | `test_fingerprint_occurrence_extension` |

**Priority:** P0, non-cuttable intellectual core.

---

## F15 / F16 — Analyst Cockpit & Evidence Timeline

**User Story:** As Priya, I want one queue ranked by severity, and one screen per incident showing the complete evidence chain and the printed severity math.

**DOES:** F15 — realtime-subscribed incident queue with a queue-health header and a naive/loosened/Quorum contrast toggle computed live. F16 — activity-over-time chart, paginated raw-evidence table, printed rationale, and human-confirmation-gated remediation buttons. **DOES NOT:** free-text search across unindexed raw logs, or execute any remediation action without a second confirmed step.

| Acceptance Criteria | Test |
| :--- | :--- |
| Queue sorted `severity DESC, lastSeen DESC` by default | `test_queue_sorting_order` |
| Realtime `INSERT`/`UPDATE` on `incidents` updates the queue without manual refresh | `test_realtime_incident_push` [e2e] |
| The naive/loosened/Quorum contrast recomputes live from `auth_events` on every toggle, never a cached or hard-coded number | `test_baseline_comparison_live_compute` |
| 100% of rendered claims on the incident-detail page link to a real `event_hash` | `test_total_citation_coverage` |
| A remediation button opens a confirmation modal naming the actor before any state changes | `test_human_confirmation_modal` [e2e] |

**Priority:** P0, non-cuttable core UI.

---

## F19 — Verdict Staging & Human-in-the-Loop Response

**User Story:** As Priya, I want to record triage decisions and stage containment actions without ever triggering an automated account block.

**DOES:** Record append-only verdicts (`disable_account` | `revoke_sessions` | `reset_credentials` | `false_positive` | `escalate`) with a mandatory note and attributed actor. **DOES NOT:** execute any action directly against a real identity provider in v4 — every action is *staged*, requiring a second, separately-authenticated confirmation call.

| Acceptance Criteria | Test |
| :--- | :--- |
| Verdicts are append-only with a `supersedes` self-reference; no row is ever overwritten or deleted | `test_verdict_append_only` |
| Every verdict requires an attributed `actor_id` — anonymous verdicts are rejected | `test_verdict_requires_actor` |
| An amended verdict appends a new row pointing back at the original via `supersedes`; both remain visible | `test_verdict_supersede_chain` |
| The API response and UI footer both state, verbatim: *"staged for human execution — Quorum never auto-enforces"* | `test_anti_autoenforce_copy_present` |

**Priority:** P0, non-cuttable core workflow.

---

## F21 — Hash-Chained Audit Ledger (NIST SP 800-92 Aligned)

**User Story:** As Sandhya, I need proof, not a promise, that nobody silently edited the incident history.

**DOES:** Every write to `incidents`/`verdicts` appends one `audit_ledger` row chained by SHA-256; immutability enforced at both the trigger and grant level. **DOES NOT:** claim legal chain-of-custody (NIST SP 800-86 requires WORM media and a third-party timestamp authority — stated explicitly on the UI, not hidden).

```sql
-- Hash chain: RowHash_i = SHA256(RowHash_{i-1} || id || ts || actor || action || resource || payload)
CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON audit_ledger
FOR EACH ROW EXECUTE FUNCTION trg_audit_lock();  -- unconditionally RAISE EXCEPTION

REVOKE UPDATE, DELETE ON audit_ledger FROM authenticated, anon;
GRANT INSERT, SELECT ON audit_ledger TO service_role;
```

| Acceptance Criteria | Test |
| :--- | :--- |
| Hash-chain computation matches the documented formula exactly | `test_hash_chain_computation` |
| Verification RPC recomputes the chain (100,000 rows) and localizes any broken row in < 3 seconds | `test_tamper_localization`, `test_ledger_verification_latency` |
| The append-only trigger blocks every `UPDATE`/`DELETE` attempt at the database level | `test_append_only_trigger` |
| A demo-only, feature-flagged tamper fixture mutates one historical row out-of-band, only when `NEXT_PUBLIC_DEMO_MODE` is set | `test_demo_tamper_fixture_isolated_from_prod_flag` |

**Priority:** P0, non-cuttable enterprise differentiator.

---

## F22 — Quality Gates & Limitations Panel

**User Story:** As Marcus, I want one dashboard proving our numbers are real, sealed, and honestly bounded.

**DOES:** Run the gate runner against sealed Pack B, compute all metrics from Section 6.5, and render a permanent limitations panel. **DOES NOT:** hide any per-scenario result, weak or strong.

| Acceptance Criteria | Test |
| :--- | :--- |
| The gate runner computes A2TP, campaign recall, MTTD, clean-corpus FP, and event F1 and prints a PASS/FAIL badge per gate against the sealed hash | `test_gate_runner_metrics` |
| **Fragment absorption:** a stale ramp-up signal cluster whose evidence set is a strict subset of a surviving incident's evidence is absorbed into the parent incident rather than reported separately — this exact mechanic is what takes A2TP from a naive 3.375 down to the measured 1.5 | `test_fragment_absorption` |
| Clean-corpus run (zero planted attacks) produces at most 3 incidents, target 0 | `test_clean_corpus_fp_gate` |
| The limitations panel text (Section 6.5) is rendered and cannot be dismissed by any role | `test_limitations_panel_present` |

**Priority:** P0, non-cuttable credibility component.

---

## F14 (Trust Extra) — Suppression & Tuning Workbench

**DOES:** Time-bounded (`expires_at ≤ 180 days`), scoped (`user`/`source_ip`/`subnet_24`/`detector`), owner-attributed suppression rules; a threshold-tuning UI that re-runs the full labeled Pack A evaluation in under 60 seconds with before/after Precision/Recall/F1/A2TP.

| Acceptance Criteria | Test |
| :--- | :--- |
| Validation rejects anonymous entries and reasons under 20 characters with explicit error codes (`REASON_TOO_SHORT`, `ANONYMOUS_SUPPRESSION`, `EXPIRY_TOO_FAR`, `ALREADY_EXPIRED`, `INVALID_SCOPE`) | `test_suppression_validation` |
| Suppressions drop matching entity *votes* pre-cluster — never raw events; this is hygiene, not truth-alteration | `test_suppression_drops_only_suppressed_entity_votes` |
| A suppression covering > 25% of corpus events is rejected as `422 SUPPRESSION_TOO_BROAD` | `test_overly_broad_suppression_blocked` |
| Full Pack A re-evaluation completes in < 60 seconds | `test_tuning_workbench_reeval_under_60s` |
| Threshold overrides visibly change detector parameters and re-fire the pipeline | `test_tuning_overrides_change_detector_params` |

**Priority:** T — build only after the P0 spine is fully green.

---

## F25 (Trust Extra) — Sentinel & STIX 2.1 Interoperability

**DOES:** Deterministic offline export builders — UUIDv5-derived IDs so identical database state always produces a byte-identical export. Microsoft Sentinel incident-schema JSON (title, severity, tactics, techniques, entities, extended properties including the printed severity equation) and STIX 2.1 bundles (identity, indicator, observed-data, relationship, and IPv4/user-account SCOs). Ships `docs/kql/` with reference KQL for the single-source rules plus written analysis of what KQL cannot express natively: multi-family consensus arithmetic, cross-source bipartite graph correlation, and seasonal Median/MAD baselining.

| Acceptance Criteria | Test |
| :--- | :--- |
| Sentinel schema export matches the documented field mapping | `test_sentinel_schema_export` |
| STIX 2.1 bundle validates against the 2.1 spec structure | `test_stix_bundle_serialization` |
| Identical DB state produces a byte-identical export file | `test_export_byte_determinism` |
| `docs/kql/` reference files and the KQL-gap analysis exist and are current | `test_kql_reference_docs_present` |

**Priority:** T — if time is constrained, ship the KQL docs and JSON schema examples as static files before building the live REST endpoints.

---

# SECTION 8 — COCKPIT UI/UX SPECIFICATION

## 8.1 Design System

True-black canvas (`#000000`) with a deep technical-slate surface (`#080C14`), 1px borders at `rgba(255,255,255,0.08)` instead of heavy blur, 8px spacing grid, `Geist`/`Space Grotesk` for headings, `JetBrains Mono` for every piece of machine data (hashes, IPs, the severity equation), 150ms functional ease-out transitions, zero bouncing or decorative motion. Semantic color is reserved exclusively for severity: muted slate (normal), amber (warning), crimson (critical), emerald (verified/resolved) — never used decoratively elsewhere. Light mode is supported for projector visibility but dark is the default demo mode.

## 8.2 Component-to-21st.dev Pattern Mapping

Every component below renders **live Supabase data** — a premium component with nothing real behind it is a worse demo than no component at all.

| Cockpit Section | 21st.dev Pattern | Bound To |
| :--- | :--- | :--- |
| Global navigation | Cmd+K command menu | Jump to any incident by ID; run "Verify Audit Chain"; switch demo role |
| Contrast hero (0 / 97 / 1) | Animated counter / rolling-digit ticker | Three live queries against `auth_events`, not a scripted animation |
| Incident queue (F15) | Sortable, expandable data table | `incidents` table, Realtime-subscribed |
| Live incident queue updates | Animated list / infinite moving cards | Realtime channel push on `INSERT`/`UPDATE` |
| Audit ledger (F21) | Connected block/rail timeline | `audit_ledger` rows, visibly breaking on the tamper-demo click |
| Metrics overview (F22) | Purpose-built asymmetric panel grid (structured, not decorative filler) | Gate-runner output, one real number per panel |
| F14 tuning workbench | Dual-range sliders + before/after metric table | Live Pack A re-evaluation result |
| F25 exports | Download buttons + JSON preview popover | Actual generated export files |
| Async loading states | Skeleton loaders | Every Supabase fetch, never a blank flash |
| Staged verdicts | Toast notification system | `submit_verdict` RPC result |

## 8.3 Screen-by-Screen Analyst Journey

1. **Land** → hero contrast (0 / 97 / 1), one-line thesis, single CTA.
2. **Queue** → severity-sorted, realtime, queue-health header (open count, 24h volume, live A2TP).
3. **Incident detail** → printed severity equation, activity-over-time chart, evidence table.
4. **Evidence drill-down** → every citation chip links to the exact backing `event_hash` row.
5. **Staged verdict** → confirmation modal naming the actor; toast confirms staging, not execution.
6. **Audit verify** → one-click chain verification; tamper-demo button (visible only in demo mode) breaks it live.
7. **Export** → Sentinel/STIX download with a JSON preview before download.

Empty states are always instructive, never blank (e.g., an empty queue shows *"0 open incidents — last ingest completed 4 minutes ago, 11,768 events processed"*, not a bare "no data"). The anti-DoS footer line from Section 3.3 appears on every screen.

## 8.4 Accessibility Bar

Lighthouse accessibility score ≥ 90; the incident queue is fully keyboard-navigable (`j`/`k` row navigation, `Enter` to open); severity is never conveyed by color alone — every severity pill carries a text label; equation blocks carry ARIA labels describing the computed result for screen readers.

## 8.5 "Looks Expensive" Checklist

Micro-interactions capped at 200ms; zero layout shift on data load (skeletons reserve final dimensions); numeric values never visibly reflow after settling; empty states are designed, not default; exactly one hero animation is permitted per screen, to protect the performance budget on a presenting laptop under load.

---

# SECTION 9 — DATA MODEL & SECURITY

## 9.1 Table Specifications

| Table | Key Columns | Constraints |
| :--- | :--- | :--- |
| `auth_events` | `event_hash` (PK) · `timestamp_utc` · `user_name` · `source_ip` · `event_outcome` | `event_hash` unique, computed server-side only |
| `ingest_jobs` | `id` · `file_sha256` · `status` (`COMPLETED`\|`DEGRADED`\|`REJECTED`) · `rejection_ratio` | `file_sha256` unique — enforces F1 idempotency |
| `rejected_lines` | `id` · `job_id` · `line_no` · `raw_line` · `reason` | Capped at 1,000 rows per `job_id` by application logic |
| `signals` | `id` · `detector_family` · `entity_type` · `entity_value` · `evidence_event_hashes[]` | No client `INSERT`/`UPDATE`/`DELETE` grant — pipeline output only |
| `incidents` | `id` · `fingerprint` (unique) · `severity` · `quorum_count` · `status` · `rationale_text` | `fingerprint` unique for dedup/occurrence-extension |
| `verdicts` | `id` · `incident_id` · `verdict` · `note` · `supersedes` (self-FK) | `UPDATE`/`DELETE` revoked at the grant level |
| `audit_ledger` | `id` · `ts_utc` · `actor_id` · `action` · `prev_hash` · `row_hash` | `UPDATE`/`DELETE` blocked by trigger AND grant revocation (two independent layers) |
| `suppression_rules` | `id` · `scope` · `pattern` · `reason` · `owner_id` · `expires_at` | `CHECK` constraints on reason length and expiry window |
| `packs` (corpus manifests) | `pack_name` · `seed` · `sha256_hash` · `sealed_at` | Immutable once `sealed_at` is set (same trigger pattern as `audit_ledger`) |

```sql
CREATE TABLE audit_ledger (
    id BIGSERIAL PRIMARY KEY,
    ts_utc TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    prev_hash CHAR(64) NOT NULL,
    row_hash CHAR(64) NOT NULL
);

CREATE OR REPLACE FUNCTION trg_audit_lock() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_ledger is append-only (attempted %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON audit_ledger
FOR EACH ROW EXECUTE FUNCTION trg_audit_lock();

REVOKE UPDATE, DELETE ON audit_ledger FROM authenticated, anon;
GRANT INSERT, SELECT ON audit_ledger TO service_role;
```

## 9.2 RLS Policy Summary

| Table | `analyst` | `admin` | `service_role` |
| :--- | :--- | :--- | :--- |
| `auth_events` | SELECT | SELECT | INSERT (via RPC only) |
| `rejected_lines` | — | SELECT | INSERT (via RPC only) |
| `signals` | SELECT | SELECT | INSERT (via RPC only) |
| `incidents` | SELECT, status/verdict UPDATE via RPC | SELECT, UPDATE via RPC | INSERT (via RPC only) |
| `verdicts` | SELECT, INSERT via RPC | SELECT, INSERT via RPC | — |
| `audit_ledger` | — | SELECT only | INSERT only; **UPDATE/DELETE granted to nobody, ever** |
| `suppression_rules` | SELECT | SELECT, INSERT | — |
| `packs` | SELECT | SELECT | INSERT once, immutable after `sealed_at` |

Every role check is evaluated via `auth.jwt() ->> 'role'` inside the RLS policy definition itself — never trusted from a client-supplied header or request body field.

## 9.3 The Ingest Bug That Must Never Happen Again

v1's one real production failure was a partial multi-row SQLite write during a live cockpit ingest — a crash mid-batch left signals written without their incidents, which the UI could not render, and the demo stalled. v4 makes this bug class structurally impossible with one rule: **every operation that writes more than one row across `signals`/`incidents`/`audit_ledger` goes through exactly one function, `commit_detection_batch(payload jsonb, idempotency_key text)`, and nothing else in the application is permitted to write to those tables.**

```sql
CREATE OR REPLACE FUNCTION commit_detection_batch(payload jsonb, idem_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM committed_batches WHERE idempotency_key = idem_key) THEN
    RETURN jsonb_build_object('status', 'already_committed', 'idempotency_key', idem_key);
  END IF;

  -- Everything below runs inside the implicit function transaction:
  -- any raised exception rolls back every insert in this call together.
  INSERT INTO signals SELECT * FROM jsonb_populate_recordset(null::signals, payload->'signals');
  INSERT INTO incidents SELECT * FROM jsonb_populate_recordset(null::incidents, payload->'incidents')
    ON CONFLICT (fingerprint) DO UPDATE
      SET occurrence_count = incidents.occurrence_count + 1,
          last_seen_at = EXCLUDED.last_seen_at;
  INSERT INTO audit_ledger (actor_id, action, resource_type, resource_id, payload_json, prev_hash, row_hash)
    SELECT service_actor_id(), 'DETECTION_BATCH_COMMITTED', 'incident', i->>'id', payload,
           (SELECT row_hash FROM audit_ledger ORDER BY id DESC LIMIT 1),
           compute_row_hash(payload)
    FROM jsonb_array_elements(payload->'incidents') AS i;
  INSERT INTO committed_batches (idempotency_key) VALUES (idem_key);

  RETURN jsonb_build_object('status', 'committed', 'idempotency_key', idem_key);
END;
$$;
```

If the Node process crashes mid-flight awaiting this call, Postgres has applied the whole function body or none of it — there is no state where signals exist without incidents, or incidents without an audit trail. A dedicated fault-injection test proves this: `test_transactional_atomicity_under_fault` kills the connection deliberately and asserts the post-crash row counts are exactly 0 or exactly the full batch. A second test, `test_ingest_idempotency_replay_safe`, proves calling `commit_detection_batch` twice with the same `idempotency_key` and different payloads is a strict no-op on the second call — proving two simultaneous ingests of the same corpus produce exactly one set of rows, not duplicates.

## 9.4 Threat Model

No claim here is "unhackable" — that phrase is a liability, not a strength, in front of a security-literate judge. This is the explicit, honest threat model instead.

| # | Threat | Mitigation | Residual Risk (stated honestly) |
| :---: | :--- | :--- | :--- |
| T1 | Unauthenticated read of incident/audit data | RLS on every table; `anon` has zero grants beyond sign-in | None known within the RLS boundary itself |
| T2 | Privilege escalation (`analyst` acting as `admin`) | Every admin-only action re-checks the JWT role server-side inside a `SECURITY DEFINER` RPC, never client-side only | A compromised `service_role` key bypasses everything — see T6 |
| T3 | Audit ledger tampering | Trigger + grant-level revocation (two independent layers, Section 9.1) | A `service_role`-holding attacker could still forge a new row; the chain would show the row exists but the next real append's hash would no longer match — detected, not silently prevented, and this is disclosed on the audit UI itself |
| T4 | SQL injection via ingest or suppression input | 100% parameterized calls or the single RPC path; zero string-concatenated SQL anywhere | None known within the stated boundary |
| T5 | Denial-of-service via oversized upload | 250MB streaming byte-count reject (F1) plus an independent Storage bucket size cap | Flood of many small valid-looking uploads is a rate-limiting concern, not a size one — see T7 |
| T6 | `service_role` key exposure | Used only server-side, never sent to the browser; CI secret-scan gate (Section 9.5) fails the build on any key-shaped string in a diff | A compromised developer machine is out of scope for an application-layer control |
| T7 | Brute-forcing the two demo accounts | Supabase Auth rate limiting plus an app-level 429 after 5 failed attempts/IP/5min, backed by Postgres so it survives serverless cold starts | Demo passwords are generated fresh and rotated before judging — a process control, listed in Appendix D |
| T8 | Insider misuse of remediation actions | No code path anywhere can auto-disable an account; `stage_action` and `confirm_action` are two separately-authenticated calls | An admin who confirms a malicious action is a personnel problem, not a software one — the anti-DoS boundary from Section 6.4 |
| T9 | XSS via attacker-controlled log content rendered in the UI | React's default JSX escaping; raw lines render via `textContent`, never `dangerouslySetInnerHTML` | None known within the stated rendering paths |
| T10 | Dependency supply-chain compromise | `npm audit --audit-level=high` as a CI gate; the detection plane itself has zero runtime dependencies | Undisclosed zero-days are an inherent, unavoidable risk for any software |

## 9.5 CI/CD Security Gates

```yaml
jobs:
  lint-and-typecheck:      # tsc --strict, eslint
  secret-scan:             # full-history scan, blocks merge
  dependency-audit:        # npm audit --audit-level=high
  unit-tests:              # 130+ Vitest tests, zero mocking on the pure detection plane
  rls-and-security-tests:  # the T1–T10 adversarial suite, run against a disposable local instance
  build:                   # next build, zero warnings-as-errors
  e2e:                     # Playwright, the 3 journeys from Appendix E
  # Merge to main blocked unless every job is green AND a human has applied
  # the security-sql-reviewed label to any PR touching /supabase/migrations
```

## 9.6 Secrets & Deployment Hardening

`service_role` and JWT-secret values live only in `.env.local` (gitignored) locally and the hosting provider's encrypted environment store in deployment — never in the client bundle. The browser only ever receives the Supabase `anon` public key, meaningless without a valid RLS-scoped session. `NEXT_PUBLIC_DEMO_MODE` gates the tamper-simulation fixture and any other stage-only route so they return `404` on the production deployment. Demo account passwords are generated fresh, never reused, and rotated the morning of judging.

---

# SECTION 10 — EVALUATION SPECIFICATION

## 10.1 Corpus Split Rationale

Pack A (seed 42) is open for tuning — engineers may inspect it, adjust thresholds against it, and iterate freely. Pack B (seed 1337) is sealed the moment it is generated: its SHA-256 manifest hash is written to Supabase Storage and the `packs` table becomes immutable for that row. Every metric reported publicly is computed against Pack B only. An automated integrity check compares the two packs' hashes on every evaluation run — if they ever match, tuning has leaked into reporting, and the F22 dashboard refuses to render final numbers, showing a red banner instead.

## 10.2 Metric Formulas

```text
Event Precision   = TP_events / (TP_events + FP_events)
Event Recall      = TP_events / (TP_events + FN_events)
Event F1          = 2 · (Precision · Recall) / (Precision + Recall)
Campaign Recall   = campaigns_detected / campaigns_planted
A2TP              = incidents_raised / true_positive_campaigns
Median MTTD       = median(incident_created_at − first_attack_event_at) across true positives
Clean-Corpus FP   = count(incidents) on a corpus with zero planted attacks
```

## 10.3 Gate Table — Targets vs. Prior Measured Values

| Metric | Gate (v4 Requirement) | v1 Measured — Proof of Achievability | How to Read This Row |
| :--- | :---: | :---: | :--- |
| A2TP | ≤ 3.0 : 1 | 1.5 : 1 | The gate is ≤ 3.0. v1's 1.5 proves it is achievable; a v4 result of 2.0 is GREEN — do not chase 1.5 at the cost of the build calendar |
| Campaign Recall | ≥ 92% | 100% (8/8 scenarios) | The gate is ≥ 92%. v1's 100% came from one sealed run; a regenerated v4 corpus may legitimately land at 95% and still pass |
| Median MTTD | ≤ 5 min | 2.68 min | The gate is ≤ 5 min; v1's 2.68 shows headroom. A different batch quantum may shift the exact median |
| Clean-Corpus FP | ≤ 3 | 0 (over 4,673 benign events) | The gate is ≤ 3; 0 is the expected result, 1–2 passing rows are acceptable |
| Event F1 | ≥ 0.87 | 0.9228 | The gate is ≥ 0.87 |
| Live Contrast | Naive 0 / loosened flood / Quorum 1 CRITICAL — computed live, never hard-coded | 0 / 97 / 1 on 11,768 events, 8 planted campaigns | Reproduce the structure live on the v4 sealed corpus; the exact flood count may differ and must be computed from the database |

**Reading rule:** the middle column exists to prove these gates are achievable, not to set a stricter bar. The gate column is the requirement; the v1 column is evidence. Treating v1's exact measured values as the new targets is scope risk, not quality.

## 10.4 Fragment-Absorption & Occurrence-Extension Mechanics

```text
function reconcileIncident(newCluster, existingIncidents):
    for existing in existingIncidents:
        if newCluster.evidenceEventHashes ⊆ existing.evidenceEventHashes:
            # newCluster is a stale ramp-up fragment of an already-surviving incident
            existing.occurrenceCount += 1
            existing.lastSeenAt = newCluster.windowEnd
            existing.severity = max(existing.severity, newCluster.severity)
            return ABSORBED_INTO(existing)
    return NEW_INCIDENT(newCluster)
```

This single mechanic — absorbing subset-evidence fragments into their parent incident rather than reporting them as separate rows — is precisely what takes a naive per-window A2TP of 3.375 down to the measured 1.5:1.

## 10.5 Per-Scenario Detection Expectation

| Scenario | Expected Detecting Family(ies) | Why |
| :--- | :--- | :--- |
| A1 Brute force | RULE (F5) | Single-account volume is exactly F5's design target |
| A2 Single-source spray | RULE (F6) | Single-IP fanout with timing discriminator |
| A3 Low-and-slow, single IP | GRAPH (F7) | Volume too low for F6; structural coverage/regularity still visible to F7 |
| A4 Distributed botnet (flagship) | GRAPH (F7) + ML (F12) consensus | Bipartite structure is the primary signal; ML corroborates via feature-vector anomaly |
| A7 Spray-to-pivot | GRAPH/RULE + PIVOT (F10) | Spray establishes the target set; PIVOT fires the floor the instant success is observed |

---

# SECTION 11 — BUILD PLAN & EXECUTION ROADMAP

## 11.1 Team Model

| Role | Owns | Backup |
| :--- | :--- | :--- |
| Architect | Supabase schema, RLS, RPC functions, audit ledger | Scientist |
| Scientist | Detection plane (F5/F6/F7/F10/F13), Vitest suite | Architect |
| Designer | Next.js cockpit, 21st.dev component wiring, Playwright e2e | Scribe |
| Scribe | Generator (F4), evaluation gate runner, documentation, demo script | Designer |

## 11.2 Hard Engineering Rules (Restated as a Checklist)

- [ ] Exactly one transaction wrapper (`commit_detection_batch`) for every multi-row write — no exceptions, no second write path ever added under time pressure.
- [ ] Every generator run is byte-determinism-tested three times before being trusted.
- [ ] Zero fabricated UI numbers — every displayed metric traces to a live query or a stored gate-runner result.
- [ ] Named tests match this PRD exactly — a test with a different name for the same acceptance criterion is a documentation-drift bug.
- [ ] `tsc --strict` with zero `any` in the detection plane.
- [ ] Stop for a full team review at the end of Phase 3 and Phase 6 — not a formality, an actual pause to re-read the diff against this PRD.

## 11.3 Six Phases, Each Ending at a Green Gate

| Phase | Deliverables | Owner | Exit Gate | Rollback Note |
| :---: | :--- | :--- | :--- | :--- |
| **1. Foundation** | Supabase schema + RLS policies + Auth roles seeded; `AuthEvent`/`Signal`/`Incident` types (F2) | Architect | RLS policy tests green; `test_utc_normalization`, `test_username_canonicalization` green | If RLS is unstable, temporarily widen policies to `admin`-only reads and narrow again before Phase 5 |
| **2. Ingest & Ground Truth** | F1 ingest; F4 generator, Pack A + sealed Pack B | Scribe | `test_generator_determinism` ×3 stable; `test_sealed_corpus_manifest`; `test_clean_corpus_zero_incidents`; naive F5-only run on the flagship scenario confirmed at 0 alerts | If the generator's realism tuning stalls, ship a simpler benign model and note the simplification in Appendix C |
| **3. Detection Core** | F5, F6, F7 (Union-Find), F13 full arithmetic + all 5 overrides | Scientist | `test_flagship_campaign_detection`, `test_single_family_critical_prevention`, `test_evidence_laundering_guard` green; A2TP on Pack A ≤ 3.0 — **team review checkpoint** | If F7 performance is a problem at scale, the 2M-edge ceiling degradation (already in spec) is the sanctioned fallback, not a silent skip |
| **4. The Climax + Transactional Integrity** | F10 pivot detector; `commit_detection_batch` wired as the sole write path | Architect + Scientist | `test_pivot_strict_temporal_ordering`, `test_pivot_floor_80` green; `test_transactional_atomicity_under_fault` proves atomic all-or-nothing writes | None — this phase is the direct v1 bug fix and is never partially skipped |
| **5. Cockpit & Audit** | F15/F16 UI wired to Realtime; F21 ledger + tamper demo; F22 dashboard | Designer | `test_realtime_incident_push` [e2e], `test_demo_tamper_detection`, `test_limitations_panel_present` green; full 3-minute demo script runs end-to-end on a clean clone | If Realtime proves flaky, fall back to 5-second polling — same UI, no visible behavior change to a judge |
| **6. Trust Extras & Hardening** | F14, F25, full Playwright + Lighthouse ≥ 90, CI enforced | All | 130+ Vitest tests green; full Playwright suite green; `npm run build && npm start` succeeds from a fresh clone in under 10 minutes — **final team review checkpoint** | F14/F25 are the first things cut if this phase runs long; the P0 spine has already shipped by Phase 5 |

## 11.4 Reference Schedule (with buffer, not a hard deadline)

| Days (approx.) | Phase |
| :---: | :--- |
| 1–3 | Phase 1 |
| 4–7 | Phase 2 |
| 8–12 | Phase 3 |
| 13–15 | Phase 4 |
| 16–18 | Phase 5 |
| 19–21 | Phase 6, buffer, rehearsal |

This table is a planning aid, not a promise — the actual measure of progress is always "which phase gate is green," never "what day is it" (Section 0).

---

# SECTION 12 — THE 3-MINUTE DEMO SCRIPT

**Pre-stage checklist:** laptop on mains power, Wi-Fi physically disabled, local `supabase start` running, database reset to a clean seeded snapshot, browser at 125% zoom, backup tab pre-warmed with the same state loaded, narration in this script cross-checked against the on-screen equation and dashboard numbers.

### [0:00 – 0:20] Cold Open — The Thesis

> **"Microsoft had the logs when Midnight Blizzard breached their corporate email. The attack was a password spray engineered to look exactly like normal login noise. Our thesis: every alert needs evidence, every incident needs independent agreement. This is Quorum."**

*(Screen: hero contrast view, all zeros, not yet run.)*

### [0:20 – 0:50] The Contrast — 0 vs. 97 vs. 1

*(Click: Run Detection.)*

> **"Same corpus, three lenses. A naive volume rule: 1,180 accounts sprayed, 312 IPs — zero alerts, because the attack was built to stay under the threshold."**

*(Ticker rolls to 0.)*

> **"Loosen that threshold to catch it — now it's a 97-alert flood. Technically caught. Practically unusable — that's a full shift of triage for one campaign."**

*(Ticker rolls to 97.)*

> **"Quorum: one Critical incident. Not because we ran a smarter single rule — because we required independent agreement across detector families before we called it Critical."**

*(Ticker rolls to 1. All three numbers were computed live from the same database seconds ago.)*

### [0:50 – 1:30] The Incident — Reading the Equation Aloud

*(Click into the incident. The equation on screen — from the sealed-corpus run this demo is built on — reads: `Base 100 (F10_pivot) × 1.00 (2 families: GRAPH, PIVOT) + 15 (auth success) → PIVOT floor 80 → clipped 100 [CRITICAL]`.)*

> **"Here's why this is Critical — and it's not a black box, it's printed arithmetic. Base score 100. Times 1.00 — exactly two independent detector families agree here: graph, and pivot. Plus 15, because the targeted account authenticated successfully. Then the hard override that gives the base its meaning: a post-spray success floors the entire incident at 80. It clips at 100. Critical. Every number traces to a real event hash — click any citation and it jumps to the exact log line."**
>
> *(Rehearsal rule: narrate the equation that is on the screen, never a memorized one. If the regenerated v4 corpus shifts any number, update this paragraph to match the printed equation before going on stage.)*

### [1:30 – 2:00] The Climax and the Ledger

> **"And here is why the base was 100: this moment. One of those 1,180 sprayed accounts logged in successfully. The pivot detector caught it and floored the incident to Critical instantly — this is no longer 'suspicious,' this is 'confirmed access.'"**
>
> **"Every decision here is written to a hash-chained audit ledger."**

*(Click: Simulate Tamper → Click: Verify Chain.)*

> **"Watch — I just modified a historical record out-of-band, the way a rogue database administrator might. The verifier localizes the exact broken row in under three seconds. This is append-only, tamper-evident logging."**

### [2:00 – 2:30] Honest Metrics

*(Switch to the quality dashboard.)*

> **"Measured on our sealed evaluation corpus — 11,768 events, 8 planted campaigns, a seed our tuning workbench is programmatically barred from ever touching: campaign recall 100%, event F1 0.9228, and our headline operational metric — an alert-to-true-positive ratio of 1.5 to 1."**
>
> **"And here's what other teams leave off stage."** *(Point to the limitations panel.)* **"This is synthetic data. We have not validated this against a live enterprise network. We say so, permanently, right here."**

### [2:30 – 2:50] Anti-DoS Boundary and Close

> **"One more thing we want you to notice: nowhere in this product can an incident automatically disable an account. Every response action is staged and requires a named human to confirm it — because a tool that could auto-lock accounts could be turned into a weapon against your own employees."**
>
> **"Traditional systems ask if one IP failed too many times. Quorum asks if all authentication events form one coordinated campaign, and proves every claim with inspectable evidence. Thank you."**

### Stage Recovery Protocol

| Failure Mode | Recovery Line | Action |
| :--- | :--- | :--- |
| Pipeline stalls | *"That's the live pipeline — let me switch to the identical pre-loaded state."* | Switch to backup tab |
| Realtime drops | *"Realtime is optional — the queue polls every five seconds as a fallback."* | Continue, note the polling badge |
| Audit chain fails to render | *"Let me show the pre-verified run from this morning."* | Open the cached verification log |
| Browser crashes | *"This is exactly why we pre-warm a second session."* | Switch laptops/tabs |

---

# SECTION 13 — JUDGE Q&A WAR ROOM

| # | Question | Direct Answer | Evidence in the Build | Honest Limitation |
| :---: | :--- | :--- | :--- | :--- |
| 1 | Why not just lower your alert thresholds? | We measured it — lowering the threshold on this exact corpus produces a 97-alert flood, which is functionally unusable for triage. | Live contrast demo, Section 12 | A different corpus could produce a different flood size — the mechanism, not the exact number, is the claim. |
| 2 | Why not machine learning end-to-end? | ML alone caps at Medium severity (F12) because it corroborates, it doesn't convict — an unexplainable model shouldn't be able to unilaterally call something Critical. | F13's hard override table | ML still contributes real signal; we simply refuse to let it be the sole vote for the highest severity tier. |
| 3 | Why not use an LLM anywhere in detection? | Non-deterministic, prompt-injectable via attacker-controlled log content, and it would undermine our "printed equation" trust story. | Kill list, Section 3.3 | We'd consider an LLM for optional narrative summarization *after* severity is already deterministically computed — never for scoring. |
| 4 | What if an attacker sprays deliberately to trigger a false lockout? | Quorum never auto-locks anything, ever, at any severity. Every action requires human confirmation naming the actor. | F19, Section 6.4 non-goals | This is a deliberate ceiling on automation, not a gap we intend to close later. |
| 5 | Does this replace Microsoft Sentinel? | No — it's a correlation layer in front of it. We export to Sentinel's own incident schema. | F25 | We do not claim general-purpose SIEM functionality: no long-term raw retention, no general query language. |
| 6 | Are your metrics real or estimated? | Real, measured against a sealed corpus our own tuning workbench is programmatically barred from touching. | F4's Pack A/B split, F22's integrity check | They are measured on synthetic data — stated permanently on the dashboard, not just in this conversation. |
| 7 | What can't this system detect? | Campaigns under 25 targeted accounts fall below the graph detector's structural floor; credential stuffing and impossible-travel are explicitly out of scope. | Section 6.5, kill list | This is a scoping decision, not an oversight — we chose depth on one attack class over breadth across many. |
| 8 | How is this different from commercial anomaly-detection vendors? | Our severity arithmetic is fully printed and inspectable per incident — no black-box score. | F13's rendered equation | We aren't claiming to out-perform mature commercial products on raw detection breadth; we're claiming a specific, defensible mechanism. |
| 9 | Why Union-Find over a graph neural network? | Union-Find is deterministic, fully explainable, and runs in near-linear time with zero training data requirement — appropriate for a first build with no labeled production data. | F7 | A GNN could plausibly generalize better with enough labeled production data — a legitimate future direction, not a rejection of the idea. |
| 10 | What about IPv6 or rapid proxy rotation? | F2 normalizes IPv6 (including unwrapping IPv4-mapped addresses); F7's graph structure inherently tolerates high IP churn because it clusters on account-side topology, not IP identity alone. | F2, F7 | We have not stress-tested against adversarial IPv6 prefix rotation specifically designed to defeat subnet-based dispersion scoring. |
| 11 | If a rogue DBA has direct database access, how does the ledger help? | It doesn't prevent a privileged insider from writing a forged row — it detects the resulting inconsistency the next time a real row is appended, and localizes exactly which row broke. | Section 9.4, T3 | Stated explicitly: tamper-evident within the application's trust boundary, not legal chain-of-custody. |
| 12 | What does this cost to run? | ₹0/$0 on free tiers for a demo-scale corpus; production cost would scale with Supabase's paid-tier pricing as event volume grows past free-tier limits. | Section 0 budget line | We have not modeled production-scale hosting cost — out of scope for this build. |
| 13 | Does this scale beyond your benchmark throughput? | Our benchmark target is ≥ 12,000 events/second on a single Postgres instance; true production scale would likely require a dedicated stream-processing layer. | Section 6.5 instrument panel | Not tested beyond the benchmark corpus size in this build. |
| 14 | How do false positives get handled in practice? | Through F14's suppression workbench — scoped, owned, time-bounded, auditable — never a silent, permanent allowlist. | F14 | Still requires a human to correctly identify the false-positive pattern in the first place. |
| 15 | Does this support multi-tenant enterprises? | Not in this build — two seeded roles are sufficient to prove server-side RLS enforcement without the testing-surface risk of a full tenant model. | Kill list, Section 3.3 | A real multi-tenant deployment would need a materially larger RLS and Auth design. |
| 16 | What would you build next round? | Live Sentinel push via a scheduled export job, licensed enterprise GeoIP enrichment, and a pilot against a real (anonymized) enterprise log sample. | Appendix A | These are explicitly roadmap items, not claimed as already built. |
| 17 | Why should Microsoft specifically care about this? | It directly mirrors the attack shape Microsoft's own MSRC documented in Midnight Blizzard, and it's built to sit alongside Sentinel rather than compete with it. | Section 5.1, F25 | We do not have a formal partnership or validation from Microsoft's security team — this is our own analysis of public MSRC guidance. |
| 18 | Convince me in one sentence. | "Every alert needs evidence. Every incident needs independent agreement." | The thesis, Section 1 | — |

---

# SECTION 14 — RISK REGISTER & CONTINGENCY PLAYBOOKS

| # | Risk | Likelihood | Impact | Mitigation | Contingency |
| :---: | :--- | :---: | :---: | :--- | :--- |
| 1 | Supabase cold-start latency on stage | Medium | Medium | Local `supabase start` instance used for the live demo, never the cloud project | Pre-warm the local instance 10 minutes before going on stage |
| 2 | Over-use of 21st.dev components slows the cockpit | Low | Medium | Animation performance budget in Section 8.5 (one hero animation per screen) | Strip non-essential motion first if frame drops appear in rehearsal |
| 3 | Playwright e2e flake on presentation hardware | Medium | Low | Pinned Playwright version, `retry: 1` in CI config | Fall back to a manual click-through if e2e isn't needed live on stage |
| 4 | A judge demands production-scale validation numbers | High (expect this) | Low | Section 13's Q&A #6 and #13 answer this directly and honestly | Point to the limitations panel — it's designed for exactly this question |
| 5 | The v1 ingest bug class recurs | Low | High | `commit_detection_batch` as the sole write path (Section 9.3), proven by fault injection | If any new write path is proposed under time pressure, it is rejected — no exceptions, per Section 11.2 |
| 6 | Time runs short before the deadline | Medium | Medium | Kill list (Section 3.3) is pre-agreed; Phase 6's trust extras (F14, F25) are the first and only things cut | The P0 spine (Phases 1–5) already produces a complete demoable story on its own |
| 7 | Venue Wi-Fi fails entirely | Medium | High | Full offline mode via local `supabase start`; demo has zero external network dependency by design | Rehearsed at least once with Wi-Fi physically disabled before the actual event |
| 8 | Presenting laptop fails | Low | High | Repository synced to cloud storage; a screen-recorded backup run of the full 3-minute demo exists as a last resort | Switch to backup laptop, clone fresh, or play the recorded backup if no backup hardware is available |

---

# SECTION 15 — APPENDICES

## Appendix A — The P0 Spine Table

| Feature | One-Line Purpose | Primary Module(s) | Demo-Visible |
| :---: | :--- | :--- | :---: |
| F1 | Ingest & rejection bucket | `src/ingest/` | Yes |
| F2 | Canonical event normalizer | `src/normalize/` | Yes |
| F4 | Deterministic generator | `src/generator/` | Yes |
| F5 | Brute-force rule | `src/detect/bruteForce.ts` | Yes |
| F6 | Single-source spray rule | `src/detect/spray.ts` | Yes |
| F7 | Campaign graph (Union-Find) | `src/detect/campaignGraph.ts` | Yes — Flagship |
| F10 | Post-spray pivot | `src/detect/pivot.ts` | Yes — Climax |
| F13 | Quorum severity engine | `src/detect/quorum.ts` | Yes |
| F15/F16 | Cockpit + evidence timeline | `app/incidents/` | Yes |
| F21 | Audit ledger | `supabase/migrations/audit_ledger.sql` | Yes |
| F22 | Quality gates dashboard | `app/quality/` | Yes |
| F14 (T) | Suppression/tuning | `app/admin/tuning/` | Yes, if time permits |
| F25 (T) | Sentinel/STIX export | `src/export/` | Roadmap-documented at minimum |

**Roadmap items** (not built, explicitly deferred): credential-stuffing detector (A5), impossible-travel engine (A6), insider off-hours detector (A8), live Sentinel push, licensed enterprise GeoIP enrichment, multi-tenant RBAC.

## Appendix B — Source Register

| Claim | Publisher | Source | Date |
| :--- | :--- | :--- | :---: |
| Stolen-credential initial access (22% of breaches); edge-device exploitation trend (8× YoY) | Verizon | 2025 Data Breach Investigations Report (DBIR), Executive Summary, pp. 5–8 | May 2025 |
| Global VPN password-spray campaigns targeting Cisco/Fortinet/SonicWall via Tor/residential proxies | Cisco Talos | Threat Advisory: Large-scale brute-force activity targeting VPNs | April 16, 2024 |
| Midnight Blizzard low-and-slow spray on non-MFA tenant (Microsoft corporate email) | Microsoft MSRC | Guidance for responders on nation-state attack | January 25, 2024 |
| 46% of triaged alerts are false positives; 42% never investigated | Microsoft & Omdia | State of the SOC | 2025 |
| SOC average 2,992 alerts/day; 63% left unaddressed | Vectra AI | State of Threat Detection | 2026 |
| Technique classifications | MITRE Corporation | ATT&CK Matrix for Enterprise | T1110.001 / T1110.003 / T1110.004 / T1078 |
| Log integrity principles | NIST | SP 800-92 | 2006 |
| Forensic chain-of-custody standard (boundary reference, not claimed) | NIST | SP 800-86 | 2006 |

## Appendix C — Claims & Assumptions Register

| Claim | Classification | Evidence Required | Current Support |
| :--- | :---: | :--- | :--- |
| Quorum detects distributed sprays threshold rules miss | DESIGN DECISION | Side-by-side run, same corpus | `test_flagship_campaign_detection` |
| A single detector family cannot alone trigger Critical | DESIGN DECISION | Unit-tested severity ceiling | `test_single_family_critical_prevention` |
| Metrics reflect unbiased, held-out data | DESIGN DECISION | Cryptographically sealed Pack B | `packs` manifest + `test_sealed_corpus_manifest` |
| Ledger verification completes in under 3 seconds at 100k rows | TARGET | Automated benchmark | `test_ledger_verification_latency` |
| A2TP ≤ 3.0 on sealed data | TARGET | Full sealed-corpus evaluation run | Gate-runner output, Section 10.3 |

## Appendix D — Demo-Readiness Checklist

- [ ] Laptop on mains power; sleep mode disabled.
- [ ] Wi-Fi physically switched off; local `supabase start` running and warm.
- [ ] Database reset to a clean seeded snapshot.
- [ ] Pack B manifest hash verified against the stored value.
- [ ] Demo account passwords freshly generated and rotated this morning.
- [ ] Browser at 125% zoom; notifications silenced; high-contrast theme active for the projector.
- [ ] Backup browser tab pre-warmed with identical state loaded.
- [ ] `NEXT_PUBLIC_DEMO_MODE` confirmed set locally, confirmed *unset* on the deployed Vercel URL.
- [ ] Tamper-demo button tested end-to-end at least once today.
- [ ] Full 3-minute script rehearsed out loud, standing, at least the number of times the team has time for.
- [ ] Every team member can state, from memory, which build phase (Section 11.3) is currently green.
- [ ] Screen-recorded backup of the full demo exists on a second device.

## Appendix E — Traceability Matrix (Feature → Test → Demo Beat)

| Feature | Key Test | UI Surface | Demo Beat |
| :---: | :--- | :--- | :---: |
| F1 | `test_ingest_memory_boundary` | Ingest job status | Pre-demo setup |
| F2 | `test_utc_normalization` | Event schema, invisible to judge | Pre-demo setup |
| F4 | `test_generator_determinism` | Provenance strip | 2:00 |
| F5 | `test_sliding_window_boundary` | Contrast view, naive column | 0:20 |
| F6 | `test_corporate_nat_discrimination` | Contrast view, loosened column | 0:20 |
| F7 | `test_flagship_campaign_detection` | Incident graph evidence | 0:20 – 0:50 |
| F10 | `test_pivot_strict_temporal_ordering` | Incident, PIVOT badge | 1:30 |
| F13 | `test_single_family_critical_prevention` | Printed severity equation | 0:50 – 1:30 |
| F15/F16 | `test_baseline_comparison_live_compute` | Queue + incident detail | 0:00 – 1:30 |
| F21 | `test_demo_tamper_detection`, `test_tamper_localization` | Audit ledger, tamper button | 1:30 – 2:00 |
| F22 | `test_limitations_panel_present` | Quality dashboard | 2:00 – 2:30 |
| F14 | `test_tuning_workbench_reeval_under_60s` | Admin tuning page | Optional beat, if time allows |
| F25 | `test_sentinel_schema_export` | Export download popover | Optional beat, if asked in Q&A |

---

## Document Self-Audit

Eleven inconsistency classes a PRD this size is most likely to contain, checked against this document:

1. **Conflicting numbers for the same fact across sections** — the flagship scenario (1,180 accounts / 312 IPs / ~1,888 events) and the contrast numbers (0 / 97 / 1) are used identically in Sections 3, 5, 7, 10, and 12. Clean.
2. **A named test in an acceptance criterion that never appears elsewhere** — every acceptance-criterion test in Section 7 also appears in Appendix E's traceability matrix or the security suite in Section 9.5. Clean.
3. **A feature marked P0 in one place and P1/cut elsewhere** — cross-checked Section 3.2's spine list against every feature header in Section 7. Clean.
4. **A stack claim contradicting the architecture diagram** — Section 4.3's diagram, Section 9's SQL, and Section 7's TypeScript signatures all agree on Next.js + Supabase + pure TS. Clean.
5. **A security claim overstated as absolute** — Section 9.4 explicitly avoids "unhackable" language and states residual risk for every threat row. Clean.
6. **A metric target that contradicts the v1-achieved value it should meet or beat** — Section 10.3's table shows every target as equal to or looser than the prior measured value, never stricter than what was already measured. Clean.
7. **A kill-list item silently reappearing as a built feature later** — credential stuffing, entity deep-dive pages, and LLM narratives are named as cut in Section 3.3 and never re-appear as acceptance criteria in Section 7. Clean.
8. **The anti-auto-lockout boundary stated once but contradicted by an action description** — F19's scope boundary and Section 6.4's non-goal both state remediation is staged, never auto-executed; no feature description elsewhere describes an automatic action. Clean.
9. **A day-numbered commitment reintroduced despite Section 0's "phases not days" framing** — Section 11.4's schedule table is explicitly labeled a planning aid, not a gate; all real gates in Section 11.3 are test-based. Clean.
10. **An appendix referencing a test or feature ID that doesn't exist in the main body** — Appendix A, B, C, and E were built directly from Section 7's feature list and named tests. Clean.
11. **Demo-script narration contradicting the printed severity equation** — Section 12's narration was rewritten to read the actual on-screen equation (Base 100, F10_pivot, × 1.00, 2 families GRAPH + PIVOT, + 15 auth success, PIVOT floor 80, clipped 100) rather than inventing a different scenario shape, with an explicit rehearsal rule to re-sync narration if a regenerated corpus shifts the numbers. Clean.

---

**End of Product Requirements Document v4 — Project Quorum.**
*Redmond Labs · Microsoft Innovate 2026.*
