# Quorum — Anti-Vibecoding & Production Quality Standard

## 1. The 30 Anti-Vibecoding Prohibitions
To win Microsoft Innovate 2026, Quorum must look and feel like an enterprise security operations terminal engineered by Microsoft security architects, not a vibe-coded landing page.

1. **NO Harsh Gradients:** Never use saturated linear or radial gradient backgrounds.
2. **NO Lucide Clichés:** Do not spray generic Lucide icons everywhere. Every icon must have specific semantic utility.
3. **NO Pure White Canvas:** Never use `#FFFFFF` as a background. Default is true-black `#000000`.
4. **NO Rainbow Color Palettes:** Restrict colors to semantic status tokens only.
5. **NO Exaggerated Drop Shadows:** Use 1px crisp borders (`rgba(255,255,255,0.08)`) instead of blurry box shadows.
6. **NO 3 Feature Cards in a Row:** Use real security data tables and time-series grids.
7. **NO Emojis in Data:** Machine data (IPs, hashes, equations) must never contain emojis.
8. **NO Heavy Liquid Glass:** Avoid heavy `backdrop-filter: blur(20px)` that hampers readability.
9. **NO Generic Bento Grids:** Layouts must serve the analyst workflow: triage list on the left, evidence inspection on the right.
10. **NO Fake Terminal Windows:** If showing shell output or logs, show real normalized `AuthEvent` data.
11. **NO "It's Not X, It's Y" Copy:** Use sober, direct technical descriptions.
12. **NO Cliché Checkmark Bullets:** Use tabular metrics or status chips.
13. **NO 3 Pricing Tiers:** This is a SOC tool, not SaaS landing page fluff.
14. **NO Mocked Unreactive Demos:** The demo runs real data through pure TypeScript detection algorithms.
15. **NO Puffy Pill Radii:** Use technical 4px / 6px border radii (`rounded-md`), never `rounded-full` for cards.
16. **NO Purple & Black Clichés:** Use true-black (`#000000`) and deep technical slate (`#080C14`).
17. **NO Missing Skeleton Loaders:** All asynchronous queries must show clean pulse skeletons.
18. **NO Radial Glow Orbs:** No fuzzy background glow circles.
19. **NO Dot Grid Overlays:** Keep the canvas clean and distraction-free.
20. **NO Sparkle Icons:** Do not use AI sparkle icons (`✨`) on deterministic security equations.
21. **NO Bouncing Animated Arrows:** Functional transitions only (150ms ease-out).
22. **NO Missing Privacy/Compliance Notices:** Include data retention and GDPR pseudonymization controls.
23. **NO Distracting Hover Flips:** Hover states must be subtle border highlights or opacity shifts.
24. **NO Neon Accents:** Use muted semantic tones (`#EF4444`, `#F59E0B`, `#10B981`, `#64748B`).
25. **NO Pastel Candy Colors:** Never use pastel pinks, lavenders, or baby blues.
26. **NO Unanchored Typography:** Always use JetBrains Mono for numbers, hashes, and IP addresses.
27. **NO Unhandled Loading States:** Every action button shows disabled/loading feedback.
28. **NO Silent Errors:** All error boundaries return structured, inspectable error codes.
29. **NO Fake Animation Delays:** Don't simulate artificial loading delays when computation is instant.
30. **NO Client-Side Trust:** All calculations and severity derivations run server-side or in pure functional modules.

---

## 2. Pre-Launch "Don't Get Sued" Checklist
- [x] Check data retention policies (auto-purge telemetry > 30 days)
- [x] Remove exposed API keys and secret service role tokens
- [x] Enforce server-side role validation (analyst vs admin)
- [x] Implement cryptographic tamper-evident audit logging
- [x] Sanitize user inputs with Zod schemas
- [x] Strip credentials and passwords at the normalization boundary
- [x] Rate limit public ingestion endpoints
- [x] Verify open source dependencies and licensing
- [x] Provide export capabilities in standard formats (Sentinel JSON, STIX 2.1)
