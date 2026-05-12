---
name: crate-web
description: Authoring and publishing UI for Crate — package your ATProto records for your PDS.
colors:
  # Warm-tinted paper neutrals (chroma toward sap-green hue, ~95deg)
  paper-0: "oklch(99.5% 0.003 95)"
  paper-50: "oklch(98% 0.005 95)"
  paper-100: "oklch(95% 0.006 95)"
  paper-200: "oklch(91% 0.008 95)"
  paper-300: "oklch(84% 0.009 95)"
  paper-400: "oklch(70% 0.009 95)"
  paper-500: "oklch(55% 0.009 95)"
  paper-600: "oklch(42% 0.009 95)"
  paper-700: "oklch(30% 0.009 95)"
  paper-800: "oklch(20% 0.010 95)"
  paper-900: "oklch(14% 0.010 95)"
  ink: "oklch(13% 0.012 145)"
  # Sap-green accent (low chroma, tool color)
  sap-50: "oklch(96% 0.025 145)"
  sap-100: "oklch(92% 0.045 145)"
  sap-200: "oklch(84% 0.070 145)"
  sap-300: "oklch(72% 0.095 145)"
  sap-400: "oklch(60% 0.110 145)"
  sap-500: "oklch(48% 0.115 145)"
  sap-600: "oklch(40% 0.105 145)"
  sap-700: "oklch(32% 0.090 145)"
  sap-800: "oklch(24% 0.070 145)"
  sap-900: "oklch(18% 0.050 145)"
  # State colors (used <5%, paper-tinted, never decorative)
  brick: "oklch(50% 0.180 28)"
  amber: "oklch(70% 0.130 80)"
  graphite: "oklch(50% 0.080 235)"
  # Dark companion (warm-tinted deep paper for prefers-color-scheme:dark)
  dark-paper-50: "oklch(92% 0.004 95)"
  dark-paper-100: "oklch(86% 0.005 95)"
  dark-paper-200: "oklch(76% 0.005 95)"
  dark-paper-300: "oklch(62% 0.005 95)"
  dark-paper-400: "oklch(48% 0.006 95)"
  dark-paper-500: "oklch(34% 0.007 95)"
  dark-paper-600: "oklch(26% 0.006 95)"
  dark-paper-700: "oklch(20% 0.006 95)"
  dark-paper-800: "oklch(16% 0.005 95)"
  dark-paper-900: "oklch(12% 0.005 95)"
typography:
  display:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.75rem, 1.4rem + 1.5vw, 2.25rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.008em"
  body:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  editor-body:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0"
  label:
    fontFamily: "'IBM Plex Sans', system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
  meta:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'JetBrains Mono', Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0"
rounded:
  sharp: "0"
  xs: "2px"
  sm: "4px"
  md: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
  page-margin: "clamp(16px, 4vw, 64px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper-50}"
    rounded: "{rounded.xs}"
    padding: "10px 18px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.paper-800}"
    textColor: "{colors.paper-50}"
    rounded: "{rounded.xs}"
    padding: "10px 18px"
  button-secondary:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "10px 18px"
    typography: "{typography.label}"
  button-secondary-hover:
    backgroundColor: "{colors.paper-100}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "10px 18px"
  button-accent:
    backgroundColor: "{colors.sap-500}"
    textColor: "{colors.paper-50}"
    rounded: "{rounded.xs}"
    padding: "10px 18px"
    typography: "{typography.label}"
  button-accent-hover:
    backgroundColor: "{colors.sap-600}"
    textColor: "{colors.paper-50}"
    rounded: "{rounded.xs}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper-700}"
    rounded: "{rounded.xs}"
    padding: "10px 14px"
    typography: "{typography.label}"
  button-ghost-hover:
    backgroundColor: "{colors.paper-100}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.paper-800}"
    rounded: "{rounded.xs}"
    padding: "20px 24px"
  input:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "10px 12px"
    typography: "{typography.body}"
  input-focus:
    backgroundColor: "{colors.paper-0}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "10px 12px"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.paper-600}"
    rounded: "{rounded.sharp}"
    padding: "0"
    typography: "{typography.meta}"
  filter-tab:
    backgroundColor: "transparent"
    textColor: "{colors.paper-600}"
    rounded: "{rounded.sharp}"
    padding: "8px 0"
    typography: "{typography.label}"
  filter-tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sharp}"
    padding: "8px 0"
