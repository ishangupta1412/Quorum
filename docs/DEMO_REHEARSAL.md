# Quorum â€” 45-Second Stage Contrast Demo Rehearsal
**Microsoft Innovate 2026 Â· Redmond Labs Â· Plan 5.3**

> All numbers below are measured from the deterministic seeded corpus, not estimated.
> Verification: `npm.cmd run typecheck` (0 errors) + `npm.cmd test` (54/54 pass) + `scripts/validate-all.ps1` (green).

---

## 1. Measured Contrast (in-browser demo corpus, 120 users, Pack B seed 20260405)

| Lens | Comparator definition | Measured |
|---|---|---|
| Lens 1 â€” Naive Volume SIEM | F5 default: â‰¥5 failures per user+IP / 15 min | **1 alert** (loud brute-force decoy only; distributed spray untouched) |
| Lens 2 â€” Loosened Threshold | F6 loosened: â‰¥2 accounts per IP / 24 h | **12 alerts** (spray legs caught + queue flood begins) |
| Lens 3 â€” Quorum Consensus | F5â†’F6â†’F7â†’F10â†’F13 pipeline | **1 Correlated Critical Incident** |

Printed severity equation (byte-identical every run):

```text
Base 100 (F7_campaign) Ã— 1.25 (3 families: VOLUME, GRAPH, PIVOT) + 15 (auth success) â†’ floor 80 â†’ clipped 100 [CRITICAL]
```

### Scale note (stage narrative: 0 vs 97 vs 1)

The sealed flagship Pack B (PRD Â§10: 1,200 users / 14 days / A4 campaign with
312 residential-proxy IPs) measures **0 vs 97 vs 1** under the same comparator
definitions. The lightweight in-browser corpus reproduces the same *shape* â€”
volume rule misses the campaign, loosened rule floods, Quorum correlates to one
Critical â€” at demo scale (1 vs 12 vs 1). Both scales are live-computed from
loaded events on every run; no counter is hard-coded (F15).

---

## 2. Word-for-Word 45-Second Script

| Timestamp | Visual action | Voiceover |
|---|---|---|
| 0:00â€“0:10 | The Core, sealed Pack B loaded. Point to Lens 1. | "Every enterprise VPN faces this: Midnight Blizzard distributed password sprays across residential proxy IPs. Standard SIEM Lens 1: the volume rule catches only the noisy decoy â€” the distributed campaign bypasses it completely." |
| 0:10â€“0:20 | Click Run Detection, point to Lens 2. | "Loosen the threshold and you get Lens 2: a flood of low-fidelity alerts. Instant alert fatigue â€” the true campaign hides inside the noise." |
| 0:20â€“0:32 | Quorum ticker rolls to 1 Correlated Critical Incident. | "Here is Quorum. Our bipartite graph Union-Find correlates every proxy leg into exactly ONE high-confidence Critical incident â€” with the compromised account confirmed." |
| 0:32â€“0:40 | Highlight the severity equation block. | "Score 100 out of 100 â€” not a black-box hallucination. Deterministic arithmetic, printed on screen, reproducible byte-for-byte." |
| 0:40â€“0:45 | Click Simulate Database Tamper. Badge flips red. | "And our SHA-256 audit ledger proves instantly if anyone tampered with evidence. Zero trust, zero black box." |

---

## 3. Pre-Flight Checklist (offline / stage-proof)

1. `NEXT_PUBLIC_DEMO_OFFLINE=true` set â€” zero live network dependencies.
2. `npm.cmd run reticle` green (typecheck 0 errors, tests 30/30).
3. `scripts/validate-all.ps1` green (GSD workspace health).
4. Corpus determinism confirmed: two consecutive runs print identical equations.
5. Exports verified: Sentinel JSON, STIX 2.1 bundle, and CSV download from the incident panel.
6. Webhook rehearsal: POST the exported Sentinel JSON to `/api/v1/sentinel/webhook`, expect HTTP 202 with a `receiptId`; GET the same route to list receipts.

---

## 4. Sentinel Webhook Rehearsal (live streaming demo)

```powershell
# 1. Export Sentinel JSON from the The Core incident panel (button: Sentinel JSON).
# 2. Stream it to the demo webhook endpoint:
$body = @{ incident = (Get-Content sentinel-inc_quorum_correlated_01.json | ConvertFrom-Json) } | ConvertTo-Json -Depth 10
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/v1/sentinel/webhook -Body $body -ContentType 'application/json'
# Expected: HTTP 202 { success: true, data: { receiptId, incidentName, severity: 'High', ... } }

# 3. Verify receipt queue:
Invoke-RestMethod -Uri http://localhost:3000/api/v1/sentinel/webhook
# Expected: { success: true, data: { count: 1, receipts: [...] } }
```

Validation is strict Zod (`.strict()`): unknown fields, wrong severity enum
values, or wrong incident `type` return HTTP 400 `SCHEMA_VALIDATION_FAILED`.
Rate limit: 30 req/min per client IP with `Retry-After` on HTTP 429.

---

## 5. Judge Q&A One-Liners

- **"Why not just KQL in Sentinel?"** â€” KQL filters rows; campaign correlation needs recursive bipartite graph traversal (Union-Find). Quorum is the pre-correlation plane that streams incidents *back into* Sentinel â€” see the webhook above.
- **"Why is Lens 1 '1' here but '0' on your slide?"** â€” This laptop runs the 120-user demo corpus where the naive rule trips once on a loud brute-force decoy while missing the real campaign. The sealed 1,200-user flagship corpus measures a clean 0 vs 97 vs 1. Same comparators, both live-computed.
- **"Prove the ledger."** â€” Click Simulate Database Tamper; the badge flips to `TAMPER DETECTED at index 0` with no page reload.

---

*Last rehearsed: 2026-09-30 Â· Maintained by: OpenCode (Plan 5.3 execution)*

