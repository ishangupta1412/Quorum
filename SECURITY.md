# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 4.x (main) | Yes — active development |
| < 4.0 | No — upgrade to main |

---

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

Report security issues privately via one of:

1. **GitHub Private Vulnerability Reporting** — use the "Report a vulnerability" button on the [Security tab](https://github.com/ishangupta1412/Quorum/security/advisories)
2. **Email** — contact the maintainer directly (see GitHub profile)

Include as much detail as possible:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

You will receive an acknowledgement within **48 hours** and a resolution timeline within **7 days**.

---

## Security Model

### Data Handling
- Raw authentication events are **stripped of any credential-shaped field** (`password`, `token`, `secret`, `key`, `credential`) before normalization — see `src/lib/normalise.ts`
- Stripped fields are never written to disk, logged, or included in hashes
- The canonical `AuthEvent` type has no password field by design

### Audit Integrity
- All state mutations are appended to the SHA-256 hash-chained audit ledger in `src/lib/audit/`
- The ledger is append-only and tamper-detectable in O(n)
- Ledger blocks are never deleted or modified post-write

### API Boundaries
- All server API inputs are validated with strict [Zod](https://zod.dev) schemas before processing
- Oversized payloads are rejected with a 413 before parsing
- Server-side secrets (e.g. Sentinel webhook tokens) are never sent to the browser

### Client Security
- No credentials, tokens, or secrets are stored in browser localStorage
- The audio mute preference stored in localStorage contains only `"true"` or `"false"`

---

## Threat Model

Quorum is a **detection demonstration tool** for Microsoft Innovate 2026. It operates on **synthetic corpus data only** — `generateSyntheticCorpus()` — not real production telemetry. Do not connect it to live authentication systems without a thorough security review.
