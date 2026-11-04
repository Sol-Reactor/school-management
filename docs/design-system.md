# Haya design system

The design system comes from the `ui-ux-pro-max` design skill. Its first,
generic result was rejected because it suggested a purple wellness palette with
"avoid dark mode". Domain searches for education/LMS colour, B2B SaaS typography
and chart guidance then shaped the choices below. Every colour pair is checked
against WCAG 2.1 AA, and the chart palette was validated for colour-vision
deficiency (CVD).

**Source of truth:** `school-frontend/src/index.css` holds the CSS variables, and
`school-frontend/tailwind.config.js` maps them to Tailwind utilities.

## Principles

- **Calm and trustworthy.** Flat surfaces, one brand hue, generous whitespace and
  no decorative motion. The audience is school staff and families, not a consumer app.
- **Information first.** Each dashboard shows the 3–4 numbers that matter, then the
  trend behind them, then what's coming next.
- **Never colour alone.** Status always carries an icon and a label, and charts
  carry legends, line textures and a table view.

## Themes

Five old themes (blue, purple, green, orange, dark) were replaced by **light and
dark plus a single accent**. Five palettes couldn't all be held to AA contrast, and
they made the product look inconsistent. Users choose Light, Dark or Match system,
and the choice is applied before first paint, so there's no flash.

## Colour tokens

Usage: `bg-surface`, `text-ink-muted`, `border-line-input`, `bg-primary/10`, and so on.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `canvas` | `#f8fafc` | `#0b1220` | app background |
| `surface` / `surface-muted` | `#ffffff` / `#f1f5f9` | `#131c2b` / `#1b2638` | cards, table headers |
| `line` | `#e2e8f0` | `#263247` | dividers (decorative) |
| `line-input` | `#7f8ca0` (3.4:1) | `#64748f` (3.6:1) | form-field borders (WCAG 1.4.11) |
| `ink` | `#0f172a` (17.9:1) | `#e2e8f0` (13.6:1) | body text |
| `ink-muted` | `#475569` (7.6:1) | `#a3b1c6` (8.0:1) | secondary text |
| `ink-subtle` | `#5b6b80` (5.4:1) | `#8a99b0` (5.9:1) | captions, hints |
| `primary` | `#0f766e` teal-700 | `#2dd4bf` teal-400 | buttons, active nav |
| `on-primary` | `#ffffff` (5.5:1) | `#042f2e` (7.8:1) | text on primary |
| `primary-ink` | `#0f766e` | `#5eead4` | links, teal text |
| `accent` | `#b45309` | `#fbbf24` | demo banner, rare highlights |
| `success` / `warning` / `danger` / `info` | `#15803d` / `#b45309` / `#b91c1c` / `#1d4ed8` | lighter steps | **reserved** for status |

Ratios are measured against `surface`. `ink-subtle` was stepped darker during
review because it measured only 4.3:1 on `surface-muted`.

### Chart palette

Fixed order, never cycled, and validated with the dataviz palette checker across
all pairs in both modes:

| Slot | Light | Dark |
| --- | --- | --- |
| 1 | `#0d9488` | `#0d9488` |
| 2 | `#eb6834` | `#d95926` |
| 3 | `#6250d6` | `#9085e9` |

Charts show at most three series. Multi-series lines also use dash patterns, a
legend and a table view.

## Typography

**Plus Jakarta Sans** is used for everything; the skill lists it as its "Friendly
SaaS" pairing for dashboards and B2B. Sizes are rem-based, so Settings → Text size
(100%, 112.5% or 125%) scales the whole UI.

| Token | Size / line height | Use |
| --- | --- | --- |
| `text-xs` | 12 / 16 | captions, table headers |
| `text-sm` | 14 / 20 | UI text, tables |
| `text-base` | 16 / 24 | body copy |
| `text-lg`, `text-xl` | 18, 20 | card titles |
| `text-2xl` / `3xl` | 24 / 30 | page titles |
| `text-4xl` to `6xl` | 36 to 60 | landing headings |

Numbers use `tabular-nums` (`.tabular`) so columns line up.

## Spacing, radius, elevation and layering

- **Spacing:** Tailwind's 4 px scale. Cards use `p-5`, page sections `gap-6`, and the
  page gutter is 16, 24 or 32 px.
- **Radius:** `sm` 6 · `md` 8 (controls) · `lg` 12 · `xl` 16 (cards) · `2xl` 20 (dialogs).
- **Shadow:** `xs` (cards), `sm`, `md` (popovers), `lg` (dialogs, toasts). In dark mode
  shadows are black and elevation comes mostly from surface steps.
- **z-index scale:** `dropdown` 20 · `sticky` 30 · `overlay` 40 · `modal` 50 · `toast` 60.

## Motion

- 150 ms (`fast`) for hovers, 200 ms for most transitions, 250 ms for drawers.
- Ease-out when entering and ease-in when exiting. No looping animation except
  loading indicators.
- `prefers-reduced-motion` and the in-app "Reduce motion" switch both reduce all
  durations to roughly 0.

## Components

These live in `src/components/ui/`:

- **Button:** primary, secondary, ghost, soft, danger and danger-ghost variants;
  `loading` state; icon-only buttons require an `aria-label`.
- **Field / Input / Select / Textarea:** always labelled. Hints and errors are linked
  with `aria-describedby`, errors set `aria-invalid` and are announced.
- **Modal / ConfirmDialog:** focus is trapped and returned to the trigger; Escape and
  the backdrop close it. ConfirmDialog focuses **Cancel** first for destructive actions.
- **DataTable:** search, sortable headers with `aria-sort`, a toolbar for filters,
  pagination, skeleton, empty and no-results states; scrolls horizontally on phones.
- **Skeleton / LoadingRegion:** used instead of spinners for page content.
- **EmptyState, Badge, Avatar, StatCard, Menu, Toast:** toasts use `role="status"` or
  `role="alert"` and pause while hovered or focused.

## Accessibility checklist

Enforced by `npm run ui:review`, which uses Playwright and axe-core:

- [x] WCAG 2.1 AA contrast in both themes
- [x] A skip link is the first Tab stop; focus is always visible (2 px teal outline)
- [x] Every control has a label; every icon-only button has an `aria-label`
- [x] Images have alt text; decorative SVGs are `aria-hidden`
- [x] Touch targets are at least 40 px (36 px for dense table actions)
- [x] No horizontal scroll at 375, 768 or 1440 px
- [x] Reduced motion is respected
