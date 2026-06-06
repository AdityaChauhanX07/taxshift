import { ALL_STATES } from '../data/stateTaxData.js'
import { EVENTS } from './EventSelector.jsx'
import HowItWorks from './HowItWorks.jsx'

/**
 * Field definitions per event. Each field carries both a render `kind` and a
 * `valueType` used for validation. Exported so App.jsx can validate and map
 * against the exact same schema.
 *
 * kind:      'currency' | 'small' | 'state' | 'filing' | 'bool'
 * valueType: 'income' | 'number' | 'percentage' (omitted for state/filing/bool)
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared field schema consumed by App.jsx
export const EVENT_FIELDS = {
  marriage: [
    { key: 'income', label: 'Your annual income', kind: 'currency', valueType: 'income', placeholder: '75,000', required: true },
    { key: 'spouseIncome', label: "Partner's annual income", kind: 'currency', valueType: 'income', placeholder: '60,000', required: true },
    { key: 'state', label: 'State', kind: 'state', required: true },
  ],
  baby: [
    { key: 'income', label: 'Annual income', kind: 'currency', valueType: 'income', placeholder: '90,000', required: true },
    { key: 'filingStatus', label: 'Current filing status', kind: 'filing', required: true },
    { key: 'state', label: 'State', kind: 'state', required: true },
    { key: 'existingChildren', label: 'Existing children', kind: 'small', valueType: 'number', placeholder: '0', required: false },
  ],
  home: [
    { key: 'income', label: 'Annual income', kind: 'currency', valueType: 'income', placeholder: '150,000', required: true },
    { key: 'filingStatus', label: 'Filing status', kind: 'filing', required: true },
    { key: 'state', label: 'State', kind: 'state', required: true },
    { key: 'homePrice', label: 'Home price', kind: 'currency', valueType: 'number', placeholder: '450,000', required: true },
    { key: 'downPayment', label: 'Down payment %', kind: 'small', valueType: 'percentage', placeholder: '20', required: true },
    { key: 'mortgageRate', label: 'Mortgage rate %', kind: 'small', valueType: 'percentage', placeholder: '6.5', required: true },
    { key: 'propertyTax', label: 'Annual property tax', kind: 'currency', valueType: 'number', placeholder: '6,000', required: true },
  ],
  move: [
    { key: 'income', label: 'Annual income', kind: 'currency', valueType: 'income', placeholder: '150,000', required: true },
    { key: 'filingStatus', label: 'Filing status', kind: 'filing', required: true },
    { key: 'currentState', label: 'Current state', kind: 'state', required: true },
    { key: 'targetState', label: 'Moving to', kind: 'state', required: true },
  ],
  sidebiz: [
    { key: 'income', label: 'W-2 income', kind: 'currency', valueType: 'income', placeholder: '80,000', required: true },
    { key: 'filingStatus', label: 'Filing status', kind: 'filing', required: true },
    { key: 'state', label: 'State', kind: 'state', required: true },
    { key: 'bizRevenue', label: 'Business revenue', kind: 'currency', valueType: 'number', placeholder: '40,000', required: true },
    { key: 'bizExpenses', label: 'Business expenses', kind: 'currency', valueType: 'number', placeholder: '10,000', required: true },
  ],
  divorce: [
    { key: 'combinedIncome', label: 'Combined household income', kind: 'currency', valueType: 'income', placeholder: '200,000', required: true },
    { key: 'myShare', label: 'Your share %', kind: 'small', valueType: 'percentage', placeholder: '50', required: true },
    { key: 'state', label: 'State', kind: 'state', required: true },
    { key: 'children', label: 'Children', kind: 'small', valueType: 'number', placeholder: '0', required: false },
    { key: 'custodyToMe', label: 'Do you have primary custody?', kind: 'bool', required: false },
  ],
}

const FILING_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'mfj', label: 'Married Filing Jointly' },
  { value: 'hoh', label: 'Head of Household' },
]

/**
 * For events with 5+ fields, the first three (income, status, state) form the
 * "basics" group and the rest are grouped under this heading.
 */
const GROUP_LABELS = {
  home: 'Property details',
  sidebiz: 'Business details',
  divorce: 'Family details',
}

