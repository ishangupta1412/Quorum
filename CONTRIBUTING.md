# Contributing to Quorum

Thank you for your interest in contributing to Quorum. This document covers everything you need to know to contribute effectively.

---

## Development Prerequisites

- **Node.js** >= 20 — use `.nvmrc` with `nvm use` or `fnm use`
- **npm** >= 10

```bash
git clone https://github.com/yourusername/quorum.git
cd quorum
npm install
```

---

## Verification Loop

Every change must pass all three checks before a PR can be opened:

```bash
npm run typecheck   # Zero TypeScript errors (strict mode)
npm test            # 55/55 unit tests pass
npm run build       # Production build succeeds
```

These are also enforced in CI. A red CI = blocked PR, no exceptions.

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Always production-ready; protected; requires passing CI |
| `feat/<name>` | New feature work |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation only |
| `refactor/<name>` | Refactors without behaviour change |
| `test/<name>` | Test additions or fixes |

---

## Commit Convention

This repo follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`

Examples:
```
feat(detect): add F10 pivot confirmation within 2h window
fix(export): correct exportToCsv -> exportIncidentToCsv function name
test(engine): add red-team state-pollution invariant assertion
docs(readme): add forensics screenshot and architecture diagram
```

---

## Adding Detection Families

Detection families live in `src/detect/`. Each family must:

1. Have a pure TypeScript implementation with zero side-effects
2. Be deterministic — identical input must always produce identical output
3. Have at minimum: one happy-path test, one edge-case test, one red-team test
4. Be integrated into `runDetectionPipeline` in `src/detect/engine.ts`
5. Have its family ID documented in `README.md`'s Detection Families table

---

## Security Rules (Non-Negotiable)

- **Never** persist, log, or hash raw passwords or credential-shaped strings
- **Never** expose server secrets or service role keys to browser bundles
- **Always** validate API inputs with a Zod schema before processing
- **Always** append to the SHA-256 audit ledger for any state mutation

See `SECURITY.md` for the full policy.

---

## Pull Request Checklist

Before opening a PR, verify:

- [ ] `npm run typecheck` exits 0
- [ ] `npm test` exits 0 (all 55+ tests pass)
- [ ] No `any` types introduced without a comment explaining why
- [ ] No dead code or commented-out blocks left behind
- [ ] No TODOs — if it is important, open an issue
- [ ] Commit messages follow Conventional Commits
- [ ] PR description explains *what* and *why*, not just *how*

---

## Code of Conduct

This project adheres to the [Contributor Covenant](CODE_OF_CONDUCT.md). All contributors are expected to uphold it.

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
