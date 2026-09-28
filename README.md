# Quorum
**A Campaign-Correlation Detection Layer for VPN Authentication Telemetry**  
*Microsoft Innovate 2026 · Redmond Labs*

---

## 🎯 The 45-Second Demo Contrast

Microsoft had the logs when Midnight Blizzard breached their corporate email. The attack was a low-and-slow password spray engineered to look exactly like normal login noise across residential proxy IPs.

When evaluated against the exact same 3-day telemetry corpus:
- **Naive Volume SIEM Rule:** **0 Alerts** *(Attack carefully stayed beneath 5 attempts/IP)*
- **Loosened Threshold Rule:** **97 Alerts** *(Technically caught, but creates an alert flood that exhausts SOC analysts)*
- **Quorum Consensus Engine:** **1 Correlated Critical Incident** *(Unified bipartite graph component with confirmed pivot)*

---

## 🏛️ Architecture Highlights

- **Detection Plane:** Pure, deterministic TypeScript with zero ML/black-box dependencies.
- **Bipartite Campaign Graph (Union-Find):** Correlates residential proxy IPs and sprayed user accounts with path compression and rank optimization.
- **Post-Spray Pivot Detector:** Identifies the exact instant a sprayed account authenticates successfully (`SUCCESS`), elevating confidence to 100%.
- **Deterministic Consensus Engine:** Multi-family mathematical consensus that outputs the human-readable severity equation:
  ```text
  Base 100 (F10_pivot) × 1.00 (2 families: GRAPH, PIVOT) + 15 (auth success) → floor 80 → clipped 100 [CRITICAL]
  ```
- **Cryptographic Audit Ledger:** SHA-256 hash-chained ledger (`audit_ledger`) with real-time tamper-evident verification.
- **Enterprise Interoperability:** Export direct to Microsoft Sentinel incident JSON or STIX 2.1 bundles.

---

## 🚀 Quickstart

### Prerequisites
- Node.js >= 20 LTS
- npm or pnpm

### Installation
```bash
# Install dependencies
npm install

# Run strict type checking (zero any policy)
npm run typecheck

# Run detection plane test suite
npm test
```

### Offline Demo Mode
Quorum is designed with a 100% offline, air-gapped demo mode for stage presentations:
```env
NEXT_PUBLIC_DEMO_OFFLINE=true
NEXT_PUBLIC_DEMO_CORPUS_PACK=B
```

---

## 📁 Repository Structure

```text
├── docs/                     # Comprehensive architecture & design docs
│   ├── PRD_REVIEW.md         # PRD v4 evaluation & improvement plan
│   ├── DESIGN_DOC.md         # Cockpit UI/UX & component mapping
│   ├── TECH_STACK.md         # Complete technology decisions
│   ├── SECURITY.md           # Zero-trust model & pre-launch checklist
│   ├── DATABASE.md           # PostgreSQL schema & transactional RPCs
│   ├── CODE_STYLE.md         # Strict TypeScript guidelines
│   └── API_GUIDE.md          # Next.js Route Handlers & schemas
├── src/
│   ├── types/                # Canonical TypeScript definitions (AuthEvent, etc.)
│   ├── normalize/            # F1 Ingest & F2 Canonical Normalizer
│   ├── detect/               # Pure TypeScript Detection Plane (F5, F6, F7, F10, F13)
│   ├── data/                 # F4 Deterministic Synthetic Generator (Pack A & B)
│   └── lib/
│       ├── crypto/           # F21 Cryptographic SHA-256 hash-chain ledger
│       └── export/           # F25 Sentinel JSON & STIX 2.1 exporters
└── tests/                    # Vitest unit test suite (100% green)
```

---

## 🛡️ License & Team
Redmond Labs · Microsoft Innovate 2026.