---

# Design System: crate-web

## 1. Overview

**Creative North Star: "The Quiet Workshop"**

crate-web is a tool. Not a product, not a platform, not a feed. A tool sitting on a clean workbench in good light: the writing surface in the center, controls within reach but out of view, every interface decision pulling weight away from itself toward whatever the maker is currently making.

The system rejects three default reflexes at once: the corporate-SaaS reflex (teal, illustrations, rounded everything, friendly cartoons), the editorial-magazine reflex (cream paper, single decorative serif, oversized drop cap, Substack-admin polish), and the AI-coded-landing reflex (glass cards, gradient text, dark-mode-with-neon). What's left is honest workshop typography on warm paper, sap-green as a single tool color used sparingly, sharp corners, no shadows, and IBM Plex carrying both the chrome and the body in two registers. The chrome is the doorframe; the content is the room.

**Key Characteristics:**

- **Warm paper, ink type.** Page surface is a slightly warm off-white tinted toward the accent hue. Body text is a deep paper-toned near-black, never `#000`.
- **One tool color.** Sap green appears on focused fields, the publish action, and inline links. Nothing else. Less than 10% of any screen.
- **Plex in two registers.** IBM Plex Sans for chrome and UI. IBM Plex Mono for the editor body, slugs, timestamps, AT-URIs, and any "data being worked on" surface.
- **Sharp corners.** Buttons, cards, inputs default to 2px or zero. Workshop tools don't have soft edges.
- **Flat by default.** No box-shadows anywhere. Depth is conveyed through 1px hairline borders and tonal layering on paper.
- **Compact interior, generous edges.** Dense lists and metadata frame the central content; outer page margin scales 16px → 64px with viewport.
- **Mono as content, not just code.** Notes are markdown — markdown is read better in mono. The editor body, slug display, URIs, timestamps, and tags all live in Plex Mono. Mono is a serious voice here, not decoration.

## 2. Colors: The Warm-Paper-and-Sap Palette

A two-axis palette: a 10-step warm paper scale (neutrals tinted toward the sap hue at very low chroma) and a 10-step sap green scale (low-chroma forest green used as a workshop tool color). Three state colors (brick / amber / graphite) appear in errors, warnings, and informational accents — never as decoration. A warm dark companion is provided for `prefers-color-scheme: dark` and explicit user choice.

### Primary

- **Sap Green** (`oklch(48% 0.115 145)` → `sap-500`): Single accent. Used on the focused field outline, the publish/confirm button, inline links inside running prose, and the "active" state of filter tabs. **Less than 10% of any rendered screen.**

### Neutral — Warm Paper

- **Paper White** (`oklch(99.5% 0.003 95)` → `paper-0`): True surface for cards, inputs, and the page-like editor column. Warmer than `#fff`.
- **Paper** (`oklch(98% 0.005 95)` → `paper-50`): Page background. The off-white the rest of the system sits on.
- **Paper Subtle** (`oklch(95% 0.006 95)` → `paper-100`): Subtle background tint for hover, code-block fills, ghost-button hover states.
- **Paper Muted** (`oklch(91% 0.008 95)` → `paper-200`): Muted dividers, badge backgrounds, table header rows.
- **Paper Hairline** (`oklch(84% 0.009 95)` → `paper-300`): 1px borders. Hairline dividers throughout.
- **Paper Fade** (`oklch(70% 0.009 95)` → `paper-400`): Disabled text, placeholder text.
- **Paper Quiet** (`oklch(55% 0.009 95)` → `paper-500`): Secondary metadata. Subtle UI text.
- **Paper Voice** (`oklch(42% 0.009 95)` → `paper-600`): Body metadata, captions, tag color, breadcrumbs.
- **Graphite** (`oklch(30% 0.009 95)` → `paper-700`): Body text alternate. Ghost button text.
- **Deep Graphite** (`oklch(20% 0.010 95)` → `paper-800`): Primary body text on paper.
- **Soot** (`oklch(14% 0.010 95)` → `paper-900`): Headings.
- **Ink** (`oklch(13% 0.012 145)` → `ink`): Primary-button fill, focused-input border at maximum quiet. Slightly tinted toward sap for warmth — never pure black.

