# Design

Visual system for **Slate**. Seed version — written pre-implementation from a clear brief. Re-run `/impeccable document` once the UI exists to capture the real tokens.

## Theme & Mood

Confidently dark by default, with a light counterpart. The reference points are Obsidian and Linear: an engineered, near-black neutral surface with a faint cool cast, fine hairline borders, and a single warm accent — **amber/gold** — that carries every meaningful action and state. Nothing decorative. The chrome is quiet graphite; the one warm note is the accent and the writing caret. Color strategy: **Restrained** — tinted-neutral surfaces plus one accent, accent ≤10% of the surface.

**Scene sentence:** a developer at a dim desk after hours, IDE open on one side, dropping a decision into Slate and switching projects without looking — the app has to read instantly in low light and never flare brightness in their face. That forces dark-default and a low-luminance base.

## Signature

The distinctive, restrained detail that makes it unmistakably Slate: **monospaced metadata in IBM Plex Mono.** All structural/secondary text — project tags, note counts, timestamps, breadcrumb path, word count, keyboard hints — is set in IBM Plex Mono at a small size, while UI and content use the native system sans (SF Pro). Plex Mono is the one face carrying personality, so it earns being a bundled webfont; everything else rides the system stack, which is the most native and snappy choice for a Mac app (and deliberately avoids the overused Inter/Geist look). This pairs an engineered "terminal" voice against clean prose, signals the keyboard-first nature of the tool, and costs nothing in attention. The amber accent appears as a 2px caret and a thin active-item indicator, never as fills of large areas.

## Color

OKLCH throughout. Two themes; tokens are semantic and flip by `[data-theme]`. Dark is `:root` default.

### Dark (default)

| Token | OKLCH | Role |
|---|---|---|
| `--bg` | `oklch(0.16 0.006 255)` | App background (deepest) |
| `--surface` | `oklch(0.20 0.006 255)` | Sidebar, toolbars, panels |
| `--elevated` | `oklch(0.24 0.007 255)` | Popovers, menus, hover surfaces |
| `--border` | `oklch(0.29 0.008 255)` | Hairline dividers, control borders |
| `--border-strong` | `oklch(0.36 0.009 255)` | Focus rings (neutral), emphasized edges |
| `--ink` | `oklch(0.94 0.004 255)` | Primary text |
| `--ink-muted` | `oklch(0.70 0.006 255)` | Secondary text, metadata (≥4.5:1 on `--bg`) |
| `--ink-faint` | `oklch(0.56 0.006 255)` | Disabled, placeholders (use only on large/secondary) |
| `--accent` | `oklch(0.80 0.135 80)` | Amber/gold — caret, active indicator, links, focus |
| `--accent-hover` | `oklch(0.84 0.14 80)` | Accent hover |
| `--accent-fill-ink` | `oklch(0.18 0.02 80)` | Text/icon on an amber fill (dark-on-amber) |

### Light

| Token | OKLCH | Role |
|---|---|---|
| `--bg` | `oklch(0.985 0.003 255)` | App background — cool off-white, NOT cream |
| `--surface` | `oklch(0.96 0.004 255)` | Sidebar, toolbars, panels |
| `--elevated` | `oklch(0.995 0.002 255)` | Popovers, menus |
| `--border` | `oklch(0.90 0.005 255)` | Hairline dividers |
| `--border-strong` | `oklch(0.82 0.007 255)` | Emphasized edges |
| `--ink` | `oklch(0.24 0.01 255)` | Primary text |
| `--ink-muted` | `oklch(0.46 0.01 255)` | Secondary text, metadata (≥4.5:1 on `--bg`) |
| `--ink-faint` | `oklch(0.60 0.008 255)` | Disabled, placeholders |
| `--accent` | `oklch(0.62 0.14 72)` | Deeper amber so accent-as-text hits AA on light |
| `--accent-hover` | `oklch(0.56 0.145 72)` | Accent hover |
| `--accent-fill-ink` | `oklch(0.99 0.01 80)` | Text/icon on an amber fill (light-on-amber) |

### Semantic states (both themes, accent excluded)

`--success oklch(~0.72 0.15 150)`, `--warning oklch(~0.80 0.14 75)`, `--danger oklch(~0.64 0.20 25)`, `--info` = `--accent`. Tune luminance per theme to keep ≥4.5:1 for text use. States color icons/text/borders, never large fills.

**Contrast checked:** `--ink-muted` is the metadata workhorse and must clear 4.5:1 on `--surface` (not just `--bg`) in both themes — verify in the browser, bump toward `--ink` if close.

## Typography

One system sans + one bundled mono. No display face — product UI doesn't pair display/body.

- **Sans (content + UI):** native system stack — `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui`. Headings, body, buttons, labels. Renders as SF Pro on macOS: native, zero load, non-generic.
- **Mono (signature metadata + code):** IBM Plex Mono (weights 400/500/600). Tags, counts, timestamps, paths, keyboard hints, and all code snippets/blocks.
- Bundle Plex Mono locally (@fontsource) — native app, no CDN/network for fonts. The sans needs no bundling; it's the OS font.

