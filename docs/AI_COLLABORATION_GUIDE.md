# Quorum — Multi-Model AI Collaboration, Token Preservation & Delegation Guide
**Microsoft Innovate 2026 · Redmond Labs**

---

## 1. Multi-Model Delegation Matrix

To achieve maximum engineering velocity while conserving primary model tokens, tasks are divided among specialized AI systems:

| External AI / Engine | Primary Specialization | Delegation Protocol | Token Preservation Impact |
|---|---|---|---|
| **Claude 3.5 Sonnet** | End-to-end framework planning, hackathon pitch defense, consensus arithmetic proofs. | Send with `docs/GRAPHIFY_CONTEXT.md` header. | Saves 80% reasoning tokens by framing pure math contracts. |
| **Freebuff** | Rapid log parsing, regex normalizers, synthetic packet generator scripts. | Delegate parsing rules using `src/types/auth-event.ts`. | Consumes 0 primary tokens for boilerplate syslog parsing. |
| **Open Code** | Unit test expansion, test matrix generation, edge-case fuzzing. | Send test signatures and ask for parameterized test tables. | Rapid test creation with zero primary context bloat. |
| **Manus.im** | High-fidelity UI mockups, visual layout ideas, Spline 3D scenes, design variations. | Send component requirements from `docs/DESIGN_DOC.md`. | Offloads visual and CSS design iteration. |
| **Hermes / Ollama** | Local offline inference (`http://localhost:11434`), incident summaries, triage suggestions. | Run via `OLLAMA_BASE_URL` with Hermes 3 / Qwen 2.5 Coder. | 100% token-free, infinite local capacity. |
| **FreeLLMAPI** | Bulk batch generation, testing, triage simulation via free endpoints. | Configured in `src/lib/ai/router.ts`. | Preserves commercial API quotas. |
| **Gemini Web2API** | 1B token scale batch analysis, massive synthetic log stress testing. | Run via automated batch scripts using web-proxy routes. | Handles gigabyte-scale telemetry validation. |
| **CodeRabbit** | Automated GitHub PR review, AST linting, credential leak prevention. | Automated via `.coderabbit.yaml`. | Catches security flaws before commits reach `main`. |
| **Graphify** | Persistent structural knowledge graph of codebase. | Maintained in `docs/GRAPHIFY_CONTEXT.md`. | Keeps whole-repo context under 2,000 tokens. |

---

## 2. The 4 Essential Vibe Coding Plugins Reference

Quorum's developer environment incorporates and respects patterns from the following 4 flagship repositories:

1. **Ponytail:** [https://github.com/DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)  
   *Utility:* Lightweight agentic workflow runner and task queue orchestrator.
2. **OmniRoute:** [https://github.com/diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute)  
   *Utility:* Dynamic multi-model routing and circuit breaker fallback layer (mirrored in `src/lib/ai/router.ts`).
3. **Graphify:** [https://github.com/Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify)  
   *Utility:* Persistent structural knowledge graph generation for modular codebase context (`docs/GRAPHIFY_CONTEXT.md`).
4. **Agent Skills:** [https://github.com/addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)  
   *Utility:* Standardized operational directives, verification loops, and agent checklists (`.agents/rules/`).

---

## 3. Delegation Playbooks with Graphify Context

Whenever you ask the human user to delegate work to an external AI (or when delegating via API), use the following pre-formatted prompt templates:

### 3.1 Delegating to Freebuff (Log Parsing & Regex)

```text
[CONTEXT: QUORUM v4.0.0 - Microsoft Innovate 2026]
Project: Enterprise VPN Authentication Campaign-Correlation Plane
Target Schema: AuthEvent from 'src/types/auth-event.ts'
- eventHash: string (SHA-256)
- timestamp: ISO 8601 UTC
- srcIp: IPv4 unwrapped (RFC1918 classified)
- userName: string (stripped of DOMAIN\ and @upn)
- eventOutcome: 'SUCCESS' | 'FAILURE_BAD_CREDENTIALS' | 'FAILURE_LOCKED' | 'FAILURE_MFA' | 'FAILURE_EXPIRED' | 'UNKNOWN'
- sourceSystem: string

[TASK FOR FREEBUFF]:
Write a high-performance TypeScript parser function for Palo Alto GlobalProtect / Fortinet VPN syslog strings.
Input: raw syslog string
Output: { accepted: Partial<AuthEvent>[], rejected: string[] }
Must handle CEF, JSON, and standard BSD syslog formats with zero external npm dependencies.
```

### 3.2 Delegating to Open Code (Unit Test Suite Expansion)

```text
[CONTEXT: QUORUM v4.0.0 - Microsoft Innovate 2026]
Detection Engine: Pure TypeScript, zero external dependencies, deterministic math.
Target Module: 'src/detect/campaign-graph.ts' (Union-Find Bipartite Graph Clustering)

[TASK FOR OPEN CODE]:
Write 8 Vitest unit test cases covering edge cases for bipartite graph clustering:
1. Disjoint graph clusters (two separate spray campaigns that do not overlap).
2. Single attacker IP hitting multiple accounts without threshold trigger.
3. Multi-IP spray hitting disjoint accounts with 1 bridge account.
4. Large cluster with 50 proxy IPs and 100 accounts (performance benchmark < 50ms).
5. Graph with all benign successes (zero attack signals).
Format strictly using Node 20 test runner syntax matching 'tests/detection.test.ts'.
```

### 3.3 Delegating to Manus.im (High-Fidelity UI Layout & 3D Elements)

```text
[CONTEXT: QUORUM v4.0.0 - Microsoft Innovate 2026]
Design Philosophy: Dark Intelligence Terminal (Microsoft SOC aesthetic)
Tokens:
- Canvas: #000000 (true black)
- Technical Surface: #080C14 (slate)
- Border: rgba(255,255,255,0.08) (1px crisp)
- Typography: Space Grotesk (headings), JetBrains Mono (machine data)
- Color: Semantic only (#DC2626 Critical, #D97706 Warning, #059669 Resolved)
- Prohibited: Purple/black clichés, harsh rainbow gradients, bouncy animations, emojis in data.

[TASK FOR MANUS.IM]:
Design a high-fidelity interactive Bipartite Attack Graph visualization:
- Left Column: Residential Proxy IPs (nodes)
- Right Column: Targeted Enterprise Accounts (nodes)
- Connecting Edges: Failed Auth Attempts (thin red line) and Post-Spray Success (solid glowing crimson)
- Provide responsive SVG/Canvas layout with subtle hover states and node inspection popover.
```

### 3.4 Delegating to Claude (Hackathon Winning Strategy & Pitch Defense)

```text
[CONTEXT: QUORUM v4.0.0 - Microsoft Innovate 2026]
Problem: Midnight Blizzard (NOBELIUM) distributed password spray bypasses traditional volume SIEM rules.
Quorum Solution: Bipartite Graph Union-Find + Multi-Family Consensus Arithmetic (Base * Multiplier + Boost).
Ground Truth Contrast:
- Naive Volume Rule: 0 alerts (missed)
- Loosened Threshold: 97 alerts (SOC alert fatigue)
- Quorum Engine: 1 Correlated Critical Incident

[TASK FOR CLAUDE]:
Review our architecture defense against Microsoft security architect judges:
1. "Why can't I just write a KQL query in Microsoft Sentinel for this?"
2. "How do you handle graph component explosion when an entire corporate subnet logs in simultaneously?"
3. "How does your SHA-256 hash-chained audit ledger protect against database insider tampering?"
Provide concise, authoritative, mathematically grounded answers.
```

---

## 4. Serena & Context7 State Engineering Protocol

When working across multi-turn sessions with complex state:

1. **Context7 Rolling Window:**
   - Keep active conversational context focused on the **Single Active Task**.
   - Store historical decisions and rationale in `docs/` rather than re-explaining them in conversational memory.
2. **Serena State Synchronization:**
   - At the beginning of each milestone: Read `docs/GRAPHIFY_CONTEXT.md` and check `git status`.
   - At the end of each milestone: Run `npm.cmd run reticle` and verify 0 errors.

---

## 5. Token Preservation Best Practices

1. **Never Dump Full Source Code:** Reference specific line numbers and use targeted `replace_file_content` chunks.
2. **Deterministic Inputs:** Test locally with `npm.cmd test` before asking for external model confirmation.
3. **Local First:** Use the in-memory fallback or local Ollama instance (`http://localhost:11434`) for text completion during development.