### State

- **Brick** (`oklch(50% 0.180 28)` → `brick`): Error text, destructive action confirmation, "delete" button outline. Used only on direct action surfaces, never as a decorative red.
- **Amber** (`oklch(70% 0.130 80)` → `amber`): Warning state, "draft" badge accent, unsaved-changes indicator.
- **Graphite Blue** (`oklch(50% 0.080 235)` → `graphite`): Informational messages, link target previews.

### Dark Companion

Same warm chroma tilt at low lightness. `dark-paper-900` (oklch 12%) is the dark page background; `dark-paper-50` (oklch 92%) is dark mode body text. Same scale logic, same accent (sap-400 instead of sap-500 for dark-mode contrast).

### Named Rules

**The One Tool Rule.** The sap accent is used on at most 10% of any rendered screen. If you find yourself reaching for sap on a third element, you're decorating, not signaling. Replace the third use with ink or paper-600.

**The No-Pure-Black Rule.** `#000` is never used. The darkest ink is `paper-900` (oklch 14%, tinted warm). The eye reads tinted-near-black as paper-and-ink; pure black reads as a screen.

**The State-Sparing Rule.** Brick, amber, and graphite-blue are state colors only. They never appear in chrome, decoration, or branding. If they're visible, something is happening (error, warning, info) — not just because the screen needed color.

## 3. Typography

**Display Font:** IBM Plex Sans, weights 400 / 500 / 600. Plex is a workshop-engineered grotesque — it reads as intentional and functional, never editorial and never corporate-default. Self-host or load from Google Fonts.

**Body Font:** IBM Plex Sans (chrome) and IBM Plex Mono (content). The split is the system's defining typographic move: the app's controls speak in sans, the content being authored speaks in mono. Plex Mono is one of the most readable monospaced faces available; treating it as legitimate prose makes the markdown editor feel like a typewriter at a workbench, not a code editor.

**Character:** Engineered, quietly assertive, sparing with style. No italics for emphasis (use weight instead). No display variants. No swashes. Letter-spacing is set tight at display sizes (-0.022em) and neutral at body, on the assumption that Plex's drawn shapes hold their own without tracking gimmicks.

### Hierarchy

- **Display** (Plex Sans, 600, `clamp(1.75rem, 1.4rem + 1.5vw, 2.25rem)`, line-height 1.15, letter-spacing -0.022em): Page H1 — "Notes", "Content", "Edit note". One per screen.
- **Headline** (Plex Sans, 600, 1.5rem, line-height 1.2, letter-spacing -0.015em): Sectional H2 inside long pages.
- **Title** (Plex Sans, 600, 1.0625rem, line-height 1.3, letter-spacing -0.008em): Card titles, list-item titles, note titles in list views.
- **Body** (Plex Sans, 400, 0.9375rem, line-height 1.6, max width **65–75ch**): Chrome body copy. Microcopy, paragraph descriptions, form helper text.
- **Editor Body** (Plex Mono, 400, 0.9375rem, line-height 1.7, max width **70ch**): The writing surface inside the markdown editor. The note `body` rendered for editing. Slugs. URIs. Timestamps. AT-URIs.
- **Label** (Plex Sans, 500, 0.75rem, line-height 1.4, letter-spacing 0.06em, **UPPERCASE**): Form labels, button text, badge text, filter-tab labels. Letter-spacing makes uppercase quiet, not shouty.
- **Meta** (Plex Mono, 400, 0.8125rem, line-height 1.45): Timestamps, slugs, AT-URIs, tag display, breadcrumb separators. Whenever the user is looking at "the data shape of what they're working on", it's in Meta.

