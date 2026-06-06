import { FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

// Dark-panel palette — local to this teaser since it previews the dark results
// experience and doesn't reuse the app's cream tokens.
const PANEL = {
  bg: '#1A1A1A',
  textBright: '#F5F3ED',
  muted: '#7A7770',
  mutedSoft: '#9B9790',
  arrow: '#6B6560',
  green: '#34D399',
  greenSoft: '#A1A09A',
  red: '#F87171',
  divider: '#333333',
}

/**
 * Static, non-interactive showcase panel shown in the hero. It renders a sample
 * marriage result (all numbers hardcoded — this is a marketing teaser, not live
 * data) so visitors see what TaxShift produces before touching a thing. The dark
 * panel previews the dark results experience.
 */
export default function HeroPreview() {
  const isMobile = useMediaQuery('(max-width: 639px)')

  /** One BEFORE/AFTER mini-block with a thin colored left accent. */
  const block = (label, value, rate, accent) => (
    <div style={{ borderLeft: `2px solid ${accent}`, paddingLeft: 12 }}>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: PANEL.muted,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 20, color: PANEL.textBright }}>{value}</div>
      <div style={{ fontFamily: FONTS.sans, fontSize: 12, color: PANEL.muted, marginTop: 2 }}>
        {rate}
      </div>
    </div>
  )

  return (
    <div
      className="ts-hero-preview"
      style={{
        width: '100%',
        background: PANEL.bg,
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        padding: isMobile ? '28px 24px' : '36px 40px',
        margin: '36px 0 0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 24 : 0,
      }}
    >
      {/* LEFT — the scenario and before/after comparison */}
      <div style={{ flex: isMobile ? 'none' : '0 0 60%', width: isMobile ? '100%' : 'auto' }}>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 600,
            color: PANEL.textBright,
          }}
        >
          Getting Married
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 13, color: PANEL.muted, marginTop: 2 }}>
          $130,000 + $40,000 income
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: 13, color: PANEL.muted, marginTop: 2 }}>
          Arizona
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
          {block('Before', '$26,401', '15.5% rate', PANEL.red)}
          <span style={{ fontSize: 16, color: PANEL.arrow }}>→</span>
          {block('After', '$23,761', '14.0% rate', PANEL.green)}
        </div>
      </div>

      {/* Vertical divider between halves (desktop only) */}
      {!isMobile && (
        <div style={{ width: 1, background: PANEL.divider, alignSelf: 'stretch', margin: '0 32px' }} />
      )}

      {/* RIGHT — the headline impact */}
      <div
        style={{
          flex: isMobile ? 'none' : '1',
          width: isMobile ? '100%' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          textAlign: isMobile ? 'left' : 'right',
        }}
      >
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: PANEL.muted,
          }}
        >
          Estimated Impact
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: isMobile ? 32 : 40,
            fontWeight: 600,
            color: PANEL.green,
            marginTop: 12,
          }}
        >
          $2,640
        </div>
        <div style={{ fontFamily: FONTS.mono, fontSize: 16, color: PANEL.greenSoft }}>
          / year saved
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 14,
            color: PANEL.mutedSoft,
            marginTop: 12,
          }}
        >
          That's $220/mo
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: 14, color: PANEL.muted }}>
          in your pocket
        </div>
      </div>
    </div>
  )
}
