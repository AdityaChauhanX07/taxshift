/**
 * Shared design tokens for TaxShift. Centralized so every component pulls the
 * exact same warm, editorial palette and typography.
 */

export const COLORS = {
  bg: '#F5F3ED',
  card: '#FFFFFF',
  border: '#D6D3CB',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6560',
  savings: '#2D6A4F',
  cost: '#9B2C2C',
  accent: '#CA8A04',
  inputBg: '#FAFAF7',
  tagMuted: '#9B9790',
  selectedText: '#F5F3ED',
  selectedDesc: '#B0ADA5',
  disclaimerBg: '#EDEBE5',
  resultsBg: '#EFEEE8',
  chartBg: '#FAFAF7',
  errorBg: '#FEF2F2',
  errorBorder: '#E8BFBF',
  noteBg: '#FFFBEB',
  noteBorder: '#E8DFB8',
  noteText: '#6B5B10',
  panelBorder: '#E5E2DB',
}

export const FONTS = {
  serif: "'Instrument Serif', Georgia, serif",
  mono: "'JetBrains Mono', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
}

/** Shared uppercase section-label style. */
export const labelStyle = {
  fontFamily: FONTS.sans,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: COLORS.textSecondary,
  fontWeight: 600,
}