### Named Rules

**The Mono-as-Content Rule.** Anything the user is writing, editing, or seeing as raw record data is in Plex Mono. Anything the user is being told *about* the system is in Plex Sans. Code blocks are mono (of course), but so are slugs, timestamps, AT-URIs, tag text, and the entire markdown editor body. If you're unsure which side a piece of text falls on, ask: "is this the thing being worked on, or is this the workbench?"

**The No-Italic-Emphasis Rule.** Emphasis in body copy comes from weight (400 → 500 or 600), not italic. Italic is reserved for genuine titles of works inside running prose and the empty-state preview placeholder. Plex's italic is technically excellent and visually distracting in a workshop context.

**The Uppercase-Plus-Tracking Rule.** UPPERCASE only appears at the **Label** scale (0.75rem) with letter-spacing 0.06em. Never UPPERCASE at body size or larger — it reads as shouting. Tracked-uppercase small text reads as a stencil, a stamp, a workshop label.

## 4. Elevation

**This system has no shadows.** Depth is conveyed entirely through (a) 1px hairline borders in `paper-300`, (b) tonal layering between `paper-0` (true surface) and `paper-50` (page) and `paper-100` (subtle), and (c) the absence-of-border on the lowest layer. A card "lifts" by being `paper-0` over a `paper-50` page, not by casting a shadow.

The only "shadow-like" affordance is the **focus outline**: a 2px `sap-500` outline at 2px offset on any focused interactive element. It reads as a stamp landing, not a glow.

### Named Rules

**The Flat-By-Default Rule.** No `box-shadow` is used anywhere in chrome. Modals, popovers, and menus may use a single hairline border + tonal background and that is enough. The very rare exception is the menu portal floating over content, which may use `box-shadow: 0 1px 0 oklch(0% 0 0 / 0.08)` — a 1px ink hairline at 8% opacity, no blur, no spread. That's the entire shadow vocabulary.

**The Border-Is-The-Affordance Rule.** When an element needs to signal "this is a distinct surface," it gets a 1px `paper-300` border, not a shadow. When an element needs to signal "this is interactive," it gets a hover state that changes its background by one tonal step (`paper-50` → `paper-100`), not a lift.

## 5. Components

### Buttons

Three variants. All share the same shape (2px radius, 10px × 18px padding for default size, 8px × 14px for `size=sm`, 12px × 22px for `size=lg`) and the same typography (Label: Plex Sans 500, 0.75rem, tracked 0.06em, **UPPERCASE**).

- **Primary** (most used): `ink` background, `paper-50` text. Hover: `paper-800`. Active: `paper-900`. For the canonical action on a screen (Save, Sign in).
- **Accent** (rarest, ≤1 per screen): `sap-500` background, `paper-50` text. Hover: `sap-600`. Active: `sap-700`. Reserved for **Publish** — pushing a record to the PDS. Treated as a different kind of action than Save: Save is local; Publish is broadcast.
- **Secondary**: `paper-0` background, `ink` text, 1px `paper-300` border. Hover: `paper-100` background, ink stays. For non-canonical actions when a button affordance is still needed (Cancel, Import).
- **Ghost**: transparent background, `paper-700` text, no border. Hover: `paper-100` background, `ink` text. For navigation-adjacent actions (Back, dropdown triggers, secondary tools).
- **Destructive**: secondary shape (border + paper-0 fill), but text is `brick` and border is `brick`. Hover fills with `brick` at 8% opacity. Reserved for Delete, etc.

Focus on every variant: 2px `sap-500` outline, 2px offset, no border-radius change.

### Cards

- **Shape:** 2px corner radius. Sharp enough to read as "paper stacked," not "rounded card."
- **Background:** `paper-0` (true surface) sitting on the `paper-50` page.
- **Border:** 1px `paper-300` hairline on all four sides. No shadow.
- **Internal padding:** 20px × 24px. Compact but readable.
- **Title row:** Plex Sans 600, 1.0625rem, ink color. Tag pills sit on the same baseline.
- **Meta row:** Plex Mono 0.8125rem, `paper-600`. Slugs, dates, secondary metadata.
- **Description preview:** Plex Sans 0.9375rem, `paper-700`, line-clamp 2.