Fixed rem scale (product UI, not fluid), ratio ~1.2:

| Step | Size | Use |
|---|---|---|
| `--text-xs` | 0.75rem | Metadata, mono labels, hints |
| `--text-sm` | 0.8125rem | Secondary UI, dense lists |
| `--text-base` | 0.9375rem | Body / note content, UI default |
| `--text-lg` | 1.125rem | Note title, section headers |
| `--text-xl` | 1.375rem | Project header |
| `--text-2xl` | 1.75rem | Largest in-app heading (rare) |

Body line length capped 65–75ch in the writing surface. Line-height 1.6 for prose, 1.4 for UI, 1.0–1.2 for mono labels.

## Spacing & Radius

- **Spacing:** 4px base — `4, 8, 12, 16, 24, 32, 48`. Vary for rhythm; dense in nav, generous in the editor.
- **Radius:** `--r-sm 4px` (inputs, tags), `--r-md 6px` (buttons, menu items — default), `--r-lg 10px` (panels, popovers). Modest, engineered — never pill-shaped except a deliberate toggle.
- **Borders:** 1px hairlines (`--border`) are the primary separator language. No side-stripe accents.

## Motion

- 150–250ms; `ease-out-quint` (`cubic-bezier(0.22, 1, 0.36, 1)`). No bounce/elastic.
- Motion conveys state only: project switch crossfade, menu/popover open, active-indicator slide, save/feedback pulse. No page-load choreography.
- The active-item amber indicator may *slide* between items (a single tasteful shared-element move) — the one place motion is allowed a small flourish.
- **Reduced motion:** every transition has a `@media (prefers-reduced-motion: reduce)` instant/crossfade fallback.

## Components

Standard, consistent vocabulary across the app (earned familiarity beats invention):

- Every interactive control ships all states: default, hover, focus (visible ring using `--accent` or `--border-strong`), active, disabled, loading, selected.
- **Buttons:** primary = amber fill + `--accent-fill-ink`; secondary = surface + hairline border; ghost = transparent → `--elevated` on hover.
- **Editor-first shell + floating glass nav.** v2 hands the whole window to the editor (centered to a single `--editor-col` column) and replaces the persistent sidebars with one **floating Liquid Glass bar** pinned bottom-center — the global "project → project, note → note" control. It carries the brand mark, a project navigator and a note navigator (each opening its list in an upward glass popover that reuses `Sidebar`/`NoteList` verbatim), prev/next note steppers with a live `idx/total` counter, the primary new-note action, and the theme toggle. Shortcuts: ⌘⇧P projects, ⌘K notes, Escape closes. See **Navigation material** below.
- Empty states teach (how to create a project/note, key shortcut), never blank "nothing here".
- Loading uses skeletons, not center spinners. Native macOS scrollbars — don't reinvent.
- Modals are a last resort; prefer inline + popover. Rename, move, and create flow inline where possible.

## Navigation material — Liquid Glass

The floating nav is the one place glass is intentional, not decorative (it floats *over* the editor and must read as a distinct layer that refracts the content beneath it — the textbook justified use). Tokens are theme-aware and live in `styles.css` (`--glass`, `--glass-strong` for reading-heavy popovers, `--glass-edge`, `--glass-sheen`, `--glass-hover`, `--glass-blur`, `--glass-shadow`, `--accent-glow`). Recipe: translucent fill + `backdrop-filter: blur() saturate(180%)`, a hairline `--glass-edge`, an inset top `--glass-sheen` rim, a layered drop `--glass-shadow`, and a soft diagonal gloss via `::before`. A `@supports not (backdrop-filter)` fallback swaps to the opaque `--glass-strong`. A barely-there `--ambient` glow on `.app::before` gives the glass something to pick up; it stays far below text-contrast thresholds. Amber stays the single accent — the new-note button (with `--accent-glow`) and active navigators only.

## Z-index scale

`--z-dropdown: 100`, `--z-sticky: 200`, `--z-scrim: 240`, `--z-floatbar: 250`, `--z-pop: 260`, `--z-modal-backdrop: 300`, `--z-modal: 400`, `--z-toast: 500`, `--z-tooltip: 600`. No arbitrary 9999. (The popover scrim sits *below* the bar so the bar stays interactive; delete-confirm modals still layer above the popovers.)

## Bans (enforced)

Generic-AI/SaaS look, gradient text, cream/sand body bg, side-stripe borders, hero-metric template, identical card grids, per-section uppercase eyebrows, numbered section markers. Corporate-sterile gray is equally out. **Glassmorphism is permitted in exactly one place — the floating navigation material above — and nowhere else** (no glass cards, glass modals, or glass-for-flavor).
