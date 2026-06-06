// Stat pairs: [bright key word, muted remainder]. Rendered twice back-to-back
// so the marquee can loop seamlessly (translateX -50%).
const ITEMS = [
  ['2025', 'Tax Data'],
  ['24', 'States Covered'],
  ['OBBBA', 'Updated'],
  ['6', 'Life Events'],
  ['7', 'Federal Brackets'],
  ['$40K', 'SALT Cap'],
]

function Group() {
  return (
    <span className="ticker-item">
      {ITEMS.map(([key, rest], i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 56 }}>
          <span>
            <b>{key}</b> {rest}
          </span>
          <span className="sep">·</span>
        </span>
      ))}
    </span>
  )
}

/**
 * Compact full-width dark data ticker (a marquee) bridging the hero and the
 * event selector. Static and propless — it advertises the engine's coverage.
 */
export default function CredibilityStrip() {
  return (
    <div className="ticker">
      <div className="ticker-inner">
        <div className="ticker-track">
          <Group />
          <Group />
        </div>
      </div>
    </div>
  )
}