No `Card.Root variant="outline"` in the Chakra default sense — the entire surface is more deliberate than that. The current crate-web list cards become tighter, sharper, and lose the soft Chakra radius.

### Inputs

- **Shape:** 2px corner radius. 1px `paper-300` border. `paper-0` background.
- **Padding:** 10px × 12px.
- **Typography:** Plex Sans 0.9375rem at rest, `ink` color.
- **Placeholder:** `paper-400`.
- **Hover:** border shifts to `paper-400`.
- **Focus:** border shifts to 1.5px `sap-500`, 2px sap-500 outline at 2px offset (the focus outline doubles up — border AND outline — to honor "decisive on action"). No glow, no blur.
- **Error:** border `brick`, helper text in `brick` below.
- **Disabled:** `paper-100` background, `paper-400` text, no border color change.

Title inputs in the note editor are a special case: **borderless**, oversized (Display scale: Plex Sans 600, ~1.75rem), and treated as if the user is hand-writing the title at the top of a page. They get a faint 1px `paper-200` underline on focus, no outline.

### Tags

Replaces the current pill-style filled tags entirely. Tags are now **mono text inline**: `#ideas`, `#fiber`, `#worklog` in Plex Mono 0.8125rem `paper-600`, prefixed with `#`, separated by ·. No background, no border, no padding, no rounding. They sit on the meta row of a card and read as part of the data, not as decoration.

### Filter Tabs

Replaces the current chip-row of solid/outline buttons on `/content`. Filter tabs are now a **bottom-bordered row of small uppercase labels**:

```
ALL · ILLUSTRATION · ARTICLE · VIDEO · TALK · NEWSLETTER · PODCAST
─── (paper-300 hairline) ──────────────────────────────────────────
```

- Inactive: Plex Sans 500, 0.75rem, tracked 0.06em, `paper-500`, no bottom border on the tab.
- Active: Plex Sans 500, 0.75rem, tracked 0.06em, `ink`, 2px `sap-500` bottom border under just that tab, offset 4px below the baseline.
- Hover: `ink` color, no border change.

Like a newspaper section nav, not a SaaS filter bar.

### Navigation (top bar)

- 56px tall. 1px `paper-300` bottom border. `paper-50` background, no blur, no transparency.
- **Brand mark on the left:** `Crate` in Plex Mono 500, 0.875rem, `ink`. Mono mark — declaring "this is a tool, not a brand."
- **Section links** (if/when added): Label scale, `paper-600` at rest, `ink` on hover.
- **Avatar on the right:** 28px circular, paper-300 1px ring. Click opens a hairline-bordered menu (no shadow, single hairline 8% ink as the only exception).

Mobile: same bar, 48px tall, menu becomes a full-width hairline-bordered drawer from the right.

### Note Editor (signature surface)

The defining screen of the app. Treated as a page, not a form.

- **Outer page margin:** clamp(16px, 4vw, 64px) on both sides.
- **Inner column:** max 70ch (~720px) wide, centered.
- **Title input:** borderless, Plex Sans 600 at Display scale, sits at the top of the column with 32px below it.
- **Meta strip below title:** Plex Mono 0.8125rem in `paper-600`. Shows slug, publishedAt date, draft state. Editable inline (click slug to edit; click date to change).
- **Body editor:** full-width within the column, Plex Mono 0.9375rem, line-height 1.7, `paper-800` text on `paper-0` surface. No border in `edit` mode — the textarea is the page. A faint `paper-100` selection background.
- **Edit / Preview / Split toggle:** moves to a small Plex Sans Label row at the **top right corner of the column**, not above. Three uppercase words separated by ·, active one in ink with sap-500 underline.
- **Save / Publish bar:** sticky at the bottom of the viewport with a 1px `paper-300` top border and `paper-50` background. Plex Sans Label buttons aligned right. Save (primary, ink). Publish appears only when there are publishable changes (accent, sap).

