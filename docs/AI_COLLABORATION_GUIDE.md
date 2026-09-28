# Quorum — Multi-Model AI Collaboration & Token Preservation Architecture
**Microsoft Innovate 2026 · Redmond Labs**

---

## 1. Multi-Model Task Routing Matrix

To maximize token efficiency, prevent context overflow, and utilize specialized AI capabilities across Freebuff, OpenCode, Manus.im, Claude, and Gemini:

| Task Type | Primary Model / Tool | Rationale & Handoff Directive |
|---|---|---|
| **Core Detection Math & Algorithms** | Claude 3.5 Sonnet / Gemini Flash Thinking | High-reasoning evaluation of Union-Find graph dynamics and consensus arithmetic. |
| **Boilerplate Parsers & Format Handlers** | OpenCode / Freebuff | Fast token-efficient generation of standard syslog, regex, and CSV schemas. |
| **Comprehensive UI Mockups & 3D Assets** | Manus.im / Spline | Autonomous visual component generation, Spline 3D viewport setups. |
| **Code Review & Pre-Commit Linting** | CodeRabbit | Automated AST-level diff analysis for security bugs and secret leaks. |
| **Context Graph & Cross-Reference** | Graphify | Persistent structural knowledge graph keeping repository context under 5k tokens. |

---

## 2. Graphify Persistent Context Blueprint

All AI assistants working on Quorum must ground their work in the following persistent knowledge nodes:

```
[Ingest Plane] ───> [Canonical Normalizer] ───> [Synthetic Corpus (Pack A/B)]
                            │
                            ▼
                  [Pure Detection Plane]
                  ├── F5 Brute Force (Volume)
                  ├── F6 Single Spray (Statistical)
                  ├── F7 Campaign Graph (Bipartite Union-Find) [FLAGSHIP]
                  ├── F10 Pivot Detector (Breach Confirmation)
                  └── F13 Consensus Severity Engine (Arithmetic Core)
                            │
                            ▼
                  [Evidence & Governance]
                  ├── F21 Hash-Chained Audit Ledger (SHA-256)
                  └── F25 Sentinel JSON & STIX 2.1 Exports
```

---

## 3. The 1B Token Economy Directives (Gemini_web2api / OpenCode)

1. **Deterministic File Boundaries:** Never re-read or dump entire 1,000-line files when editing small chunks. Use targeted patch replacements.
2. **Schema-First Prompting:** Always share `src/types/auth-event.ts` rather than explaining data formats in natural language.
3. **Zero Test Data Leaks:** Never paste live production logs or real user identifiers into third-party web LLM APIs.
