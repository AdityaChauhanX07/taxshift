import { COLORS, FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

const STEPS = [
  { num: '01', text: 'Pick a life event' },
  { num: '02', text: 'Enter your numbers' },
  { num: '03', text: 'See your tax impact' },
]

/**
 * Subtle horizontal 3-step wayfinding strip shown between the disclaimer and
 * the event cards. Stacks vertically on mobile; connectors are desktop-only.
 */
export default function HowItWorks() {
  const isMobile = useMediaQuery('(max-width: 639px)')

  const step = (s) => (
    <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.accent }}>{s.num}</span>
      <span style={{ fontFamily: FONTS.sans, fontSize: 13, color: COLORS.textSecondary }}>
        {s.text}
      </span>
    </div>
  )

  const connector = (key) => (
    <div
      key={key}
      style={{ flex: 1, borderTop: `1px dashed ${COLORS.border}`, margin: '0 14px', minWidth: 16 }}
    />
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 10 : 0,
      }}
    >
      {isMobile
        ? STEPS.map(step)
        : STEPS.flatMap((s, i) =>
            i < STEPS.length - 1 ? [step(s), connector(`c${i}`)] : [step(s)],
          )}
    </div>
  )
}
