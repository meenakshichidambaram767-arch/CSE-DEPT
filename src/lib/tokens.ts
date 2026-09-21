/**
 * CSE Department Management System - Design Tokens
 * Centralized semantic tokens for colors, typography, spacing, radius, and shadows.
 */

export const tokens = {
  colors: {
    primary: {
      DEFAULT: '#047857', // Academic Emerald
      hover: '#065f46',
      light: '#ecfdf5',
      dark: '#022c22',
      border: '#a7f3d0',
    },
    secondary: {
      DEFAULT: '#0f172a', // Slate 900
      hover: '#1e293b',
      light: '#f1f5f9',
      dark: '#020617',
      border: '#cbd5e1',
    },
    background: '#f8fafc', // Slate 50
    surface: '#ffffff',
    card: '#ffffff',
    border: '#e2e8f0', // Slate 200
    borderSubtle: '#f1f5f9',
    foreground: '#0f172a',
    muted: {
      DEFAULT: '#64748b', // Slate 500
      light: '#94a3b8',
      background: '#f1f5f9',
    },
    success: {
      DEFAULT: '#059669', // Emerald 600
      light: '#ecfdf5',
      border: '#a7f3d0',
      foreground: '#065f46',
    },
    warning: {
      DEFAULT: '#d97706', // Amber 600
      light: '#fffbeb',
      border: '#fde68a',
      foreground: '#92400e',
    },
    danger: {
      DEFAULT: '#dc2626', // Red 600
      light: '#fef2f2',
      border: '#fecaca',
      foreground: '#991b1b',
    },
    info: {
      DEFAULT: '#0284c7', // Sky 600
      light: '#f0f9ff',
      border: '#bae6fd',
      foreground: '#0369a1',
    },
  },
  typography: {
    pageTitle: 'text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100',
    sectionHeading: 'text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100',
    cardTitle: 'text-base font-semibold text-slate-900 dark:text-slate-100',
    body: 'text-sm text-slate-700 dark:text-slate-300 leading-relaxed',
    bodySmall: 'text-xs text-slate-600 dark:text-slate-400 leading-normal',
    label: 'text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
    caption: 'text-[11px] text-slate-500 dark:text-slate-400 font-medium',
    button: 'text-xs font-semibold tracking-wide',
    status: 'text-xs font-medium tracking-normal',
  },
  spacing: {
    section: 'space-y-6',
    card: 'p-5',
    form: 'space-y-4',
    table: 'px-4 py-3',
    dialog: 'p-6',
  },
  radius: {
    small: 'rounded-lg', // 8px for inputs and buttons
    medium: 'rounded-xl', // 12px for cards and containers
    large: 'rounded-2xl', // 16px for major dialogs and layout shells
    full: 'rounded-full',
  },
  shadows: {
    subtle: 'shadow-xs border border-slate-200/80 dark:border-slate-800',
    card: 'shadow-xs hover:shadow-sm transition-shadow duration-150 border border-slate-200/90 dark:border-slate-800',
    dialog: 'shadow-xl border border-slate-200 dark:border-slate-800',
    dropdown: 'shadow-lg border border-slate-200/90 dark:border-slate-800',
  },
  transitions: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
  },
} as const;

export type DesignTokens = typeof tokens;
