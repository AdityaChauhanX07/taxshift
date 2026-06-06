import Reveal from './Reveal.jsx'

/** Inline mono span for a figure inside otherwise-sans spec text. */
const Fig = ({ children }) => <span className="mono">{children}</span>

const SPECS = [
  {
    accent: 'amber',
    title: 'Federal Brackets',
    body: 'All 7 brackets across 3 filing statuses. Exact 2025 thresholds, post-OBBBA.',
  },
  {
    accent: 'blue',
    title: '24 States',
    body: 'No-tax, flat-rate, and progressive states, roughly 80% of the U.S. population.',
  },
  {
    accent: 'green',
    title: 'OBBBA 2025',
    body: (
      <>
        <Fig>$40K</Fig> SALT cap, <Fig>$2,200</Fig> child credit, and the updated standard
        deductions.
      </>
    ),
  },
  {
    accent: 'slate',
    title: 'Plain English',
    body: 'Every result comes with a written explanation of why your taxes moved.',
  },
]

/**
 * "Under the hood" — a propless specs panel shown after the event selector to
 * signal the tool's technical depth.
 */
export default function CoverageSection() {
  return (
    <section style={{ marginTop: 88 }}>
      <Reveal className="section-head" style={{ marginBottom: 8 }}>
        <span className="kicker">Under the hood</span>
        <h2 style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}>Built on real 2025 tax law.</h2>
      </Reveal>

      <div className="specs">
        {SPECS.map((s, i) => (
          <Reveal key={s.title} delay={Math.min(5, i + 1)}>
            <div className="spec" style={{ '--accent': `var(--c-${s.accent})` }}>
              <h4>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
