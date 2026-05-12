"use client";

import { ThemeProvider } from 'next-themes';

interface ColorModeProviderProps {
  children: React.ReactNode;
}

/**
 * Dark mode is intentionally not exposed in this pass — the "Quiet Workshop"
 * design system was tuned for warm-paper-and-ink in daylight. The dark
 * companion palette exists in DESIGN.md and will be wired in a later pass.
 *
 * `forcedTheme="light"` keeps `next-themes` from flipping the `class` on
 * <html> based on system preference, so semantic tokens always resolve to
 * their light values.
 */
export function ColorModeProvider({ children }: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
