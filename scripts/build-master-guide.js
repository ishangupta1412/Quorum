const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

console.log('Generating Quorum Master Guide HTML & PDF for Redmond Labs (Team ID: 405)...');

const screenshotDir = path.resolve('docs/assets/screenshots');
function getBase64Img(filename) {
  const filePath = path.join(screenshotDir, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

const imgHero = getBase64Img('hero-landing.png');
const imgBipartite = getBase64Img('bipartite-graph-dashboard.png');
const imgGlobe = getBase64Img('nexus-3d-globe.png');
const imgSim = getBase64Img('nexus-live-simulation.png');
const imgAnalysis = getBase64Img('analysis-tactical-triage.png');
const imgIp = getBase64Img('forensics-ip-tracker.png');
const imgLedger = getBase64Img('forensics-audit-ledger.png');
const imgCorpus = getBase64Img('telemetry-ingestion-corpus.png');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Quorum — Master Project & Defense Guide | Redmond Labs (Team 405)</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.55;
    font-size: 10.5pt;
    margin: 0;
    padding: 0;
  }

  h1, h2, h3, h4 {
    color: #020617;
    font-weight: 700;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
  }

  h1 { font-size: 20pt; border-bottom: 2px solid #0078d4; padding-bottom: 6px; }
  h2 { font-size: 14pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 1.4em; color: #0078d4; }
  h3 { font-size: 11.5pt; margin-top: 1em; color: #1e293b; }
  h4 { font-size: 10.5pt; margin-top: 0.8em; color: #334155; }

  p { margin: 0.5em 0; }

  code, pre {
    font-family: 'JetBrains Mono', monospace;
  }

  pre {
    background: #090d16;
    color: #f1f5f9;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 8.5pt;
    line-height: 1.4;
    overflow-x: auto;
    border: 1px solid #1e293b;
    page-break-inside: avoid;
  }

  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 9pt;
    border: 1px solid #e2e8f0;
  }

  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border: none;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 7px 10px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background: #f8fafc;
    font-weight: 600;
    color: #0f172a;
  }

  tr:nth-child(even) td {
    background: #fbfcfe;
  }

  .page-break {
    page-break-before: always;
  }

  .cover {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    page-break-after: always;
    padding-top: 40px;
  }

  .badge-container {
    display: flex;
    gap: 8px;
    margin: 12px 0;
  }

  .badge {
    display: inline-block;
    padding: 3px 8px;
    font-size: 8pt;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-emerald { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .badge-red { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
  .badge-purple { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }

  .callout {
    background: #f8fafc;
    border-left: 4px solid #0078d4;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 12px 0;
    font-size: 9.5pt;
  }

  .callout-warning {
    border-left-color: #f59e0b;
    background: #fffbeb;
  }

  .callout-success {
    border-left-color: #10b981;
    background: #f0fdf4;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 10px 0;
    page-break-inside: avoid;
  }

  .img-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    background: #080c14;
    padding: 6px;
    text-align: center;
  }

  .img-card img {
    width: 100%;
    height: auto;
    border-radius: 4px;
    display: block;
  }

  .img-caption {
    font-size: 8pt;
    color: #64748b;
    margin-top: 5px;
    font-weight: 500;
    background: #ffffff;
    padding: 3px;
    border-radius: 3px;
  }

  .qa-block {
    margin-bottom: 14px;
    page-break-inside: avoid;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    background: #ffffff;
  }

  .qa-question {
    font-weight: 700;
    color: #0f172a;
    font-size: 9.5pt;
    margin-bottom: 4px;
    display: flex;
    gap: 6px;
  }

  .qa-num {
    background: #0078d4;
    color: white;
    font-size: 7.5pt;
    padding: 1px 6px;
    border-radius: 10px;
    height: fit-content;
    margin-top: 2px;
  }

  .qa-answer {
    color: #334155;
    font-size: 9pt;
    line-height: 1.45;
  }

  .qa-keypoint {
    margin-top: 4px;
    font-size: 8.5pt;
    color: #047857;
    font-weight: 600;
  }

  .member-box {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 12px;
    background: #f8fafc;
  }

  .member-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin-bottom: 6px;
  }

  .member-name { font-size: 11pt; font-weight: 700; color: #0f172a; }
  .member-id { font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #64748b; }
  .member-role { font-size: 9pt; font-weight: 600; color: #0078d4; }
</style>
</head>
<body>

<!-- ================= COVER PAGE ================= -->
<div class="cover">
  <div style="font-size: 10pt; font-weight: 700; letter-spacing: 2px; color: #0078d4; text-transform: uppercase;">Microsoft Innovate 2026 · Redmond Labs</div>
  <h1 style="font-size: 26pt; margin: 10px 0 6px 0; border: none; padding: 0; color: #0f172a;">QUORUM</h1>
  <div style="font-size: 13pt; font-weight: 600; color: #334155; margin-bottom: 16px;">Enterprise SOC Campaign-Correlation Detection Layer for VPN Authentication Telemetry</div>
  
  <p style="font-size: 10.5pt; color: #475569; max-width: 90%;">
    Comprehensive Technical Evaluation & Viva Defense Handbook for Stage 2 Final Selection (25 Teams / 297 Candidates). This document covers the complete system architecture, mathematical foundations, detection algorithms, forensic guarantees, and specific defense strategies for all team members.
  </p>

  <div style="margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #f8fafc;">
    <table style="margin: 0; border: none;">
      <tr style="background: transparent;"><td style="border: none; width: 140px; font-weight: 600; color: #64748b;">TEAM NAME:</td><td style="border: none; font-weight: 700; color: #0f172a;">Redmond Labs</td></tr>
      <tr style="background: transparent;"><td style="border: none; font-weight: 600; color: #64748b;">TEAM ID:</td><td style="border: none; font-weight: 700; color: #0078d4; font-family: 'JetBrains Mono';">405</td></tr>
      <tr style="background: transparent;"><td style="border: none; font-weight: 600; color: #64748b;">PRODUCTION URL:</td><td style="border: none; font-family: 'JetBrains Mono';"><a href="https://quorum-rust-gamma.vercel.app">https://quorum-rust-gamma.vercel.app</a></td></tr>
      <tr style="background: transparent;"><td style="border: none; font-weight: 600; color: #64748b;">GITHUB REPOSITORY:</td><td style="border: none; font-family: 'JetBrains Mono';"><a href="https://github.com/ishangupta1412/Quorum">https://github.com/ishangupta1412/Quorum</a></td></tr>
      <tr style="background: transparent;"><td style="border: none; font-weight: 600; color: #64748b;">EVALUATION TARGET:</td><td style="border: none; font-weight: 700; color: #15803d;">Top 25 Final Selection (25 / 297 Teams)</td></tr>
    </table>
  </div>

  <h3 style="margin-top: 14px; margin-bottom: 8px;">TEAM ROSTER & SPECIALIZATION DIRECTIVES</h3>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
    <div class="member-box" style="margin: 0;">
      <div class="member-name">Ishan Gupta</div>
      <div class="member-id">ID: S26CSEU1496 · Team Leader</div>
      <div class="member-role">System Architect & Threat Modeling</div>
      <div style="font-size: 8pt; color: #475569; margin-top: 4px;">Overall Architecture, F13 Consensus Arithmetic, Threat Landscape (Midnight Blizzard), Executive Pitch.</div>
    </div>
    <div class="member-box" style="margin: 0;">
      <div class="member-name">Aditya Pandey</div>
      <div class="member-id">ID: S26CSEU2576</div>
      <div class="member-role">Detection Engine & Graph Algorithms</div>
      <div style="font-size: 8pt; color: #475569; margin-top: 4px;">Bipartite Graph Modeling, Union-Find Clustering, F7 Spray & F10 Pivot Detectors, O(α(N)) Disjoint Set.</div>
    </div>
    <div class="member-box" style="margin: 0;">
      <div class="member-name">Devansh Tiwari</div>
      <div class="member-id">ID: S26CSEU2556</div>
      <div class="member-role">Forensics Ledger & Telemetry Pipeline</div>
      <div style="font-size: 8pt; color: #475569; margin-top: 4px;">F2 Normalizer, F21 SHA-256 Hash Chained Ledger, Cryptographic Tamper Evident Verification, Secret Hygiene.</div>
    </div>
    <div class="member-box" style="margin: 0;">
      <div class="member-name">Satyam Kalra</div>
      <div class="member-id">ID: S26CSEU2587</div>
      <div class="member-role">Frontend Architecture & SOC Integration</div>
      <div style="font-size: 8pt; color: #475569; margin-top: 4px;">Next.js 14 Web Architecture, D3.js Force Simulation, Microsoft Sentinel ARM Webhook & STIX 2.1 Bundles.</div>
    </div>
  </div>

  <div style="margin-top: 30px; font-size: 8.5pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
    Built strictly to Anti-Vibecoding Standards · Redmond Labs 2026 · Confidential Master Evaluation Blueprint
  </div>
</div>

<!-- ================= PAGE 2: PROBLEM & THE 45-SECOND CONTRAST ================= -->
<div class="page-break"></div>
<h2>1. Project Vision & The Threat Vector: Why Quorum?</h2>

<h3>The Problem: How Midnight Blizzard (NOBELIUM) Defeats Modern SIEMs</h3>
<p>
Modern Security Information and Event Management (SIEM) systems rely almost exclusively on <strong>per-entity threshold rules</strong> (e.g., <em>"Alert if an IP produces ≥ 5 failed login attempts in 15 minutes"</em>). Nation-state threat actors, notably <strong>Midnight Blizzard (NOBELIUM / APT29)</strong>, actively exploit this fundamental SIEM design flaw using <strong>distributed, low-and-slow password spraying</strong>:
</p>
<ul>
  <li><strong>Distributed Residential Proxies:</strong> The threat actor routes requests across dozens of clean residential proxy IPs. Each IP targets only 1 to 3 distinct enterprise accounts over hours.</li>
  <li><strong>Threshold Evasion:</strong> Because each IP produces only 1–3 failed attempts, <strong>zero per-IP alerts are generated</strong>. The attack is entirely invisible to traditional threshold rules.</li>
  <li><strong>Credential Compromise (The Pivot):</strong> Once a valid credential password combination is found, the attacker logs in successfully from one of the same proxy IPs and pivots into internal systems.</li>
</ul>

<h3>The 45-Second Demo Contrast: The Flaw in Legacy SIEMs vs Quorum</h3>
<p>
To demonstrate this dilemma to evaluators, Quorum processes a synchronized corpus containing 490 real-world authentication events representing a 10-IP × 47-account distributed spray followed by a compromise pivot:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Detection Engine</th>
      <th style="width: 15%;">Alerts Triggered</th>
      <th style="width: 30%;">Operational Outcome</th>
      <th style="width: 30%;">Root Cause in SOC</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Naive Volume Rule</strong><br/><code>Failures ≥ 5 / IP</code></td>
      <td style="color: #dc2626; font-weight: 700;">0 Alerts</td>
      <td><strong>Total Blind Spot</strong><br/>Attack succeeds undetected.</td>
      <td>Adversary stays at 2–3 attempts per IP, intentionally under-running the threshold.</td>
    </tr>
    <tr>
      <td><strong>Loosened Threshold</strong><br/><code>Failures ≥ 2 / IP</code></td>
      <td style="color: #d97706; font-weight: 700;">97 Alerts</td>
      <td><strong>SOC Alert Fatigue</strong><br/>Analyst paralysis & triage flooding.</td>
      <td>Benign typos and network retries trigger 96 false positives; true attack is buried in noise.</td>
    </tr>
    <tr>
      <td><strong>Quorum Consensus Engine</strong><br/><code>Bipartite + Multi-Family</code></td>
      <td style="color: #15803d; font-weight: 700;">1 Correlated Incident</td>
      <td><strong>Precise Critical Escalation</strong><br/><code>Score 100/100 [CRITICAL]</code></td>
      <td>Disjoint-Set Union-Find connects 10 IPs & 47 accounts into 1 unified bipartite campaign.</td>
    </tr>
  </tbody>
</div>

<div class="callout callout-success">
  <strong>Key Takeaway for Evaluators:</strong> Quorum proves that you cannot solve distributed attacks by simply lowering volume thresholds. You must model the attack as a <strong>graph topology</strong> and correlate multi-family signals into mathematical consensus.
</div>

<h2>2. End-to-End System Architecture</h2>
<p>
Quorum implements an uncompromised 8-family detection plane operating over normalized authentication telemetry:
</p>

<pre><code>┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 QUORUM DETECTION PLANE                                 │
│                                                                                        │
│   Raw JSONL      [F2 Normalizer]       [F5 Burst Detector]    [F7 Bipartite Cluster]   │
│   Auth Stream ──► Credential Strip ──► Single IP &gt;50 Fails ──► Disjoint-Set Union-Find │
│                   IPv4/IPv6 Clean       High-Volume Brute       Multi-IP Spray Graph   │
│                   UTC Timestamp                                           │            │
│                                        [F10 Pivot Detector] ◄─────────────┘            │
│                                        Post-spray SUCCESS on                           │
│                                        campaign IP within 2h                           │
│                                                  │                                     │
│                                        [F13 Consensus Engine]                          │
│                                        Severity = Base × Multiplier + PivotBonus        │
│                                                  │                                     │
│                                     1 Correlated Critical Incident                     │
│                                                  │                                     │
│                          ┌───────────────────────┴───────────────────────┐             │
│                          ▼                                               ▼             │
│                 [F21 Cryptographic Ledger]                      [F25 Export Suite]     │
│                 SHA-256 Merkle-Chain Block                      Microsoft Sentinel ARM │
│                 O(N) Tamper Verification                        STIX 2.1 Threat Bundle │
└────────────────────────────────────────────────────────────────────────────────────────┘</code></pre>

<table>
  <thead>
    <tr><th>Family</th><th>Name</th><th>Signal & Mechanism</th><th>Complexity</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>F2</strong></td><td>Canonical Normalizer</td><td>Strips credentials, unwraps IPv4-mapped IPv6 (::ffff:), enforces UTC and RFC1918 flags.</td><td>O(N)</td></tr>
    <tr><td><strong>F5</strong></td><td>Burst Detector</td><td>Sliding 15-minute window for high-volume brute force attacks (&gt;50 failures / single IP).</td><td>O(N)</td></tr>
    <tr><td><strong>F7</strong></td><td>Bipartite Spray Detector</td><td>Bipartite graph with Disjoint Set Union-Find. Links IP nodes to Account nodes.</td><td>O(N · α(V))</td></tr>
    <tr><td><strong>F10</strong></td><td>Pivot Detector</td><td>Detects a SUCCESS event from an IP belonging to an active spray cluster within 2 hours.</td><td>O(E)</td></tr>
    <tr><td><strong>F13</strong></td><td>Consensus Engine</td><td>Multi-family arithmetic: Base Score × Topology Multiplier + Pivot Compromise Bonus.</td><td>O(1)</td></tr>
    <tr><td><strong>F15</strong></td><td>Contrast Comparator</td><td>Live comparative benchmark computing Naive vs. Loosened vs. Quorum detections in memory.</td><td>O(N)</td></tr>
    <tr><td><strong>F21</strong></td><td>Audit Ledger</td><td>SHA-256 hash-chained immutable ledger. Previous hash chaining with tamper simulation.</td><td>O(N)</td></tr>
    <tr><td><strong>F25</strong></td><td>Export Suite</td><td>Microsoft Sentinel ARM REST payload dispatcher and OASIS STIX 2.1 JSON bundle exporter.</td><td>O(I)</td></tr>
  </tbody>
</table>

<!-- ================= PAGE 3: MATHEMATICAL FOUNDATIONS ================= -->
<div class="page-break"></div>
<h2>3. Mathematical Foundations & Core Algorithms</h2>

<h3>A. Bipartite Graph Union-Find (Disjoint Set) Clustering (F7)</h3>
<p>
Quorum models enterprise telemetry as a bipartite graph $G = (V_{IP} \cup V_{User}, E)$, where:
</p>
<ul>
  <li>$V_{IP}$ is the set of all unique remote client IP addresses.</li>
  <li>$V_{User}$ is the set of all targeted user accounts.</li>
  <li>An edge $e = (ip, user) \in E$ is formed when an authentication attempt occurs between $ip$ and $user$.</li>
</ul>
<p>
To cluster connected components across streaming telemetry in real-time without quadratic $O(V^2)$ graph traversals, Quorum uses <strong>Disjoint-Set Union-Find with Path Compression and Rank Heuristics</strong>:
</p>

<pre><code>class DisjointSet {
  parent: Map&lt;string, string&gt; = new Map();
  rank: Map&lt;string, number&gt; = new Map();

  find(i: string): string {
    if (this.parent.get(i) === i) return i;
    // Path compression: points directly to root representative
    const root = this.find(this.parent.get(i)!);
    this.parent.set(i, root);
    return root;
  }

  union(i: string, j: string): void {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return;

    // Union by rank: attaches shallower tree under deeper tree
    const rankI = this.rank.get(rootI) || 0;
    const rankJ = this.rank.get(rootJ) || 0;
    if (rankI &lt; rankJ) {
      this.parent.set(rootI, rootJ);
    } else if (rankI &gt; rankJ) {
      this.parent.set(rootJ, rootI);
    } else {
      this.parent.set(rootJ, rootI);
      this.rank.set(rootI, rankI + 1);
    }
  }
}</code></pre>

<p>
<strong>Theoretical Guarantee:</strong> The amortized time per operation is $O(\alpha(N))$, where $\alpha$ is the Inverse Ackermann Function. In all physical universe computing bounds, $\alpha(N) \le 4$, making cluster updates strictly <strong>near-constant time $O(1)$</strong> per telemetry event.
</p>

<h3>B. Multi-Family Consensus Arithmetic (F13)</h3>
<p>
Traditional systems add arbitrary weights. Quorum calculates severity using deterministic multi-family consensus arithmetic:
</p>
<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'JetBrains Mono'; font-size: 10pt; text-align: center; margin: 10px 0;">
  $$\text{Severity Score} = \min\left(100, \left(\text{Base Score} \times \text{Multiplier}\right) + \text{Pivot Bonus}\right)$$
</div>
<ul>
  <li><strong>Base Score:</strong>
    <ul>
      <li>F10 Pivot Present: <code>Base = 100</code> (Immediate maximum base due to confirmed credential compromise).</li>
      <li>F7 Spray Only: <code>Base = 60</code> (Broad reconnaissance campaign).</li>
      <li>F5 Burst Only: <code>Base = 40</code> (Uncoordinated single-source brute force).</li>
    </ul>
  </li>
  <li><strong>Topology Multiplier:</strong>
    <ul>
      <li>Graph Cluster + Pivot Confirmed: <code>1.00</code></li>
      <li>Multi-IP Bipartite Cluster without Pivot: <code>0.85</code></li>
      <li>Isolated Brute Force: <code>0.60</code></li>
    </ul>
  </li>
  <li><strong>Pivot Bonus:</strong> <code>+15 points</code> added if an account transitioning from spray failure to valid session is privileged (e.g., Domain Admin, SecOps, VPN Gateway).</li>
  <li><strong>Final Clamping:</strong> Clamped strictly to the range $[0, 100]$:
    <ul>
      <li><strong>0 – 29:</strong> Low | <strong>30 – 69:</strong> Medium | <strong>70 – 89:</strong> High | <strong>90 – 100:</strong> <strong>CRITICAL</strong></li>
    </ul>
  </li>
</ul>

<h3>C. Cryptographic SHA-256 Tamper-Evident Ledger (F21)</h3>
<p>
To satisfy strict enterprise compliance and chain-of-custody requirements, every detection record $R_i$ is committed to an immutable hash chain:
</p>
<div style="background: #f1f5f9; padding: 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'JetBrains Mono'; font-size: 9pt; text-align: center; margin: 8px 0;">
  $$H_0 = \text{SHA-256}(\text{"GENESIS"} \parallel \text{Metadata}_0)$$<br/>
  $$H_i = \text{SHA-256}\left(H_{i-1} \parallel \text{Timestamp}_i \parallel \text{RecordPayload}_i \parallel \text{Nonce}_i\right)$$
</div>
<p>
If any adversarial entity alters an IP, timestamp, or score in past records, re-verifying the chain from genesis flags the exact block index of tampering in $O(N)$ time with zero false positives.
</p>

<!-- ================= PAGE 4: VISUAL TOUR & ACTUAL SCREENSHOTS ================= -->
<div class="page-break"></div>
<h2>4. Interactive Interface Tour & Visual Evidence</h2>

<div class="grid-2">
  <div class="img-card">
    <img src="${imgHero}" alt="Hero Landing Page" />
    <div class="img-caption"><strong>Figure 1: Landing Console</strong> — Live attack telemetry ticker, system status, and 45-second demo summary.</div>
  </div>
  <div class="img-card">
    <img src="${imgBipartite}" alt="Bipartite Graph Topology" />
    <div class="img-caption"><strong>Figure 2: Bipartite Topology Dashboard</strong> — Interactive D3 force graph with red pivot compromise edges.</div>
  </div>
</div>

<div class="grid-2">
  <div class="img-card">
    <img src="${imgGlobe}" alt="Nexus 3D Cyber Threat Globe" />
    <div class="img-caption"><strong>Figure 3: Nexus 3D Cyber Globe</strong> — WebGL geospatial attribution of distributed proxy exit nodes.</div>
  </div>
  <div class="img-card">
    <img src="${imgSim}" alt="Nexus Live Simulation" />
    <div class="img-caption"><strong>Figure 4: Live Attack Simulation</strong> — Real-time event propagation with audio alerts and toast feed.</div>
  </div>
</div>

<div class="grid-2">
  <div class="img-card">
    <img src="${imgAnalysis}" alt="Tactical Triage" />
    <div class="img-caption"><strong>Figure 5: Tactical Triage & Curve</strong> — Per-event telemetry stream, failure rate curves, and evidence cards.</div>
  </div>
  <div class="img-card">
    <img src="${imgLedger}" alt="Forensics Audit Ledger" />
    <div class="img-caption"><strong>Figure 6: SHA-256 Audit Ledger</strong> — Cryptographic hash chain with live tamper simulation button.</div>
  </div>
</div>

<div class="callout">
  <strong>Live Demo URL:</strong> Evaluators can interact with all 6 live screens directly at <a href="https://quorum-rust-gamma.vercel.app">https://quorum-rust-gamma.vercel.app</a>. Zero installation required.
</div>

<!-- ================= PAGE 5: TECH STACK & ENGINEERING HYGIENE ================= -->
<div class="page-break"></div>
<h2>5. Technology Stack & Production Engineering Rigor</h2>

<table>
  <thead>
    <tr><th>Layer</th><th>Technology</th><th>Engineering Rationale & Rigor</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Frontend Web</strong></td>
      <td>Next.js 14 (App Router) + React 18</td>
      <td>Server-rendered core layout, fast dynamic client hydration, strict zero-layout-shift UI.</td>
    </tr>
    <tr>
      <td><strong>Language</strong></td>
      <td>TypeScript 5.6 (Strict Mode)</td>
      <td><code>noImplicitAny: true</code>, strict null checks, zero type assertions (<code>as any</code> banned).</td>
    </tr>
    <tr>
      <td><strong>Styling</strong></td>
      <td>Tailwind CSS 3.4 (Anti-Vibecoding)</td>
      <td>True-black canvas (<code>#000000</code>), technical slate cards (<code>#080c14</code>), semantic severity colors only.</td>
    </tr>
    <tr>
      <td><strong>Data Viz</strong></td>
      <td>D3.js v7 + WebGL Three.js</td>
      <td>D3 force simulation for bipartite graph; Three.js/COBE for 60fps 3D threat globe.</td>
    </tr>
    <tr>
      <td><strong>Validation</strong></td>
      <td>Zod v3.23</td>
      <td>Strict runtime schema validation on all inbound API payloads and Sentinel ARM webhooks.</td>
    </tr>
    <tr>
      <td><strong>Audio Cues</strong></td>
      <td>Web Audio API (Procedural)</td>
      <td>Deterministic synthesized sound synthesis (zero external audio asset latency).</td>
    </tr>
    <tr>
      <td><strong>Testing</strong></td>
      <td>Node:Test Runner + Vitest</td>
      <td><strong>55 / 55 unit tests passing</strong> across 13 suites in 2.7s. 100% deterministic assertion loop.</td>
    </tr>
    <tr>
      <td><strong>CI / CD</strong></td>
      <td>GitHub Actions + Vercel Production</td>
      <td>Automated typecheck, test, and build on every push. Instant global Edge deployment.</td>
    </tr>
  </tbody>
</table>

<h3>Anti-Vibecoding Directives (Strictly Enforced)</h3>
<ul>
  <li><strong>No Visual Clichés:</strong> Zero purple/violet marketing gradients, zero bouncing decorative animations, zero fake bento grids, and zero emojis in technical data tables.</li>
  <li><strong>True-Black Security Canvas:</strong> Palette is built on <code>#000000</code> background, <code>#080C14</code> technical slate cards, and <code>rgba(255,255,255,0.08)</code> 1px structural borders.</li>
  <li><strong>JetBrains Mono Typography:</strong> All IP addresses, timestamps, hashes, equations, and telemetry logs are formatted strictly in monospace.</li>
  <li><strong>Zero Hardcoded Credentials:</strong> All passwords and token-shaped values are stripped in F2 before normalization and never touch disk or memory.</li>
</ul>

<!-- ================= PAGE 6: ISHAN GUPTA (TEAM LEADER) ================= -->
<div class="page-break"></div>
<h2>6. Role-Specific Defense & Viva Questions: Ishan Gupta</h2>
<div class="member-box">
  <div class="member-header">
    <div>
      <span class="member-name">Ishan Gupta</span> <span class="member-id">(S26CSEU1496)</span>
    </div>
    <span class="member-role">Team Leader & System Architect</span>
  </div>
  <p style="margin: 0; font-size: 8.5pt;"><strong>Specialization:</strong> End-to-End System Design, Threat Modeling (Midnight Blizzard), Multi-Family Consensus Arithmetic (F13), Contrast Comparators (F15), Executive Pitch.</p>
</div>

<h3>Ishan's 10 Most Probable Viva Questions & Winning Answers</h3>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q1</span> In simple terms, what is Quorum and why was it built?</div>
  <div class="qa-answer"><strong>Answer:</strong> Quorum is an enterprise campaign-correlation detection layer for VPN authentication logs. We built it because modern SIEM threshold rules fail against distributed password sprays like Midnight Blizzard (NOBELIUM). When attackers use 10 different proxy IPs to attack 47 accounts, each IP only has 2-3 failures, bypassing normal rules. Quorum clusters these events into a bipartite graph and uses multi-family consensus arithmetic to generate exactly one correlated Critical incident with zero noise.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Campaign-correlation layer", "Bipartite graph", "Midnight Blizzard APT29".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q2</span> What is the "45-Second Demo Contrast"?</div>
  <div class="qa-answer"><strong>Answer:</strong> It is our benchmark test running 490 events through three detection engines simultaneously: 1) A Naive SIEM rule (≥5 fails/IP) gives <strong>0 alerts</strong> (total miss). 2) A Loosened rule (≥2 fails/IP) gives <strong>97 alerts</strong> (massive SOC alert fatigue). 3) Quorum gives <strong>1 Correlated Critical Incident</strong>. It proves that you cannot fix detection by tweaking volume thresholds; you must model attacks as a connected graph.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "0 vs 97 vs 1".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q3</span> How does your F13 Consensus Severity Engine calculate its score?</div>
  <div class="qa-answer"><strong>Answer:</strong> We use the formula: <code>Score = min(100, Base × Multiplier + PivotBonus)</code>. If an attacker achieved a successful login (pivot), Base is 100. If it was only a distributed spray, Base is 60. The multiplier reflects graph topology (1.0 for multi-family graph+pivot, 0.85 for spray alone). If a privileged or administrator account was compromised, we add a +15 point bonus. The output maps directly to Low, Medium, High, or Critical.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Deterministic consensus equation, not arbitrary weights".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q4</span> How does Quorum handle false positives from benign corporate users?</div>
  <div class="qa-answer"><strong>Answer:</strong> Benign corporate users make occasional typos on single IPs, or multiple users connect from one branch office IP. In our graph model, legitimate branch offices connect users to normal SaaS apps without distributed cross-account spraying across residential proxies. Furthermore, our F10 Pivot detector requires a prior spray history from that exact cluster before flagging a pivot, preventing false alarms on routine password resets.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Graph density filtering and prior-spray requirement".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q5</span> What are the 8 detection families in Quorum?</div>
  <div class="qa-answer"><strong>Answer:</strong> F2 (Canonical Normalizer), F5 (Burst Brute-Force Detector), F7 (Bipartite Graph Spray Detector), F10 (Compromise Pivot Detector), F13 (Consensus Engine), F15 (Baseline Contrast Comparators), F21 (SHA-256 Audit Ledger), and F25 (Microsoft Sentinel & STIX 2.1 Export Suite).</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "8 modular, decoupled families with strict interfaces".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q6</span> Why did you build Quorum as a correlation layer instead of replacing the SIEM?</div>
  <div class="qa-answer"><strong>Answer:</strong> Enterprise SOCs have millions of dollars invested in Microsoft Sentinel and Splunk. Replacing them is unrealistic. Quorum sits directly on the telemetry pipeline as a specialized correlation coprocessor. It consumes raw VPN auth logs, detects coordinated clusters, and outputs verified ARM incident payloads directly into Microsoft Sentinel via webhooks.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Complementary coprocessor, native Microsoft Sentinel integration".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q7</span> How do you prove that Quorum's results are deterministic?</div>
  <div class="qa-answer"><strong>Answer:</strong> We have a Ralph Verification Loop test in our test suite. When identical telemetry is fed into the engine across repeated runs, the resulting incidents, graph edge counts, consensus scores, and STIX UUIDv5 object identifiers are 100% byte-identical. There is zero hidden global state or random jitter.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Deterministic Ralph Loop, UUIDv5 name-based hashing".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q8</span> How does Quorum scale if an enterprise generates millions of auth logs per hour?</div>
  <div class="qa-answer"><strong>Answer:</strong> Our Union-Find algorithm runs in near-constant $O(\alpha(N))$ time per event. By partitioning the telemetry ingestion into sliding temporal buckets (e.g., 2-hour campaign windows) and pruning disconnected components, memory usage is bounded. In our red-team tests, the engine ingested 100,000 hostile events without quadratic slowdown.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "O(α(N)) amortized complexity and sliding temporal windowing".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q9</span> What is the significance of the "Anti-Vibecoding" standards in your project?</div>
  <div class="qa-answer"><strong>Answer:</strong> In enterprise security, flashy consumer UI templates with purple neon gradients, emojis, and unverified data erode trust. We enforced strict Anti-Vibecoding rules: a true-black canvas, JetBrains Mono font for all machine telemetry, zero hardcoded values, and semantic coloring used only for actual severity levels.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Enterprise SOC credibility and zero fake decorative telemetry".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q10</span> What would you pitch to the judges in 30 seconds?</div>
  <div class="qa-answer"><strong>Answer:</strong> "Judges, Midnight Blizzard breached major enterprises by distributing password sprays across residential proxies to bypass SIEM volume thresholds. We built Quorum: an enterprise detection layer that models telemetry as a bipartite graph, clusters attacks using Union-Find in near-constant time, and surfaces exactly one correlated Critical incident. We have 55 unit tests passing, live Sentinel integration, and a production demo ready right now."</div>
  <div class="qa-keypoint">✓ Key phrase to mention: Deliver with calm confidence, then point to the live demo screen.</div>
</div>

<!-- ================= PAGE 7: ADITYA PANDEY ================= -->
<div class="page-break"></div>
<h2>7. Role-Specific Defense & Viva Questions: Aditya Pandey</h2>
<div class="member-box">
  <div class="member-header">
    <div>
      <span class="member-name">Aditya Pandey</span> <span class="member-id">(S26CSEU2576)</span>
    </div>
    <span class="member-role">Detection Engine & Graph Algorithms</span>
  </div>
  <p style="margin: 0; font-size: 8.5pt;"><strong>Specialization:</strong> Bipartite Graph Modeling, Disjoint-Set Union-Find (F7), Compromise Pivot Detection (F10), Burst Detection (F5), Algorithm Complexity.</p>
</div>

<h3>Aditya's 10 Most Probable Viva Questions & Winning Answers</h3>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q1</span> Why did you use a Bipartite Graph instead of a regular graph?</div>
  <div class="qa-answer"><strong>Answer:</strong> Authentication telemetry naturally has two disjoint sets of entities: Source IP addresses on one side, and Target User Accounts on the other. An IP never authenticates to an IP, and a user never authenticates to a user. A bipartite graph $G = (V_{IP} \cup V_{User}, E)$ accurately models this relationship where edges only exist between an IP and a Username.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Two disjoint sets: IPs on left, Usernames on right".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q2</span> How does the Union-Find algorithm work in Quorum?</div>
  <div class="qa-answer"><strong>Answer:</strong> Whenever an authentication attempt occurs between IP $A$ and User $B$, we add an edge by performing a <code>union(A, B)</code>. If IP $A$ also targets User $C$, and another IP $D$ targets User $C$, Union-Find merges their disjoint sets. All IPs and Users participating in that coordinated campaign end up in the exact same connected component tree.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Merging disjoint sets into connected component trees".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q3</span> What optimizations did you implement in Union-Find?</div>
  <div class="qa-answer"><strong>Answer:</strong> We implemented two classic optimizations: 1) <strong>Path Compression</strong> in the <code>find()</code> method, which flattens the tree by making nodes point directly to the root; and 2) <strong>Union by Rank</strong> in the <code>union()</code> method, which always attaches the shallower tree under the root of the deeper tree.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Path Compression + Union by Rank".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q4</span> What is the time complexity of your clustering algorithm?</div>
  <div class="qa-answer"><strong>Answer:</strong> With path compression and union by rank, the amortized time complexity per operation is $O(\alpha(N))$, where $\alpha$ is the Inverse Ackermann Function. Because $\alpha(N) \le 4$ for any practical number of events, it operates in near-constant $O(1)$ time per event, which is dramatically faster than $O(V^2)$ BFS/DFS graph traversals.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Inverse Ackermann function O(α(N)), near constant time".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q5</span> How does the F10 Pivot Detector work?</div>
  <div class="qa-answer"><strong>Answer:</strong> F10 looks for a critical state transition: a successful authentication event (<code>SUCCESS</code>) occurring on an IP that previously generated failures within an active F7 spray cluster, within a 2-hour correlation window. This represents the exact moment an adversary successfully guesses a password and transitions from spraying to active internal compromise.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Post-spray SUCCESS from a known campaign IP within 2 hours".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q6</span> How do you prevent false pivots when a user logs in from their normal IP?</div>
  <div class="qa-answer"><strong>Answer:</strong> In our red-team tests, we specifically tested the "source-mismatch exploit" where a sprayed account logs in from its legitimate corporate IP. F10 rejects this because the corporate IP was never part of the hostile proxy cluster. A pivot is only confirmed if the SUCCESS comes from an IP address already tied to the spray cluster.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Source-mismatch protection and cluster IP verification".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q7</span> What is the difference between F5 Burst and F7 Spray?</div>
  <div class="qa-answer"><strong>Answer:</strong> F5 detects vertical brute force: high volume from a single IP (&gt;50 failures in 15 minutes targeting one or few accounts). F7 detects horizontal distributed spray: low volume per IP (&lt;5 failures) distributed across dozens of IPs targeting dozens of accounts. They are complementary signals.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Vertical brute force vs. horizontal distributed spray".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q8</span> How does Quorum distinguish between a distributed attack and a benign VPN concentrator?</div>
  <div class="qa-answer"><strong>Answer:</strong> On a legitimate VPN concentrator, hundreds of legitimate users connect with mostly successful logins from known subnets. In a password spray, the ratio of failures to successes is extremely high (&gt;90% failure), and each IP only touches a small number of accounts once or twice. We evaluate the failure ratio and unique user-per-IP dispersion before triggering F7.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Failure-to-success ratio and entropy of user dispersion".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q9</span> What happens if an attacker spreads the spray over 7 days instead of 2 hours?</div>
  <div class="qa-answer"><strong>Answer:</strong> In production, Quorum maintains state in configurable temporal windows. While our demo corpus evaluates a 2-hour window, the bipartite cluster state can be persisted in Redis or Azure Cosmos DB with an extended TTL of 7 to 14 days, tracking low-frequency connections without changing the graph math.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Configurable sliding window and TTL-backed state store".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q10</span> How did you test the resilience of your graph algorithms?</div>
  <div class="qa-answer"><strong>Answer:</strong> We wrote comprehensive red-team tests in <code>tests/redteam.test.ts</code>. We tested a hostile cluster of 500 IPs × 2000 accounts and a 100,000-event single burst. The algorithms maintained bounded memory and zero quadratic performance degradation, passing all 55 unit tests.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Red-team test suite: 500 IPs × 2000 accounts tested".</div>
</div>

<!-- ================= PAGE 8: DEVANSH TIWARI ================= -->
<div class="page-break"></div>
<h2>8. Role-Specific Defense & Viva Questions: Devansh Tiwari</h2>
<div class="member-box">
  <div class="member-header">
    <div>
      <span class="member-name">Devansh Tiwari</span> <span class="member-id">(S26CSEU2556)</span>
    </div>
    <span class="member-role">Forensics Ledger & Telemetry Pipeline</span>
  </div>
  <p style="margin: 0; font-size: 8.5pt;"><strong>Specialization:</strong> F2 Canonical Normalizer, F21 SHA-256 Audit Ledger, Cryptographic Chain of Custody, Data Sanitization, Secret Hygiene.</p>
</div>

<h3>Devansh's 10 Most Probable Viva Questions & Winning Answers</h3>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q1</span> What is the role of the F2 Canonical Normalizer?</div>
  <div class="qa-answer"><strong>Answer:</strong> Raw enterprise logs from firewalls, Cisco VPN, and Azure AD arrive in messy, inconsistent formats. F2 parses and normalizes them into our canonical <code>AuthEvent</code> interface: stripping credentials, canonicalizing usernames (removing NetBIOS domains and UPN prefixes), unwrapping IPv4-mapped IPv6 addresses, and converting timestamps to strict UTC.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Canonicalization, NetBIOS/UPN stripping, UTC normalization".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q2</span> How does Quorum protect raw user passwords from leaking into logs?</div>
  <div class="qa-answer"><strong>Answer:</strong> We enforce a strict Zero-Credential policy. In F2, any field resembling a password, hash, or bearer token (e.g., <code>password</code>, <code>passwd</code>, <code>secret</code>, <code>token</code>) is stripped at the ingestion boundary before normalization. Passwords are never written to disk, stored in memory, or included in event hashes.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Ingestion boundary stripping and zero-credential storage".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q3</span> What is the SHA-256 Hash-Chained Audit Ledger (F21)?</div>
  <div class="qa-answer"><strong>Answer:</strong> In legal forensics and regulatory compliance, incident data must be tamper-evident. F21 creates a cryptographic hash chain similar to a blockchain: each record's hash is computed using the previous block's hash, timestamp, payload, and a nonce. Once committed, any modification to past records breaks the hash chain.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Previous hash linking, tamper-evident forensic trail".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q4</span> How do you detect if someone tampers with an incident record?</div>
  <div class="qa-answer"><strong>Answer:</strong> We provide an <code>/api/v1/audit/verify</code> endpoint that iterates through the ledger from the Genesis block ($H_0$). It recomputes each block's SHA-256 hash using the stored previous hash and payload. If an attacker edits a single character of an IP or score, the recomputed hash will not match, pinpointing the exact corrupted block index in $O(N)$ time.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "O(N) full-chain recalculation from genesis".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q5</span> How does IPv4-mapped IPv6 unwrapping work in F2?</div>
  <div class="qa-answer"><strong>Answer:</strong> In dual-stack networks, IPv4 addresses often appear wrapped as IPv6 strings like <code>::ffff:192.168.1.1</code>. If not normalized, the same attacker IP would be treated as two different entities by graph algorithms. F2 strips the <code>::ffff:</code> prefix and validates the inner IPv4 structure, ensuring consistent IP identity.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "::ffff: unwrapping for consistent IP entity resolution".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q6</span> How does F2 handle timestamps with missing or invalid timezones?</div>
  <div class="qa-answer"><strong>Answer:</strong> If a timestamp lacks timezone information, F2 assumes UTC and sets a flag <code>tsTzAssumed = true</code> for audit transparency. Furthermore, we reject any timestamp prior to the year 2000 as an implausible timestamp (<code>IMPLAUSIBLE_TS</code>), preventing clock-skew denial-of-service attacks.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "UTC assumption flag and year 2000 sanity floor".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q7</span> What happens if an adversary sends 50KB garbage strings in JSONL logs?</div>
  <div class="qa-answer"><strong>Answer:</strong> We tested this in our red-team tests under "Log Dumping Attacks". Our parser clamps rejection raw lines to a maximum of 1,024 bytes and truncates oversized payloads with a boundary indicator, preventing memory exhaustion and log-flooding attacks.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Bounded rejection buffer and 1024-byte clamp".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q8</span> How does the audit ledger support multi-analyst accountability?</div>
  <div class="qa-answer"><strong>Answer:</strong> Every state change—such as an incident being marked as <code>Under Investigation</code> or <code>Resolved</code>—is appended as a new immutable block with the analyst's identity, timestamp, action type, and cryptographic signature of the change, maintaining a full audit trail.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Append-only state mutations with analyst attribution".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q9</span> Why did you use SHA-256 instead of MD5 or SHA-1?</div>
  <div class="qa-answer"><strong>Answer:</strong> MD5 and SHA-1 have proven practical collision vulnerabilities (e.g., the SHAttered attack). In enterprise cybersecurity and NIST SP 800-131A standards, SHA-256 is the approved cryptographic hash function offering 128-bit security strength against collision attacks.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "NIST compliance and collision resistance".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q10</span> Can you demonstrate ledger tamper detection on the live site?</div>
  <div class="qa-answer"><strong>Answer:</strong> Yes. On our live forensics page at <code>/core/forensics</code>, there is an interactive "Simulate Tamper" button. When clicked, it mutates block payload #2 and re-verifies the chain. The UI instantly turns red, identifying the exact tampered block index and showing the hash divergence.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Live tamper simulation button on /core/forensics".</div>
</div>

<!-- ================= PAGE 9: SATYAM KALRA ================= -->
<div class="page-break"></div>
<h2>9. Role-Specific Defense & Viva Questions: Satyam Kalra</h2>
<div class="member-box">
  <div class="member-header">
    <div>
      <span class="member-name">Satyam Kalra</span> <span class="member-id">(S26CSEU2587)</span>
    </div>
    <span class="member-role">Frontend Architecture & SOC Integration</span>
  </div>
  <p style="margin: 0; font-size: 8.5pt;"><strong>Specialization:</strong> Next.js 14 Web Architecture, D3.js Force Simulation, Microsoft Sentinel ARM Webhook, OASIS STIX 2.1 Export, Web Audio API.</p>
</div>

<h3>Satyam's 10 Most Probable Viva Questions & Winning Answers</h3>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q1</span> How is Quorum's frontend architected?</div>
  <div class="qa-answer"><strong>Answer:</strong> We use Next.js 14 App Router with React 18 and TypeScript. The application is divided into core operational routes: <code>/core</code> (SOC Console), <code>/core/nexus</code> (Interactive Bipartite Graph), <code>/core/analysis</code> (Tactical Triage & Failure Curves), and <code>/core/forensics</code> (Audit Ledger). State is managed via lightweight Zustand stores with zero layout shift.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Next.js 14 App Router, TypeScript, Zustand state management".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q2</span> How did you build the interactive Bipartite Graph visualization?</div>
  <div class="qa-answer"><strong>Answer:</strong> We used <strong>D3.js (d3-force)</strong>. We configure separate charge, link, and collision forces. IP nodes are styled as technical cyan circles, User nodes as slate diamonds, and normal spray edges as amber dashed lines. When a compromise pivot occurs, the edge dynamically pulses in vivid red, allowing SOC analysts to visually trace the exact path of entry.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "D3-force simulation, distinct node glyphs, dynamic pivot pulse".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q3</span> How does Quorum integrate with Microsoft Sentinel?</div>
  <div class="qa-answer"><strong>Answer:</strong> We built an export suite that formats Quorum incidents into native Microsoft Sentinel ARM REST payloads (<code>Microsoft.SecurityInsights/Incidents</code>) with MITRE ATT&CK tactics (Credential Access) and techniques (T1110.003). We also provide a live webhook endpoint at <code>/api/v1/sentinel/webhook</code> protected by strict Zod schema validation that returns HTTP 202 Accepted receipts.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Native ARM JSON schema, MITRE T1110.003, Zod validation".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q4</span> What is STIX 2.1 and why is it important in Quorum?</div>
  <div class="qa-answer"><strong>Answer:</strong> STIX 2.1 (Structured Threat Information Expression) is the OASIS international standard for cyber threat intelligence sharing. Quorum generates complete STIX 2.1 bundles containing Attack Pattern objects, Identity objects, IPv4-Addr SCOs, and Sighting relationships. This allows any threat sharing platform (like OpenCTI or MISP) to consume Quorum incidents immediately.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "OASIS STIX 2.1 bundle, Threat Intelligence interoperability".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q5</span> How do you ensure STIX object IDs are deterministic?</div>
  <div class="qa-answer"><strong>Answer:</strong> We use <strong>UUIDv5 (Name-Based SHA-1 UUID)</strong> tied to our incident identifier namespace. If the same incident is exported multiple times, the generated STIX IDs (e.g., <code>incident--UUID</code>, <code>indicator--UUID</code>) are completely identical. This prevents duplicate entity pollution in external threat databases.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "UUIDv5 name-based determinism against duplicate pollution".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q6</span> How did you implement real-time audio cues without performance lag?</div>
  <div class="qa-answer"><strong>Answer:</strong> Instead of loading external MP3/WAV files that cause network latency or audio stutter, we used the procedural <strong>Web Audio API</strong>. We synthesize sine wave and oscillator tones mathematically in real-time (e.g., a low subtle tick for benign auth, a sharp 880Hz two-tone alarm for a Critical pivot). It adds zero external megabytes to page load.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Procedural Web Audio API oscillator synthesis".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q7</span> How does the 3D Nexus Threat Globe render smoothly?</div>
  <div class="qa-answer"><strong>Answer:</strong> We implemented a lightweight WebGL sphere rendering exit-node coordinates using hardware-accelerated canvas shaders. It renders at 60 FPS while visualizing geographic arcs from residential proxy locations across Eastern Europe, North America, and Asia toward the corporate VPN gateway.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Hardware-accelerated WebGL canvas at 60 FPS".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q8</span> How does the UI handle responsiveness and dark mode standards?</div>
  <div class="qa-answer"><strong>Answer:</strong> The interface follows strict Anti-Vibecoding directives. It uses a bespoke true-black theme (<code>#000000</code>) with 1px border dividers to prevent eye strain during long SOC shifts. It is fully responsive with custom CSS scrollbars and zero layout shifts (Cumulative Layout Shift score = 0).</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "True-black SOC ergonomics and zero layout shift (CLS = 0)".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q9</span> How is input validation handled on your public API endpoints?</div>
  <div class="qa-answer"><strong>Answer:</strong> Every API route (such as <code>/api/v1/sentinel/webhook</code> and <code>/api/v1/detect/run</code>) passes inbound request bodies through strict Zod schemas with <code>.strict()</code> enabled. Unexpected fields or oversized payload strings are rejected immediately with structured HTTP 400 or 413 responses.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "Strict Zod schemas and fail-fast validation".</div>
</div>

<div class="qa-block">
  <div class="qa-question"><span class="qa-num">Q10</span> How do you demonstrate the STIX and Sentinel exports to judges?</div>
  <div class="qa-answer"><strong>Answer:</strong> On the live incident triage page, there are direct export buttons: "Export STIX 2.1" and "Microsoft Sentinel Webhook". Clicking them either initiates an RFC-compliant JSON download or fires a live webhook receipt with full receipt IDs, which judges can inspect in browser dev tools.</div>
  <div class="qa-keypoint">✓ Key phrase to mention: "One-click interactive export on live dashboard".</div>
</div>

<!-- ================= PAGE 10: PRESENTATION STRATEGY ================= -->
<div class="page-break"></div>
<h2>10. Judge Presentation Script & Winning Strategy</h2>

<h3>The 3-Minute Team Presentation Script</h3>
<table style="font-size: 8.5pt;">
  <thead>
    <tr><th style="width: 20%;">Speaker</th><th style="width: 20%;">Time</th><th>Key Script & Action</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Ishan Gupta</strong><br/>(Team Leader)</td>
      <td><strong>0:00 – 0:50</strong><br/>(50 sec)</td>
      <td>
        <em>"Good morning Judges. We are Redmond Labs (Team 405), and we built <strong>Quorum</strong>. In modern enterprise SOCs, nation-state actors like Midnight Blizzard bypass traditional SIEM threshold rules by distributing password sprays across dozens of residential proxies—staying at 2-3 attempts per IP. If you keep thresholds high, you get zero alerts. If you lower them, you flood analysts with 97 false positives. Quorum solves this: it models telemetry as a bipartite graph, clusters connections using Union-Find in near-constant time, and outputs exactly ONE Correlated Critical Incident."</em>
      </td>
    </tr>
    <tr>
      <td><strong>Aditya Pandey</strong><br/>(Detection Engine)</td>
      <td><strong>0:50 – 1:30</strong><br/>(40 sec)</td>
      <td>
        <em>"Here on our live screen at <code>/core/nexus</code>, you see our bipartite graph in action. IPs are cyan, accounts are slate. Our Union-Find algorithm runs with path compression in $O(\alpha(N))$ time. When an attacker guesses a password, our F10 detector catches the transition—shown here by this red pulsing pivot edge—triggering our multi-family consensus arithmetic."</em>
      </td>
    </tr>
    <tr>
      <td><strong>Devansh Tiwari</strong><br/>(Forensics Ledger)</td>
      <td><strong>1:30 – 2:10</strong><br/>(40 sec)</td>
      <td>
        <em>"All telemetry passes through our F2 normalizer, which strips credentials at the boundary. Once detected, the incident is committed to our SHA-256 cryptographic audit ledger. If an adversary attempts to modify logs to hide their tracks, our chain verification detects tampering in $O(N)$ time, as seen right here when I simulate a tamper."</em>
      </td>
    </tr>
    <tr>
      <td><strong>Satyam Kalra</strong><br/>(Frontend & SOC)</td>
      <td><strong>2:10 – 2:45</strong><br/>(35 sec)</td>
      <td>
        <em>"Finally, Quorum integrates seamlessly with enterprise workflows. We don't replace your SIEM; we dispatch verified ARM payloads into Microsoft Sentinel via webhook and export OASIS STIX 2.1 threat intelligence bundles for automated firewall blocking."</em>
      </td>
    </tr>
    <tr>
      <td><strong>Ishan Gupta</strong><br/>(Conclusion)</td>
      <td><strong>2:45 – 3:00</strong><br/>(15 sec)</td>
      <td>
        <em>"Quorum has 55/55 passing unit tests, zero type errors, strict anti-vibecoding engineering, and is live right now on Vercel and GitHub. We are ready for your questions."</em>
      </td>
    </tr>
  </tbody>
</table>

<h3>Golden Rules for Answering Tough Evaluator Questions</h3>
<ul>
  <li><strong>Rule 1: Don't guess.</strong> If asked something deep, say: <em>"That was specifically designed by [Teammate Name]; they can give you the exact technical implementation."</em> This proves genuine teamwork.</li>
  <li><strong>Rule 2: Anchor on the 45-Second Demo Contrast.</strong> Whenever an evaluator asks <em>"Why not just use Sentinel analytics rules?"</em>, remind them: <em>"A rule on IP volume misses distributed attacks (0 alerts); a lower threshold drowns analysts in 97 false alarms. Graph clustering is mathematically required."</em></li>
  <li><strong>Rule 3: Show, don't just tell.</strong> Every answer should point to a specific screen on <a href="https://quorum-rust-gamma.vercel.app">quorum-rust-gamma.vercel.app</a> or a specific test in <code>tests/</code>.</li>
</ul>

<div style="margin-top: 30px; text-align: center; border-top: 2px solid #0078d4; padding-top: 10px;">
  <strong>REDMOND LABS · TEAM ID: 405 · MICROSOFT INNOVATE 2026</strong><br/>
  <span style="font-size: 8.5pt; color: #64748b;">All rights reserved. Designed for Top 25 Final Selection.</span>
</div>

</body>
</html>`;

const htmlPath = path.resolve('Quorum_Master_Guide_RedmondLabs.html');
const pdfPath = path.resolve('Quorum_Master_Guide_RedmondLabs.pdf');

fs.writeFileSync(htmlPath, html, 'utf-8');
console.log('HTML Guide written to:', htmlPath);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
console.log('Rendering PDF using Chrome Headless Engine...');

const res = spawnSync(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--run-all-compositor-stages-before-draw',
  '--print-to-pdf=' + pdfPath,
  'file:///' + htmlPath.replace(/\\\\/g, '/')
]);

if (fs.existsSync(pdfPath)) {
  const stats = fs.statSync(pdfPath);
  console.log('SUCCESS! Quorum Master Guide PDF generated successfully!');
  console.log('PDF Location:', pdfPath);
  console.log('File Size:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
} else {
  console.error('ERROR: PDF generation failed. Chrome output:', res.stderr?.toString());
}