### Tabs (Edit / Preview / Split in MarkdownEditor)

Replace the current Chakra Tabs with the same filter-tab pattern: three uppercase Label-scale words separated by ·, active one underlined in 2px sap-500.

### Forms (label + input groups)

- **Label:** Plex Sans Label scale, `paper-600`, 6px below the input.
- **Input/Textarea:** as specified above.
- **Helper text:** Plex Sans 0.8125rem, `paper-500`, 4px above the input on the right (small, never below — keeps the visual rhythm of the column).
- **Error helper text:** Same position, `brick` color.

### Empty States

Replaces the current centered card-on-tinted-background pattern. Empty states are now a **left-aligned, paper-no-card** block inside the normal content column:

- Plex Sans Body in `paper-600`: one line, plain. "No notes yet." (no period? probably with period — workshop sentences are complete.)
- Plex Sans Label, sap-500: a single linked action. "WRITE YOUR FIRST NOTE →"
- Optional second-line micro-helper in `paper-500` Body Small.

No card. No center-alignment. No icon. The emptiness IS the empty state.

## 6. Do's and Don'ts

### Do

- **Do** use IBM Plex Sans for everything UI and IBM Plex Mono for everything content-being-worked-on. The split is the design's defining typographic move.
- **Do** use sap-500 sparingly: focused field, publish action, inline prose links, active filter-tab underline. Less than 10% of any screen.
- **Do** keep button radius at 2px. Sharp corners are part of the workshop voice.
- **Do** treat borders as the primary depth affordance. 1px `paper-300` hairlines do the work that shadows do elsewhere.
- **Do** tint every neutral toward the sap hue at very low chroma (0.005–0.012). The eye reads this as "warm paper" rather than "screen grey."
- **Do** put slugs, timestamps, AT-URIs, and tags in Plex Mono. They are data being worked on.
- **Do** put uppercase letter-spaced labels only at 0.75rem with 0.06em tracking. They read as workshop stamps; at larger sizes they read as shouting.

### Don't

- **Don't** use `#000` or `#fff`. The darkest ink is `paper-900` (oklch 14%, tinted warm). The lightest paper is `paper-0` (oklch 99.5%, tinted warm).
- **Don't** introduce teal, the current crate-web accent, anywhere — even as `colorPalette="teal"` on a Chakra component. The teal palette is removed from the theme.
- **Don't** add `box-shadow` to anything. No card shadow, no button shadow, no input glow, no modal lift. The single allowed exception is `0 1px 0 ink/8%` on the dropdown menu portal — and nothing else.
- **Don't** wrap content in cards by default. Most lists, forms, and editor surfaces sit directly on `paper-50` with hairline dividers between rows.
- **Don't** use Chakra's default `Card.Root variant="outline"`. The current `notes/index.tsx` and `content/index.tsx` cards are migrated to the tighter spec above (2px radius, paper-0 surface, paper-300 hairline, no Card variant prop).
- **Don't** use rounded-full pill buttons for filter chips. Filter tabs are uppercase Label-scale text with a sap underline on active — newspaper section nav, not SaaS pills.
- **Don't** use friendly cartoon illustrations, icon-with-heading empty states, or "let's get started!" microcopy. Empty states are one plain line + one action.
- **Don't** introduce a second display font (no Cormorant, no Lyon, no Recoleta, no decorative serif). One typeface in two registers.
- **Don't** use gradient text or `background-clip: text`. The workshop has one ink.
- **Don't** use glassmorphism (backdrop-filter blur) on the top nav, modals, or any surface. The nav is opaque `paper-50`.
- **Don't** use Chakra defaults for radius, font, or button shape. Every component above is custom-specified; the Chakra components are vehicles, not arbiters.
- **Don't** use italic for emphasis in body copy. Use Plex Sans weight 500 or 600.
- **Don't** use shadows, gradients, neon, or dark-mode-with-purple anywhere. This is the AI-coded-landing-page trap explicitly named in PRODUCT.md.
- **Don't** use em dashes in UI copy. Commas, colons, semicolons, periods, or parentheses.
