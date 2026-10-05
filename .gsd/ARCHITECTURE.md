# Architecture

> Auto-generated for Quorum on 2026-09-30

## Overview

Quorum is a campaign-correlation detection layer for enterprise VPN authentication telemetry. It intercepts raw auth logs, normalizes them, clusters distributed password spray infrastructure via bipartite graph algorithms, calculates deterministic multi-family consensus scores, and immutably records all decisions to a SHA-256 hash-chained audit ledger.

```
┌───────────────────────────────────────────────────────────────┐
│                 VPN Authentication Telemetry                  │
│               (Syslog / CEF / Sentinel Stream)                │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│              F2: Canonical AuthEvent Normalizer               │
│        (Strict 6-value Enum, UTC, IPv4/IPv6 unwrapping)       │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│           Deterministic Detection Plane (Pure TS)             │
│   ┌────────────────────┐            ┌─────────────────────┐   │
│   │  F5: Brute Force   │            │ F6: Single Spray    │   │
│   └────────────────────┘            └─────────────────────┘   │
│   ┌───────────────────────────────────────────────────────┐   │
│   │   F7: Bipartite Campaign Graph (Union-Find)           │   │
│   └───────────────────────────────────────────────────────┘   │
│   ┌───────────────────────────────────────────────────────┐   │
│   │   F10: Post-Spray Pivot Detector (Success instant)    │   │
│   └───────────────────────────────────────────────────────┘   │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│              F13: Multi-Family Consensus Engine               │
│        Base 100 × 1.00 (GRAPH+PIVOT) + 15 -> 100 [CRITICAL]   │
└───────────────────────┬───────────────┬───────────────────────┘
                        │               │
                        ▼               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│  F21: SHA-256 Audit Ledger   │ │ F25: Threat Intel Exporters  │
│ (Tamper-evident Hash Chain)  │ │ (Microsoft Sentinel / STIX)  │
└──────────────────────────────┘ └──────────────────────────────┘
```

## Components

### 1. Ingestion & Normalization (`src/normalize/`)
- **Purpose:** Converts raw vendor payloads (Fortinet, Cisco, Palo Alto, Okta) into canonical `AuthEvent` structures.
- **Security:** Strips credentials, drops raw passwords, and verifies timestamps >= year 2000.

### 2. Detection Plane (`src/detect/`)
- **Purpose:** Executes pure, deterministic graph clustering and anomaly detection.
- **Key Algorithms:**
  - `campaign-graph.ts`: Disjoint Set Union (Union-Find) with path compression and rank optimization for bipartite IP-Account graph.
  - `pivot.ts`: Tracks successful authentication against accounts previously targeted in a spray window.
  - `consensus.ts`: Weighted multi-family consensus formula.

### 3. Trust & Ledger (`src/lib/crypto/`)
- **Purpose:** Implements cryptographic accountability.
- **Mechanism:** Genesis block SHA-256 root chaining every detection outcome. Any post-hoc mutation breaks the chain.

### 4. API & Exporters (`src/app/api/`, `src/lib/export/`)
- **Purpose:** Exposes rate-limited endpoints for log ingest, detection triggers, and SIEM exports (Microsoft Sentinel and STIX 2.1).

---

*Last updated: 2026-09-30*
