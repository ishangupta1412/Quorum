# Quorum
**A Campaign-Correlation Detection Layer for VPN Authentication Telemetry**  
*Microsoft Innovate 2026 Â· Redmond Labs*

---

## ðŸŽ¯ The 45-Second Demo Contrast

Microsoft had the logs when Midnight Blizzard breached their corporate email. The attack was a low-and-slow password spray engineered to look exactly like normal login noise across residential proxy IPs.

When evaluated against the exact same 3-day telemetry corpus:
- **Naive Volume SIEM Rule:** **0 Alerts** *(Attack carefully stayed beneath 5 attempts/IP)*
- **Loosened Threshold Rule:** **97 Alerts** *(Technically caught, but creates an alert flood that exhausts SOC analysts)*
- **Quorum Consensus Engine:** **1 Correlated Critical Incident** *(Unified bipartite graph component with confirmed pivot)*

---

## ðŸ›ï¸ Architecture Highlights

- **Detection Plane:** Pure, deterministic TypeScript with zero ML/black-box dependencies.
- **Bipartite Campaign Graph (Union-Find):** Correlates residential proxy IPs and sprayed user accounts with path compression and rank optimization.
- **Post-Spray Pivot Detector:** Identifies the exact instant a sprayed account authenticates successfully (`SUCCESS`), elevating confidence to 100%.
- **Deterministic Consensus Engine:** Multi-family mathematical consensus that outputs the human-readable severity equation:
  ```text
  Base 100 (F10_pivot) Ã— 1.00 (2 families: GRAPH, PIVOT) + 15 (auth success) â†’ floor 80 â†’ clipped 100 [CRITICAL]
  ```
- **Cryptographic Audit Ledger:** SHA-256 hash-chained ledger (`audit_ledger`) with real-time tamper-evident verification.
- **Enterprise Interoperability:** Export direct to Microsoft Sentinel incident JSON or STIX 2.1 bundles.

---

## ðŸš€ Quickstart

### Prerequisites
- Node.js >= 20 LTS
- npm or pnpm

### Installation & Reticle Verification
```bash
# Install dependencies
npm install

# Run strict type checking (zero any policy)
npm run typecheck

# Run detection plane test suite
npm test

# Run complete Reticle verification loop (typecheck + tests)
npm run reticle
```

### Offline Demo Mode
Quorum is designed with a 100% offline, air-gapped demo mode for stage presentations:
```env
NEXT_PUBLIC_DEMO_OFFLINE=true
NEXT_PUBLIC_DEMO_CORPUS_PACK=B
```

---

## ðŸ“ Repository Structure

```text
â”œâ”€â”€ docs/                     # Comprehensive architecture & design docs
â”‚   â”œâ”€â”€ HACKATHON_FRAMEWORK.md# 45s stage script, judge FAQ defense, 5-minute pitch
â”‚   â”œâ”€â”€ GRAPHIFY_CONTEXT.md   # Structural knowledge graph for multi-AI handoff
â”‚   â”œâ”€â”€ AI_COLLABORATION_GUIDE.md # Freebuff, OpenCode, Manus, Claude, Ollama delegation
â”‚   â”œâ”€â”€ PRE_LAUNCH_CHECKLIST.md # 15 technical guardrails + 20 "Don't get sued" checks
â”‚   â”œâ”€â”€ ANTI_VIBECODE_AUDIT.md# 30 anti-vibecode rules + Floto roast defense
â”‚   â”œâ”€â”€ PRD_REVIEW.md         # PRD v4 evaluation & improvement plan
â”‚   â”œâ”€â”€ DESIGN_DOC.md         # The Core UI/UX (21st.dev, OriginKit, Skipper UI)
â”‚   â”œâ”€â”€ TECH_STACK.md         # Tech stack research + Single-Task Roadmap
â”‚   â”œâ”€â”€ SECURITY.md           # Zero-trust model & cryptographic audit chain
â”‚   â”œâ”€â”€ DATABASE.md           # PostgreSQL schema & transactional RPCs
â”‚   â”œâ”€â”€ CODE_STYLE.md         # Strict TypeScript guidelines
â”‚   â””â”€â”€ API_GUIDE.md          # Next.js Route Handlers & Zod schemas
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ types/                # Canonical TypeScript definitions (AuthEvent, etc.)
â”‚   â”œâ”€â”€ normalize/            # F1 Ingest & F2 Canonical Normalizer
â”‚   â”œâ”€â”€ detect/               # Pure TypeScript Detection Plane (F5, F6, F7, F10, F13)
â”‚   â”œâ”€â”€ data/                 # F4 Deterministic Synthetic Generator (Pack A & B)
â”‚   â””â”€â”€ lib/
â”‚       â”œâ”€â”€ ai/               # Multi-model AI router with circuit breaker & fallback
â”‚       â”œâ”€â”€ crypto/           # F21 Cryptographic SHA-256 hash-chain ledger
â”‚       â”œâ”€â”€ export/           # F25 Sentinel JSON & STIX 2.1 exporters
â”‚       â””â”€â”€ rate-limiter.ts   # Server-side token-bucket rate limiter
â””â”€â”€ tests/                    # Vitest unit test suite (100% green)
```

---

## ðŸ›¡ï¸ License & Team
Redmond Labs Â· Microsoft Innovate 2026.

