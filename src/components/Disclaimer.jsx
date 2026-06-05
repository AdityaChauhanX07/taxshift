import { COLORS, FONTS } from '../utils/theme.js'

/**
 * Educational-use disclaimer banner with an amber left border.
 */
export default function Disclaimer() {
  return (
    <div
      style={{
        background: COLORS.disclaimerBg,
        borderLeft: `3px solid ${COLORS.accent}`,
        padding: '10px 14px',
        fontSize: 11,
        lineHeight: 1.5,
        color: COLORS.textSecondary,
        fontFamily: FONTS.sans,
      }}
    >
      <strong style={{ color: COLORS.textPrimary, fontWeight: 600 }}>TaxShift</strong>{' '}
      is an educational estimator using 2025 federal tax models (including OBBBA
      updates). It is not tax advice. Consult a qualified tax professional for
      filing decisions.
    </div>
  )
}
