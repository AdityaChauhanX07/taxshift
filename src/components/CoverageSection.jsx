import { COLORS, FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

/** Inline mono span for a dollar figure inside otherwise-sans subtitle text. */
const Fig = ({ children }) => <span style={{ fontFamily: FONTS.mono }}>{children}</span>

// Four "specs panel" cards advertising the engine's depth. Static content; the
// OBBBA subtitle is JSX so its dollar figures can render in mono.
const CARDS = [
  {
    title: 'Federal Brackets',
    accent: '#CA8A04',
    subtitle: 'All 7 brackets across 3 filing statuses. Exact 2025 thresholds from Rev. Proc. 2024-40.',
  },
  {
    title: '24 States',
    accent: '#1D4ED8',
    subtitle:
      '9 no-tax, 11 flat-rate, and 4 progressive-bracket states. Covers roughly 80% of the US population.',
  },
  {
    title: 'OBBBA 2025',
    accent: '#2D6A4F',
    subtitle: (
      <>
        <Fig>$40K</Fig> SALT cap. <Fig>$2,200</Fig> child credit. <Fig>$15,750</Fig> /{' '}
        <Fig>$31,500</Fig> / <Fig>$23,625</Fig> standard deductions. All updated.
      </>
    ),
  },
  {
    title: 'AI Analysis',
    accent: '#9B2C2C',
    subtitle:
      'Personalized plain-English explanations of why your taxes changed and what to do about it.',
  },
]

/**
 * "What's under the hood" — a propless specs panel of four informational cards
 * shown after the event selector to signal the tool's technical depth.
 */
export default function CoverageSection() {
  const isMobile = useMediaQuery('(max-width: 639px)')
  const isTablet = useMediaQuery('(max-width: 799px)')
  const columns = isMobile ? 1 : isTablet ? 2 : 4

  return (
    <section style={{ marginTop: 48 }}>
      <h2
        style={{
          fontFamily: FONTS.serif,
          fontSize: 24,
          fontWeight: 400,
          color: COLORS.textPrimary,
          margin: '0 0 24px',
        }}
      >
        What's under the hood
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 16,
        }}
      >
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              background: '#F8F7F3',
              border: `1px solid ${COLORS.panelBorder}`,
              borderTop: `2px solid ${card.accent}`,
              borderRadius: 4,
              padding: 20,
            }}
          >
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 15,
                fontWeight: 600,
                color: card.accent,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.5,
                color: COLORS.textSecondary,
                marginTop: 8,
              }}
            >
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
