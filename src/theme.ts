import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * Crate design system — "The Quiet Workshop".
 *
 * Source of truth: ../DESIGN.md and ../.impeccable/design.json.
 *
 * The visual contract in two lines:
 *   - Warm-paper neutrals + sap-green tool color + Plex Sans/Mono.
 *   - Sharp corners, no shadows, ink type, sap used <10% per screen.
 *
 * Internal palette aliasing: the `teal` palette holds the sap ramp and the
 * `red` palette holds a brick ramp, so existing `colorPalette="teal"` and
 * `colorPalette="red"` callsites render correctly without per-file edits.
 * Once routes are migrated individually, callsites can be renamed to
 * `colorPalette="sap"` / `colorPalette="brick"` and the aliases removed.
 */

// ---------------------------------------------------------------------------
// Palette primitives (OKLCH, hue ~95deg for paper, ~145deg for sap).
// Kept as plain strings here; semantic tokens below reference them by name.
// ---------------------------------------------------------------------------

const paper = {
  0: 'oklch(99.5% 0.003 95)',
  50: 'oklch(98% 0.005 95)',
  100: 'oklch(95% 0.006 95)',
  200: 'oklch(91% 0.008 95)',
  300: 'oklch(84% 0.009 95)',
  400: 'oklch(70% 0.009 95)',
  500: 'oklch(55% 0.009 95)',
  600: 'oklch(42% 0.009 95)',
  700: 'oklch(30% 0.009 95)',
  800: 'oklch(20% 0.010 95)',
  900: 'oklch(14% 0.010 95)',
};

const ink = 'oklch(13% 0.012 145)';

const sap = {
  50: 'oklch(96% 0.025 145)',
  100: 'oklch(92% 0.045 145)',
  200: 'oklch(84% 0.070 145)',
  300: 'oklch(72% 0.095 145)',
  400: 'oklch(60% 0.110 145)',
  500: 'oklch(48% 0.115 145)',
  600: 'oklch(40% 0.105 145)',
  700: 'oklch(32% 0.090 145)',
  800: 'oklch(24% 0.070 145)',
  900: 'oklch(18% 0.050 145)',
};

// Brick is a single hue (~28deg). The ramp is synthesized in OKLCH at low
// chroma at the ends and full character mid-scale. Used only for destructive /
// error affordances.
const brick = {
  50: 'oklch(96% 0.020 28)',
  100: 'oklch(91% 0.045 28)',
  200: 'oklch(82% 0.085 28)',
  300: 'oklch(72% 0.125 28)',
  400: 'oklch(62% 0.165 28)',
  500: 'oklch(50% 0.180 28)',
  600: 'oklch(42% 0.165 28)',
  700: 'oklch(34% 0.140 28)',
  800: 'oklch(26% 0.110 28)',
  900: 'oklch(20% 0.080 28)',
};

const amber = 'oklch(70% 0.130 80)';
const graphite = 'oklch(50% 0.080 235)';

// ---------------------------------------------------------------------------
// Helper: wrap a ramp object into Chakra v3's `{ value: '...' }` shape.
// ---------------------------------------------------------------------------

type Ramp = Record<string | number, string>;

const ramp = (r: Ramp) =>
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [k, { value: v }])
  ) as Record<string, { value: string }>;

