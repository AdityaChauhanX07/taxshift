import Reveal from './Reveal.jsx'

/**
 * Minimal stroke glyph per event. Renders inside a 24x24 viewBox with
 * stroke="currentColor", so the card's accent color drives it.
 * @param {{ name: string, size?: number }} props
 */
function Glyph({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (name === 'rings') {
    return (
      <svg {...common}>
        <circle cx="9" cy="13" r="5" />
        <circle cx="15" cy="13" r="5" />
        <path d="M9 8l1.5-3h3L15 8" />
      </svg>
    )
  }
  if (name === 'baby') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="4" />
        <path d="M6 21c0-4 2.7-6 6-6s6 2 6 6" />
        <path d="M10 7.5h.01M14 7.5h.01" />
      </svg>
    )
  }
  const paths = {
    home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
    pin: 'M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z M12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    briefcase: 'M3 8h18v12H3zM8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
    split: 'M6 3v6a6 6 0 0 0 6 6 6 6 0 0 1 6 6v0M6 21v0',
  }
  return (
    <svg {...common}>
      <path d={paths[name] || paths.home} />
    </svg>
  )
}

/** Small right arrow used in the card's "Run this scenario" link. */
function ArrowRight({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/**
 * The six supported life events, in display order. Exported so InputForm can
 * reuse the titles without duplicating the list. `cat` maps to a `--c-<cat>`
 * accent variable defined in index.css.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared event list consumed by App.jsx and InputForm.jsx
export const EVENTS = [
  {
    id: 'marriage',
    num: '01',
    cat: 'amber',
    kicker: 'Filing status',
    glyph: 'rings',
    title: 'Getting Married',
    desc: 'Two incomes, one return. The marriage bonus, or penalty, depends on the gap between you.',
  },
  {
    id: 'baby',
    num: '02',
    cat: 'blue',
    kicker: 'Tax credits',
    glyph: 'baby',
    title: 'Having a Baby',
    desc: 'The Child Tax Credit, dependent benefits, and a possible jump to Head of Household.',
  },
  {
    id: 'home',
    num: '03',
    cat: 'green',
    kicker: 'Deductions',
    glyph: 'home',
    title: 'Buying a Home',
    desc: 'Mortgage interest, property tax, and whether itemizing finally beats the standard deduction.',
  },
  {
    id: 'move',
    num: '04',
    cat: 'slate',
    kicker: 'State tax',
    glyph: 'pin',
    title: 'Moving States',
    desc: 'The same paycheck, a different state line. State income tax can swing thousands.',
  },
  {
    id: 'sidebiz',
    num: '05',
    cat: 'red',
    kicker: 'Self-employment',
    glyph: 'briefcase',
    title: 'Starting a Side Business',
    desc: 'New income, but self-employment tax and the deductions that soften the blow.',
  },
  {
    id: 'divorce',
    num: '06',
    cat: 'violet',
    kicker: 'Filing status',
    glyph: 'split',
    title: 'Getting Divorced',
    desc: 'Separate returns, lost joint benefits, and how dependents get reallocated.',
  },
]

/**
 * Grid of selectable life-event cards.
 * @param {{selectedEvent: string|null, onSelect: (id: string) => void}} props
 */
export default function EventSelector({ selectedEvent, onSelect }) {
  return (
    <section>
      <Reveal className="section-head">
        <span className="kicker">Step 01</span>
        <h2>What's changing?</h2>
        <p>
          Six of life's biggest financial decisions, each with its own tax story. Pick one to
          model.
        </p>
      </Reveal>

      <div className="event-grid">
        {EVENTS.map((ev, i) => {
          const selected = selectedEvent === ev.id
          return (
            <Reveal key={ev.id} delay={Math.min(5, (i % 3) + 1)}>
              <button
                type="button"
                className={`event-card paper-grid${selected ? ' selected' : ''}`}
                style={{ '--accent': `var(--c-${ev.cat})` }}
                onClick={() => onSelect(ev.id)}
              >
                <div className="event-top">
                  <div>
                    <div className="event-cat">{ev.kicker}</div>
                    <div className="event-num">{ev.num}</div>
                  </div>
                  <span className="event-glyph">
                    <Glyph name={ev.glyph} size={24} />
                  </span>
                </div>
                <h3>{ev.title}</h3>
                <p>{ev.desc}</p>
                <span className="event-go">
                  Run this scenario
                  <ArrowRight size={14} />
                </span>
              </button>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}