/** Small downward chevron drawn inside select wrappers. */
function Chevron() {
  return (
    <span className="chev" aria-hidden="true">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  )
}

/** Right arrow for the calculate button. */
function ArrowRight() {
  return (
    <svg
      className="arr"
      width="16"
      height="16"
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

/** Strip everything but digits and a single decimal point. */
function sanitizeNumeric(raw) {
  const cleaned = String(raw).replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned
}

/**
 * Configuration-driven form for a single life event.
 * @param {{
 *   eventId: string,
 *   formData: Object,
 *   onChange: (key: string, value: any) => void,
 *   onCalculate: () => void,
 *   onReset: () => void,
 *   errors: string[],
 * }} props
 */
export default function InputForm({ eventId, formData, onChange, onCalculate, onReset, errors = [] }) {
  const fields = EVENT_FIELDS[eventId] || []
  const event = EVENTS.find((e) => e.id === eventId)
  const title = event?.title || 'Your numbers'
  const accent = event?.cat || 'amber'

  const renderField = (field) => {
    const { key, label, kind, placeholder } = field
    const value = formData[key] ?? ''

    if (kind === 'bool') {
      const current = formData[key] === true || formData[key] === undefined
      return (
        <div className="field" key={key}>
          <label>{label}</label>
          <div className="toggle">
            <button type="button" className={current ? 'on' : ''} onClick={() => onChange(key, true)}>
              Yes
            </button>
            <button type="button" className={!current ? 'on' : ''} onClick={() => onChange(key, false)}>
              No
            </button>
          </div>
        </div>
      )
    }

    if (kind === 'state' || kind === 'filing') {
      const options =
        kind === 'state'
          ? ALL_STATES.map((s) => ({ value: s.code, label: s.name }))
          : FILING_OPTIONS
      return (
        <div className="field" key={key}>
          <label>{label}</label>
          <div className="select-shell">
            <select value={value} onChange={(e) => onChange(key, e.target.value)}>
              {kind === 'state' && <option value="">Select a state…</option>}
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </div>
      )
    }

    // currency or small numeric input
    const isPercent = field.valueType === 'percentage'
    const isCurrency = kind === 'currency'
    return (
      <div className="field" key={key}>
        <label>{label}</label>
        <div className="input-shell">
          {isCurrency && <span className="pre">$</span>}
          <input
            type="text"
            inputMode="decimal"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(key, sanitizeNumeric(e.target.value))}
          />
          {isPercent && <span className="suf">%</span>}
        </div>
      </div>
    )
  }

  // Render a list of fields, pairing consecutive `small` fields side by side.
  const renderGroup = (list) => {
    const out = []
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      const next = list[i + 1]
      if (f.kind === 'small' && next && next.kind === 'small') {
        out.push(
          <div className="field-row" key={`row-${f.key}`}>
            {renderField(f)}
            {renderField(next)}
          </div>,
        )
        i++
      } else {
        out.push(renderField(f))
      }
    }
    return out
  }

  // 5+ field events split into a "basics" group (first three) and a labeled
  // second group of event-specific fields.
  const grouped = fields.length >= 5
  const group1 = grouped ? fields.slice(0, 3) : fields
  const group2 = grouped ? fields.slice(3) : []

  return (
    <div className="form-card" style={{ '--accent': `var(--c-${accent})` }}>
      <HowItWorks stage={1} />

      <h2 style={{ marginTop: 28 }}>
        {title} <span className="em">— your numbers</span>
      </h2>
      {event?.desc && <p className="form-sub">{event.desc}</p>}

      {renderGroup(group1)}

      {grouped && (
        <>
          <div className="field-group-label">{GROUP_LABELS[eventId]}</div>
          {renderGroup(group2)}
        </>
      )}

      {errors.length > 0 && (
        <div className="form-errors">
          {errors.map((err, i) => (
            <div key={i}>{err}</div>
          ))}
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCalculate} className="btn-calc">
          Calculate impact
          <ArrowRight />
        </button>
        <button type="button" onClick={onReset} className="btn-reset">
          Start over
        </button>
      </div>
    </div>
  )
}
