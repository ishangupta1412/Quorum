# Quorum â€” Hackathon-Winning Master Framework
**Microsoft Innovate 2026 Â· Redmond Labs**

---

## 1. The Executive Problem Statement: The Midnight Blizzard Paradox

In January 2024, nation-state actor **Midnight Blizzard (NOBELIUM)** compromised Microsoft corporate systems using a distributed password spray against legacy test tenants.

### Why Traditional SIEMs (and KQL Rules) Fail
Traditional Security Information and Event Management (SIEM) systems rely on row-based or IP-bucketed threshold rules:
1. **The Naive Threshold Trap:** Rule fires if `FailureCount >= 5 per IPAddress`. Attackers use residential proxy botnets, limiting each proxy IP to 2â€“3 attempts across hundreds of accounts. $\to$ **Zero alerts generated. Attack goes completely undetected.**
2. **The Loosened Threshold Disaster:** If the SOC lowers the threshold to `FailureCount >= 2`, normal organic user errors (typos, expired password syncs, VPN reconnection loops) trigger hundreds of alerts. $\to$ **97 false positive alerts per day. Analysts suffer severe alert fatigue and ignore the queue.**
3. **The KQL Architectural Limitation:** Kusto Query Language (KQL) in Microsoft Sentinel evaluates tabular time-series rows. It cannot perform real-time bipartite graph Union-Find clustering across dynamic IP-to-Account relationship topologies or compute non-parametric multi-family consensus arithmetic.

---

## 2. The 45-Second Stage Winning Demo Script

When presenting to Microsoft security judges, execute this exact 45-second sequence:

| Timestamp | Visual Action on Screen | Voiceover Script (Word-for-Word) |
|---|---|---|
| **0:00 â€“ 0:10** | Show The Core with Sealed Pack B (1,200 events). Point to Lens 1. | *"Every enterprise VPN faces this: Midnight Blizzard distributed password sprays across hundreds of residential proxy IPs. Here is standard SIEM Lens 1: 0 alerts. The attack bypassed the 5-failure threshold."* |
| **0:10 â€“ 0:20** | Click Lens 2 (Loosened Threshold). Show 97 alerts in amber. | *"If a SOC loosens the threshold to catch low-and-slow sprays, they get Lens 2: 97 alerts. Instant alert fatigue. True attacks hide inside the noise."* |
| **0:20 â€“ 0:32** | Click **Run Detection**. The Quorum ticker rolls to **1 Correlated Critical Incident** in crimson. | *"Here is Quorum. In 45 milliseconds, our bipartite graph Union-Find clusterer correlates 20 residential proxies hitting 45 corporate accounts into exactly ONE high-confidence Critical Incident."* |
| **0:32 â€“ 0:40** | Highlight the inspectable formula block. | *"Look at the severity score: 100/100. It's not a black-box LLM hallucination. It's deterministic arithmetic: Base 100 times multi-family multiplier plus confirmed account compromise boost."* |
| **0:40 â€“ 0:45** | Click **Simulate Database Tamper**. The green badge immediately flips to red: `TAMPER DETECTED at index 0`. | *"And because SOC integrity matters, our SHA-256 cryptographic audit ledger instantly proves if an attacker tried to modify evidence post-compromise. Zero trust, zero black-box."* |

---

## 3. The 11 P0 Spine Architecture

Quorum was engineered with strict discipline around 11 P0 features:

```
[Phase 1: Ingest & Normalization]
â”œâ”€â”€ F1: Multi-format Ingest Engine (JSONL, CSV, Syslog with isolated reject bucket)
â”œâ”€â”€ F2: Canonical AuthEvent Normalizer (UTC normalization, IPv6 unwrapping, RFC1918 scope)
â””â”€â”€ F4: Deterministic Synthetic Corpus Generator (Pack A benchmark & Pack B attack mix)

[Phase 2: Pure TypeScript Detection Plane - Zero Runtime Dependencies]
â”œâ”€â”€ F5: Sliding-Window Brute Force Detector (Baseline volume comparator)
â”œâ”€â”€ F6: Single-Source Password Spray Detector (Loosened threshold comparator)
â”œâ”€â”€ F7: Bipartite Campaign Graph Clusterer (Union-Find connected components) [FLAGSHIP]
â”œâ”€â”€ F10: Post-Spray Pivot Detector (Correlation of spray failure cluster with subsequent success)
â””â”€â”€ F13: Quorum Multi-Family Consensus Severity Engine (Deterministic mathematical score)

[Phase 3: The Core & Enterprise Trust]
â”œâ”€â”€ F15: Incident The Core & Realtime Triage Queue
â”œâ”€â”€ F21: Cryptographic Hash-Chained Audit Ledger (SHA-256 tamper-evident integrity)
â””â”€â”€ F25: Interoperability Export Engine (Microsoft Sentinel JSON & OASIS STIX 2.1 Bundles)
```

---

## 4. Judges' FAQ & Ironclad Defense

### Q1: "Why pure TypeScript? Why not PyTorch or a graph neural network?"
> **Defense:** Security architects in enterprise SOCs reject non-deterministic black boxes. A GNN cannot explain to a federal auditor or CISO why an alert fired. Quorum produces a byte-reproducible, inspectable arithmetic formula (`Base * Multiplier + Boost`) in pure TypeScript that runs in-process with sub-50ms latency and zero compiled dependencies.

### Q2: "Can't Microsoft Sentinel do this with KQL?"
> **Defense:** KQL is exceptional at row-level filtering and time-window aggregations (`summarize count() by IPAddress`). However, finding arbitrary bipartite connected components (where Proxy A attacks Users 1 and 2, Proxy B attacks Users 2 and 3, transitive linkage creates a campaign cluster) requires recursive graph traversal. Doing this in KQL causes exponential query memory bloat and timeouts over large telemetry streams. Quorum acts as the pre-correlation graph plane that feeds correlated incidents back into Sentinel via STIX 2.1 and Sentinel JSON.

### Q3: "What happens if stage Wi-Fi goes down during the presentation?"
> **Defense:** Quorum has zero external live runtime dependencies. The detection plane is self-contained pure TypeScript. The synthetic corpus is sealed in code. The AI router features an instant local deterministic fallback. The demo is 100% air-gapped and stage-proof.

---

## 5. Five-Minute Pitch Deck Outline

1. **Slide 1: Title & The Midnight Blizzard Threat** (The breach that shook enterprise security).
2. **Slide 2: The Two Failures of Modern SIEMs** (Volume rule misses; statistical threshold floods).
3. **Slide 3: The Quorum Solution: Bipartite Graph Union-Find** (Connecting the distributed proxy dots).
4. **Slide 4: Live 45-Second Demo** (0 vs 97 vs 1 + Tamper-evident ledger).
5. **Slide 5: Enterprise Alignment** (Sentinel JSON, STIX 2.1 CTI bundles, zero raw credentials, compliance-ready).

