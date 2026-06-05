import { COLORS, FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

/**
 * Static, non-interactive "preview card" shown in the header. It renders a
 * sample marriage result (all numbers hardcoded — this is a marketing teaser,
 * not live data) so visitors see what TaxShift produces before touching a thing.
 */
export default function HeroPreview() {
  const isMobile = useMediaQuery('(max-width: 639px)')

  /** One BEFORE/AFTER mini-block: small label above a mono value. */
  const block = (label, value) => (
    <div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: COLORS.tagMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: isMobile ? 16 : 18,
          color: COLORS.textPrimary,
        }}
      >
        {value}
      </div>
    </div>
  )

  return (
    <div
      className="ts-hero-preview"
      style={{
        maxWidth: isMobile ? '100%' : 520,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${COLORS.accent}`,
        borderRadius: 4,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
        padding: isMobile ? 20 : '24px 28px',
        margin: '28px 0 8px',
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 14,
          fontWeight: 600,
          color: COLORS.textPrimary,
        }}
      >
        Getting Married
      </div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12,
          color: COLORS.tagMuted,
          marginTop: 2,
        }}
      >
        $130,000 + $40,000 · Arizona
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
        {block('BEFORE', '$26,401')}
        <span style={{ fontSize: 16, color: COLORS.border }}>→</span>
        {block('AFTER', '$23,761')}
      </div>

      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 15,
          fontWeight: 600,
          color: COLORS.savings,
          marginTop: 12,
        }}
      >
        $2,640 / year saved
      </div>
    </div>
  )
}