// ---------------------------------------------------------------------------
// Theme config.
// ---------------------------------------------------------------------------

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        paper: ramp(paper),
        ink: { value: ink },
        sap: ramp(sap),
        brick: ramp(brick),
        amber: { value: amber },
        graphite: { value: graphite },

        // Aliases so existing `colorPalette="teal"` / `colorPalette="red"`
        // callsites map onto the workshop palette during transition.
        // The Chakra colorPalette recipe expects a full 50-950 ramp; we
        // duplicate 900 to 950 since the workshop palette has no extra step.
        teal: {
          ...ramp(sap),
          950: { value: sap[900] },
        },
        red: {
          ...ramp(brick),
          950: { value: brick[900] },
        },
      },
      fonts: {
        heading: {
          value:
            "'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        body: {
          value:
            "'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        mono: {
          value:
            "'IBM Plex Mono', ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace",
        },
      },
      radii: {
        sharp: { value: '0' },
        xs: { value: '2px' },
        sm: { value: '4px' },
        md: { value: '6px' },
      },
      sizes: {
        'container.content': { value: '72rem' },
        'container.workspace': { value: '90rem' },
        'container.column': { value: '70ch' },
      },
      letterSpacings: {
        display: { value: '-0.022em' },
        title: { value: '-0.008em' },
        label: { value: '0.06em' },
      },
    },

    semanticTokens: {
      colors: {
        // Page surfaces — all defined as light only; dark mode is not exposed
        // in this pass (see PRODUCT.md scope).
        'bg.page': { value: '{colors.paper.50}' },
        'bg.card': { value: '{colors.paper.0}' },
        'bg.elevated': { value: '{colors.paper.0}' },
        'bg.subtle': { value: '{colors.paper.100}' },
        'bg.muted': { value: '{colors.paper.200}' },
        // Nav: opaque paper, NOT translucent. Glassmorphism is banned.
        'bg.nav': { value: '{colors.paper.50}' },
        // Error/destructive surface tint (used sparingly — never decorative).
        'bg.error': { value: '{colors.brick.50}' },

        // Foreground (text) colors.
        'fg.default': { value: '{colors.paper.800}' },
        'fg.muted': { value: '{colors.paper.600}' },
        'fg.subtle': { value: '{colors.paper.500}' },
        'fg.inverse': { value: '{colors.paper.50}' },
        'fg.error': { value: '{colors.brick.500}' },
        // "Success" is graphite-blue, NOT sap. Sap stays meaningful as the
        // single tool color; success messages are informational.
        'fg.success': { value: '{colors.graphite}' },
        'fg.warning': { value: '{colors.amber}' },

        // Accent (sap green) — the one tool color.
        'accent.default': { value: '{colors.sap.500}' },
        'accent.hover': { value: '{colors.sap.600}' },
        'accent.active': { value: '{colors.sap.700}' },
        'accent.muted': { value: '{colors.sap.100}' },
        'accent.subtle': { value: '{colors.sap.50}' },
        'accent.fg': { value: '{colors.paper.50}' },

        // Borders.
        'border.card': { value: '{colors.paper.300}' },
        'border.subtle': { value: '{colors.paper.200}' },
        'border.strong': { value: '{colors.paper.400}' },
        'border.focus': { value: '{colors.sap.500}' },
        'border.error': { value: '{colors.brick.500}' },

        // Ink — primary button surface, deepest headings.
        ink: { value: '{colors.ink}' },
      },
    },
  },

  globalCss: {
    'html, body': {
      bg: 'bg.page',
      color: 'fg.default',
      fontFamily: 'body',
      // Compact base size for workshop density (15px). Per-component
      // typography scales up from here.
      fontSize: '0.9375rem',
      lineHeight: '1.6',
      letterSpacing: '0',
      minHeight: '100vh',
      // Tell the UA to lay out form controls in light mode regardless of
      // system pref. Dark mode is intentionally not wired in this pass.
      colorScheme: 'light',
      // Slightly tighter rendering for the Plex grotesque. Emotion expects
      // camelCase here; cast bypasses Chakra v3's strict typing.
      ...({
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      } as Record<string, string>),
      textRendering: 'optimizeLegibility',
    },

    '#root': {
      minHeight: '100vh',
    },

    h1: {
      fontWeight: 600,
      letterSpacing: 'display',
      lineHeight: '1.15',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: 'display',
      lineHeight: '1.2',
    },
    'h3, h4': {
      fontWeight: 600,
      letterSpacing: 'title',
      lineHeight: '1.3',
    },
    'h5, h6': {
      fontWeight: 600,
      letterSpacing: '0',
      lineHeight: '1.35',
    },

    a: {
      color: 'accent.default',
      textDecoration: 'none',
      _hover: {
        color: 'accent.hover',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        textDecorationThickness: '1px',
      },
    },

    // Selection: faint sap-100 ground with ink type.
    '*::selection': {
      bg: 'accent.muted',
      color: 'ink',
    },

    // Universal focus ring. 2px sap outline, 2px offset, no border-radius
    // change, no glow. The one decisive moment per "Quiet by default,
    // decisive on action."
    '*:focus-visible': {
      outline: '2px solid',
      outlineColor: 'border.focus',
      outlineOffset: '2px',
    },

    // Mono-coded surfaces. Anything the user types or sees as raw record
    // data lives in mono. This is The Mono-as-Content Rule from DESIGN.md.
    'input, textarea, select': {
      fontFamily: 'body',
    },
    'code, pre, kbd, samp': {
      fontFamily: 'mono',
    },

    // Respect reduced-motion. Zero out non-essential motion. Cast the whole
    // block since SystemStyleObject doesn't recognize nested raw selectors.
    ...({
      '@media (prefers-reduced-motion: reduce)': {
        '*': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
        },
        'html, body': {
          scrollBehavior: 'auto',
        },
      },
    } as Record<string, unknown>),
  },
});

export const system = createSystem(defaultConfig, customConfig);
