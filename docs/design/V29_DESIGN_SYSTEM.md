# ECONEX V29.0 — Visual Design System

**Product:** ECONEX — Universal Economic Operating System  
**Attribution:** Developed under VINEXSAH TECHNOLOGIES. All rights reserved.

---

## 1. Colour Palette & Elevation Hierarchy

ECONEX preserves its signature sovereign obsidian-and-gold visual language across all screens while refining surface separation and contrast compliance (`WCAG AA` minimum across body and muted metadata):

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| Primary Background | `#050505` | Root page canvas and viewport backdrop |
| Elevated Card Surface | `#121212` | Primary workspace cards, sidebars, bottom navigation, dialogs |
| Interactive Control Surface | `#181818` | Inputs, secondary buttons, filter controls, nested well surfaces |
| Gold Brand Accent | `#D4AF37` | Primary CTAs, active nav highlights, key financial figures, active indicators |
| Gold Hover State | `#e5bf43` | Primary CTA hover fill |
| Metallic Accent | `#C0C0C0` | High-priority secondary accents and icons |
| Primary Text | `#F5F5F5` | Headings, card titles, primary numeric values |
| Secondary Body Text | `#C0C0C0` | Descriptive copy, form labels, step text |
| Muted Metadata Text | `#A0A0A0` | Subtitles, timestamps, subtle inline metadata |
| Structural Border | `#27272a` | 1px subtle separators and container edges |
| Semantic Positive | `emerald-400` | Verified status, settled payments, delivered steps |
| Semantic Pending / Review | `#D4AF37` / `amber-300` | Pending confirmation, sandbox mode notices, in-transit tracking |
| Semantic Critical | `red-400` | Errors, cancelled/disputed orders, failed sync warnings |

**Depth Policy:**
- Single subtle card border (`1px solid #27272a`) with generous internal padding (`p-5` / `p-6`) and clean vertical separation (`space-y-6`).
- Zero stacked heavy drop-shadows, zero neon glows, and zero full-bleed background textures on forms or tables.

---

## 2. Typography & Numeric Discipline

- **Display Headings:** `Space Grotesk` (`font-display`) — clean geometric authority for titles (`text-2xl` to `text-4xl`).
- **Body & UI Controls:** `Inter` (`font-sans`) — clear legibility across high-density dashboards and low-literacy mobile screens (`14px–16px` base; `17px` / `19px` accessible text scales supported).
- **Technical Identifiers:** `Source Code Pro` (`font-mono`) — reserved strictly for order codes (`#ORD-...`), permanent wallet EUWN (`EX-...`), transaction hashes, and administrator system diagnostics. Never surfaced as decorative labels on ordinary consumer navigation cards.
- **Tabular Figures (`tabular-nums`):** Enforced across every currency balance, unit price, order quantity, percentage, and summary stat so numbers align vertically.

---

## 3. Spacing, Layout Grids & Responsive Rules

- **Desktop Workspace Grid:** Max-width `1440px` shell (`px-4 sm:px-6 lg:px-8`), collapsible sidebar (`64px` icon rail or `272px` organized domain drawer), sticky compact `64px` top header.
- **Mobile-First Layout (`375px`+):**
  - Single-column responsive stacking (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
  - Bottom sticky navigation (`h-16` / `64px`, strictly `<= 15%` of `667px+` mobile height) with 5 focused destinations: `Home`, `Explore`, `My Activity`, `Tasks`, `Menu`.
  - Minimum interactive tap target height: `44px` (`min-h-[44px]`). Zero cramped micro-links.

---

## 4. Scrims, Media Framing & Zero-Pill Discipline

- **Photographic Hero & Sector Cards:** Measured bottom-up dark scrim (`from-[#050505]/90 via-[#050505]/40 to-transparent`) guarantees crisp `>= 4.5:1` contrast for white/gold text over any photograph without dulling the top visual highlight.
- **Zero-Pill Metadata Policy:** Category, location, and timestamps render as clean inline typography separated by subtle middots (`·`), reserving rounded bordered pills exclusively for interactive `<button>` filter toggles.
- **Zero-Broken-Image Policy:** All imagery uses `<EconexImage />` (`referrerPolicy="no-referrer"`, descriptive `alt`, `loading="lazy"`, Low-Data toggle awareness, and styled fallback graphic).
