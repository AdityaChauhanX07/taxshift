import { FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

// Local dark-band palette — this strip previews the dark surfaces and doesn't
// reuse the app's cream tokens.
const BAND = {
  bg: '#1A1A1A',
  muted: '#A1A09A',
  bright: '#F5F3ED',
  amber: '#CA8A04',
}

// Each stat splits into a brighter key word and the muted remainder.
const STATS = [
  { key: '2025', rest: ' Tax Data' },
  { key: '24', rest: ' States Covered' },
  { key: 'OBBBA', rest: ' Updated' },
  { key: '6', rest: ' Life Events' },
]

/**
 * Compact full-width info bar (a "data ticker") sitting between the hero and the
 * event selection. Static and propless — it advertises the engine's coverage.
 */
export default function CredibilityStrip() {
  const isMobile = useMediaQuery('(max-width: 639px)')

  const item = ({ key, rest }) => (
    <span style={{ fontFamily: FONTS.mono, fontSize: 13, color: BAND.muted }}>
      <span style={{ color: BAND.bright }}>{key}</span>
      {rest}
    </span>
  )

  return (
    <div className="ts-cred-strip" style={{ background: BAND.bg }}>
      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: isMobile ? '14px 16px' : '16px 24px',
          display: isMobile ? 'grid' : 'flex',
          gridTemplateColumns: isMobile ? '1fr 1fr' : undefined,
          gap: isMobile ? 14 : 0,
          alignItems: 'center',
          justifyContent: isMobile ? undefined : 'center',
        }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.key}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {item(stat)}
            {!isMobile && i < STATS.length - 1 && (
              <span style={{ color: BAND.amber, fontSize: 14, margin: '0 16px' }}>·</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
