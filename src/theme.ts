import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    tokens: {
      colors: {
        // Teal primary palette — crate.social brand color
        teal: {
          50: { value: '#E6FFFA' },
          100: { value: '#B2F5EA' },
          200: { value: '#81E6D9' },
          300: { value: '#4FD1C5' },
          400: { value: '#38B2AC' },
          500: { value: '#319795' }, // Primary
          600: { value: '#2C7A7B' },
          700: { value: '#285E61' },
          800: { value: '#234E52' },
          900: { value: '#1D4044' },
        },
        // Cool-tinted neutrals
        coolGray: {
          50: { value: '#F7FAFA' },
          100: { value: '#EDF3F3' },
          200: { value: '#D9E5E5' },
          300: { value: '#BDD0D0' },
          400: { value: '#9BB5B5' },
          500: { value: '#7A9999' },
          600: { value: '#5E7A7A' },
          700: { value: '#445B5B' },
          800: { value: '#2E3F3F' },
          900: { value: '#1E2B2B' },
          950: { value: '#121C1C' },
        },
        // Deep teal-charcoal for dark mode surfaces
        deep: {
          50: { value: '#EBF4F4' },
          100: { value: '#D6E9E9' },
          200: { value: '#AACECE' },
          300: { value: '#7DAFAF' },
          400: { value: '#568D8D' },
          500: { value: '#3B6B6B' },
          600: { value: '#2A4F4F' },
          700: { value: '#1E3A3A' },
          800: { value: '#152929' },
          900: { value: '#0E1C1C' },
          950: { value: '#091212' },
        },
      },
      fonts: {
        heading: {
          value:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        body: {
          value:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        mono: {
          value: "'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace",
        },
      },
      sizes: {
        'container.content': { value: '72rem' },
        'container.workspace': { value: '90rem' },
      },
    },
    semanticTokens: {
      colors: {
        'bg.page': {
          value: { _light: '{colors.coolGray.50}', _dark: '{colors.deep.900}' },
        },
        'bg.card': {
          value: { _light: '{colors.white}', _dark: '{colors.deep.700}' },
        },
        'bg.elevated': {
          value: { _light: '{colors.white}', _dark: '{colors.deep.800}' },
        },
        'bg.subtle': {
          value: { _light: '{colors.coolGray.100}', _dark: '{colors.deep.800}' },
        },
        'bg.muted': {
          value: { _light: '{colors.coolGray.200}', _dark: '{colors.deep.600}' },
        },
        'bg.nav': {
          value: {
            _light: 'rgba(247, 250, 250, 0.88)',
            _dark: 'rgba(14, 28, 28, 0.88)',
          },
        },
        'fg.default': {
          value: { _light: '{colors.coolGray.900}', _dark: '{colors.coolGray.100}' },
        },
        'fg.muted': {
          value: { _light: '{colors.coolGray.600}', _dark: '{colors.coolGray.400}' },
        },
        'fg.subtle': {
          value: { _light: '{colors.coolGray.500}', _dark: '{colors.coolGray.500}' },
        },
        'fg.error': {
          value: { _light: '{colors.red.600}', _dark: '{colors.red.400}' },
        },
        'fg.success': {
          value: { _light: '{colors.green.600}', _dark: '{colors.green.400}' },
        },
        'accent.default': {
          value: { _light: '{colors.teal.500}', _dark: '{colors.teal.400}' },
        },
        'accent.hover': {
          value: { _light: '{colors.teal.600}', _dark: '{colors.teal.300}' },
        },
        'accent.muted': {
          value: { _light: '{colors.teal.50}', _dark: '{colors.teal.900}' },
        },
        'accent.subtle': {
          value: { _light: '{colors.teal.100}', _dark: '{colors.teal.800}' },
        },
        'border.card': {
          value: { _light: '{colors.coolGray.200}', _dark: '{colors.deep.600}' },
        },
        'border.subtle': {
          value: { _light: '{colors.coolGray.200}', _dark: '{colors.deep.700}' },
        },
        'border.focus': {
          value: { _light: '{colors.teal.500}', _dark: '{colors.teal.400}' },
        },
      },
    },
  },
  globalCss: {
    'html, body': {
      bg: 'bg.page',
      color: 'fg.default',
      fontFamily: 'body',
      lineHeight: '1.6',
      minHeight: '100vh',
    },
    '#root': {
      minHeight: '100vh',
    },
    'h1, h2': {
      fontWeight: '700',
      letterSpacing: '-0.02em',
    },
    'h3, h4, h5, h6': {
      fontWeight: '600',
      letterSpacing: '-0.01em',
    },
    a: {
      color: 'accent.default',
      textDecoration: 'none',
      _hover: {
        color: 'accent.hover',
        textDecoration: 'underline',
      },
    },
    '*::selection': {
      bg: 'accent.muted',
      color: 'accent.default',
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
