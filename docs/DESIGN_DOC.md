# Quorum — Design Document
**Analyst Cockpit · Microsoft Innovate 2026 · Redmond Labs**

> "Premium doesn't mean flashy. Premium means every pixel earns its place."

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Design System Tokens](#2-design-system-tokens)
3. [Typography System](#3-typography-system)
4. [Semantic Color — Severity Only](#4-semantic-color--severity-only)
5. [Motion Budget](#5-motion-budget)
6. [Component Library Mapping](#6-component-library-mapping)
7. [Screen-by-Screen UX Flow](#7-screen-by-screen-ux-flow)
8. [Anti-Vibecode Checklist](#8-anti-vibecode-checklist)
9. [Accessibility Bar](#9-accessibility-bar)
10. [UI Reference Sources](#10-ui-reference-sources)
11. [Spline 3D Elements](#11-spline-3d-elements)
12. [Responsive and Mobile](#12-responsive-and-mobile)

---

## 1. Design Philosophy

Quorum is a **security operations tool**, not a marketing site. The design must:

- **Earn trust instantly** — judges are Microsoft security architects who can smell fake data
- **Communicate precision** — every number must look like it was computed, not typed
- **Stay out of the analyst's way** — the data is the hero, not the UI

### Core Aesthetic: "Dark Intelligence Terminal"

| Principle | Implementation |
|---|---|
| True-black canvas | `#000000` base — real darkness, not dark gray |
| Technical surfaces | `#080C14` cards/panels — deep technical slate |
| 1px rule borders | `rgba(255,255,255,0.08)` — subtle, not heavy blur |
| Machine-data font | `JetBrains Mono` for IPs, hashes, equations |
| Zero decorative motion | Every animation must earn its place functionally |
| Severity = only semantic color | Never use red/amber/green for decoration |

---

## 2. Design System Tokens

```css
/* === CANVAS === */
--color-base:           #000000;
--color-surface:        #080C14;
--color-surface-raised: #0D1220;
--color-border:         rgba(255,255,255,0.08);
--color-border-active:  rgba(255,255,255,0.20);

/* === SEVERITY (semantic ONLY — never decorative) === */
--color-critical:       #DC2626;
--color-critical-muted: rgba(220,38,38,0.15);
--color-warning:        #D97706;
--color-warning-muted:  rgba(217,119,6,0.15);
--color-safe:           #059669;
--color-safe-muted:     rgba(5,150,105,0.15);
--color-info:           #6B7280;
--color-info-muted:     rgba(107,114,128,0.15);

/* === TEXT === */
--text-primary:         rgba(255,255,255,0.95);
--text-secondary:       rgba(255,255,255,0.60);
--text-tertiary:        rgba(255,255,255,0.35);
--text-machine:         #A5F3FC;   /* Cyan — IPs, hashes */
--text-equation:        #FDE68A;   /* Amber-yellow — severity equation */

/* === SPACING (8px grid) === */
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
--space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px;

/* === RADIUS === */
--radius-sm: 4px;   /* data rows */
--radius-md: 8px;   /* cards */
--radius-lg: 12px;  /* modals */
/* NO pill radius except badges */

/* === TRANSITIONS === */
--ease-functional: cubic-bezier(0.4, 0, 0.2, 1);
--duration-base:   150ms;   /* DEFAULT */
--duration-slow:   200ms;   /* MAX for hero animations */
```

---

## 3. Typography System

```css
/* Google Fonts import */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* Geist: built into Next.js — install: npm i geist */

--font-display: 'Geist', 'Space Grotesk', sans-serif;
--font-body:    'Space Grotesk', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

| Token | Size | Weight | Use |
|---|---|---|---|
| `--text-hero` | 56px | 700 | Landing contrast numbers (0 / 97 / 1) |
| `--text-h1` | 32px | 600 | Page titles |
| `--text-h2` | 24px | 600 | Section headers |
| `--text-body` | 15px | 400 | Body, table rows |
| `--text-small` | 13px | 400 | Labels, captions |
| `--text-mono-base` | 14px | 400 | IPs, hashes, raw data |
| `--text-mono-equation` | 16px | 500 | Severity equation |

> **Rule:** Every IP address, SHA-256 hash, event hash, and severity equation **must** render in `JetBrains Mono`. No exceptions.

---

## 4. Semantic Color — Severity Only

| Severity | Range | Color | Hex |
|---|---|---|---|
| **Critical** | 80–100 | Crimson | `#DC2626` |
| **High** | 60–79 | Orange | `#EA580C` |
| **Medium** | 40–59 | Amber | `#D97706` |
| **Low / Info** | 0–39 | Slate | `#6B7280` |
| **Resolved** | — | Emerald | `#059669` |

> Never use these colors for success toasts, button states, loading bars, or decorative gradients. Color blindness + overuse = trust erosion.

---

## 5. Motion Budget

| Animation | Max Duration | Rule |
|---|---|---|
| Hover states | 100ms | CSS transition |
| Panel open/close | 150ms | Ease-out |
| Hero number ticker | 800ms total | animate-ui counter |
| Realtime list insert | 200ms | CSS transform |
| Skeleton fade | 150ms | CSS opacity |
| **Hero animations per screen** | **Max 1** | Never loop |
| Decorative pulse/loop | **BANNED** | Always |

---

## 6. Component Library Mapping

### 6.1 21st.dev

| UI Element | Component | Bound To |
|---|---|---|
| Global nav | Cmd+K command menu | Jump by incident ID, verify chain, role switch |
| Hero contrast | Animated counter / rolling-digit ticker | 3 live DB queries |
| Incident queue (F15) | Sortable expandable data table | `incidents` Realtime |
| Queue updates | Animated list / slide-in cards | Supabase INSERT push |
| Audit ledger (F21) | Connected block/rail timeline | `audit_ledger` rows |
| Metrics (F22) | Asymmetric stat panel grid | Gate-runner output |
| Tuning (F14) | Dual-range slider + metric table | Pack A re-evaluation |
| Exports (F25) | Download button + JSON preview popover | Export files |
| Loading | Skeleton loaders | Every async fetch |
| Verdict staging | Toast notification | `submit_verdict` RPC |

### 6.2 OriginKit.dev

| Element | Component | Use |
|---|---|---|
| Evidence citation chips | Tag / badge chip | Links to `event_hash` |
| Incident detail | Expandable card + metadata strip | Severity + MITRE tags |
| F1 ingest | Drag-and-drop upload zone | Parse progress indicator |
| Role switcher | Avatar dropdown with role badge | analyst / admin toggle |

### 6.3 Inspira UI

| Element | Component | Use |
|---|---|---|
| Landing hero | Beam / spotlight effect | Behind contrast numbers |
| Campaign graph | Network/node diagram | F7 bipartite visualization |
| Audit chain | Animated connecting line | Hash chain visual |
| Metrics cards | Glowing border card | F22 dashboard panels |

### 6.4 Animate UI

| Element | Component | Use |
|---|---|---|
| Contrast ticker | Number counter animation | Core demo beat at 0:20 |
| Severity score | Counting number | Incident score reveal |
| Pipeline status | Progress step indicator | Ingest job stages |

### 6.5 Lenis (Smooth Scroll)

```bash
npm install lenis
```

```typescript
// app/layout.tsx
import Lenis from 'lenis'
useEffect(() => {
  const lenis = new Lenis({ duration: 1.2 })
  const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf) }
  requestAnimationFrame(raf)
  return () => lenis.destroy()
}, [])
```

> Use on landing/hero only. Do NOT use on incident queue table — breaks `j`/`k` keyboard nav.

---

## 7. Screen-by-Screen UX Flow

### Screen 1 — Landing Hero

```
┌──────────────────────────────────────────────────────┐
│  [QUORUM]                         [ANALYST] [Cmd+K]  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Every alert needs evidence.                         │
│  Every incident needs independent agreement.         │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐         │
│  │    0     │   │    97    │   │    1     │         │
│  │ Naive    │   │ Loosened │   │ Quorum   │         │
│  │ alerts   │   │ flood    │   │ CRITICAL │         │
│  └──────────┘   └──────────┘   └──────────┘         │
│     Animated counter — computed live from DB         │
│                                                      │
│              [ Run Detection → ]                     │
│                                                      │
└──────────────────────────────────────────────────────┘
```

Empty state: "Corpus not yet ingested — upload a log file to begin"

---

### Screen 2 — Incident Queue (F15)

```
┌──────────────────────────────────────────────────────┐
│ OPEN INCIDENTS [3]    A2TP: 1.5   24h events: 11,768 │
├──────────────────────────────────────────────────────┤
│ SEVERITY  LAST SEEN  ENTITY           FAMILIES       │
│ [CRITICAL] 4m ago    campaign_A4     GRAPH·PIVOT     │
│ [HIGH]    12m ago    user:jsmith     RULE·GRAPH      │
│ [MEDIUM]   1h ago    ip:192.168.1.5  ML·RULE         │
├──────────────────────────────────────────────────────┤
│ Contrast: [Naive: 0] [Loosened: 97] [Quorum: 3]     │
└──────────────────────────────────────────────────────┘
```

Keyboard: `j`/`k` navigate, `Enter` open, `Esc` close

---

### Screen 3 — Incident Detail (F16)

```
┌──────────────────────────────────────────────────────┐
│ ← Back  INCIDENT #A4-001  [CRITICAL]  [Stage Action] │
├──────────────────────────────────────────────────────┤
│ SEVERITY EQUATION (JetBrains Mono, amber-yellow)     │
│ Base 100 (F10_pivot) × 1.00 (2 families: GRAPH,     │
│ PIVOT) + 15 (auth success) → PIVOT floor 80 →       │
│ clipped 100 [CRITICAL]                               │
│                                                      │
│ EVIDENCE TIMELINE ──────────────────────────────    │
│ [●]────[●]────[●]────[●]────[●]                     │
│ T-5d   T-3d   T-1d   T-4h   NOW                     │
│                                                      │
│ RAW EVIDENCE [1,888 events]  [Page 1/19]             │
│ Hash              User      IP           Outcome     │
│ a3f9c2... [↗]    jsmith    45.x.x.x    failure      │
└──────────────────────────────────────────────────────┘
```

Every `[↗]` chip links to the exact `event_hash` DB row.

---

### Screen 4 — Audit Ledger (F21)

```
┌──────────────────────────────────────────────────────┐
│ AUDIT LEDGER                [Verify Chain] [Tamper*] │
│                          *only in DEMO_MODE          │
├──────────────────────────────────────────────────────┤
│ [#1]── sha256: a3f9c2d1...                           │
│  │                                                   │
│ [#2]── sha256: b7e4a91f...  ← CHAIN BROKEN ⚠️       │
│  │     (tamper-demo click triggers this visual)      │
│ [#3]── sha256: c2d8f3a0...                           │
└──────────────────────────────────────────────────────┘
```

---

### Screen 5 — Quality Gates (F22)

```
┌──────────────────────────────────────────────────────┐
│ QUALITY GATES   [Pack B · sha256: 1337...] [SEALED]  │
├────────────┬──────────┬──────────┬───────────────────┤
│ Campaign   │ A2TP     │ Event F1 │ Clean FP          │
│ Recall     │          │          │                   │
│ [100%] ✅  │ [1.5] ✅ │ [0.92]✅ │ [0] ✅            │
│ Gate: ≥92% │ Gate:≤3  │ Gate:≥.87│ Gate: ≤3          │
├──────────────────────────────────────────────────────┤
│ ⚠️ LIMITATIONS — cannot be dismissed by any role     │
│ "Metrics measured against synthetic labeled corpus   │
│  — not validated against live enterprise networks."  │
└──────────────────────────────────────────────────────┘
```

---

## 8. Anti-Vibecode Checklist

### Banned Patterns

| Pattern | Alternative |
|---|---|
| Harsh gradients (purple → black) | Solid `#000000` + 1px borders |
| Generic Lucide icons everywhere | Purposeful — max 1 icon per action |
| Pure white `#ffffff` background | True black + `#080C14` surfaces |
| Rainbow decorative colors | 4 severity colors only |
| Drop shadows on everything | 1px `rgba(255,255,255,0.08)` borders |
| 3 feature cards in a row | Asymmetric stat grid for real data |
| Emoji in UI copy | Zero emoji in product |
| Bento grids | Structured data tables |
| Radial orbs / dot grids | Clean dark canvas |
| Purple + black decoratively | Severity use only |
| No skeleton loaders | Always skeleton every fetch |
| Neon glows | Subtle muted severity backgrounds |
| Hover animations > 200ms | Cap at 150ms |

### Required Checks

- [ ] Every number traces to a real DB query
- [ ] JetBrains Mono on all machine data
- [ ] Skeleton loaders on every async fetch
- [ ] Empty states are designed and instructive
- [ ] Severity pill always has text label
- [ ] Equation block in amber-yellow color
- [ ] No layout shift when data loads
- [ ] `j`/`k` keyboard nav on queue
- [ ] Anti-DoS footer line on every screen
- [ ] Limitations panel cannot be dismissed

---

## 9. Accessibility Bar

**Target:** Lighthouse Accessibility ≥ 90

| Requirement | Implementation |
|---|---|
| Severity not color-only | Color + text label on every severity pill |
| Keyboard nav | `j`/`k` rows, `Enter` open, `Esc` close |
| ARIA on equations | `aria-label="Severity equation: ..."` |
| Focus visible | `outline: 2px solid rgba(255,255,255,0.5)` |
| Live updates | `aria-live="polite"` on queue container |
| Color contrast | ≥ 4.5:1 all body text |
| Tab order | Logical DOM order only |
| Reduced motion | Disable all transitions via media query |

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. UI Reference Sources

| Source | URL | What to use |
|---|---|---|
| **21st.dev** | https://21st.dev | Command palette, data tables, counters, skeletons |
| **OriginKit.dev** | https://originkit.dev | Badge chips, expandable cards, upload zones |
| **Inspira UI** | https://inspira-ui.com | Beam effects, glowing borders, node diagrams |
| **Animate UI** | https://animate-ui.com | Number counters, step indicators |
| **Lenis** | https://github.com/darkroomengineering/lenis | Smooth scroll |
| **Skipper UI** | https://skipperui.com | Navigation, command structures |
| **Spline** | https://spline.design | 3D ambient hero element |

---

## 11. Spline 3D Elements

```bash
npm install @splinetool/react-spline @splinetool/runtime
```

```tsx
// Landing hero — ambient background only, not interactive
import Spline from '@splinetool/react-spline'

export function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
      <Spline scene="https://prod.spline.design/[YOUR-SCENE-ID]/scene.splinecode" />
    </div>
  )
}
```

Recommended: abstract particle/graph network scene — reinforces bipartite graph concept.

**Performance rule:** If FCP > 2s on the presenting laptop, remove it. Data wins over effect.

---

## 12. Responsive and Mobile

| Breakpoint | Layout | Priority |
|---|---|---|
| ≥1280px desktop | Full cockpit — all panels | **Primary** |
| 1024–1279px | Collapsed sidebar, full table | Secondary |
| 768–1023px | Single-column, bottom nav | Fallback |
| < 768px | Read-only view | Emergency |

> Design for `~1536px` effective viewport (1920×1080 projector at 125% zoom). Test this first.

### Mobile Test Checklist
- [ ] 375px (iPhone 14)
- [ ] 768px (iPad)
- [ ] Slow 3G (Chrome DevTools)
- [ ] 125% browser zoom (projector simulation)
- [ ] No horizontal scroll

---

*Quorum Design Document — Redmond Labs · Microsoft Innovate 2026 · v1.0*
