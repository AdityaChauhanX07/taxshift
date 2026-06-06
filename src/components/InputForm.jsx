import { COLORS, FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'
import { ALL_STATES } from '../data/stateTaxData.js'
import { EVENTS } from './EventSelector.jsx'

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
    <span className="ts-chevron" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6 L8 10 L12 6" />
      </svg>
    </span>
  )
}

/** Strip everything but digits and a single decimal point. */
function sanitizeNumeric(raw) {
  const cleaned = String(raw).replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned
}

const labelAbove = {
  display: 'block',
  fontFamily: FONTS.sans,
  fontSize: 13,
  fontWeight: 500,
  color: COLORS.textPrimary,
  marginBottom: 6,
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
  const isMobile = useMediaQuery('(max-width: 639px)')
  const fields = EVENT_FIELDS[eventId] || []
  const title = EVENTS.find((e) => e.id === eventId)?.title || 'Your numbers'

  const renderField = (field) => {
    const { key, label, kind, placeholder } = field
    const value = formData[key] ?? ''

    if (kind === 'bool') {
      const current = formData[key] === true || formData[key] === undefined
      const options = [
        { v: true, t: 'Yes' },
        { v: false, t: 'No' },
      ]
      return (
        <div key={key} style={{ flexBasis: '100%' }}>
          <span style={labelAbove}>{label}</span>
          {/* Connected toggle group — reads as one control, not two buttons. */}
          <div style={{ display: 'flex' }}>
            {options.map((opt, i) => {
              const active = current === opt.v
              return (
                <button
                  key={opt.t}
                  type="button"
                  onClick={() => onChange(key, opt.v)}
                  style={{
                    cursor: 'pointer',
                    fontFamily: FONTS.sans,
                    fontSize: 13,
                    fontWeight: 500,
                    padding: '10px 24px',
                    borderRadius: i === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
                    border: `1px solid ${active ? COLORS.textPrimary : COLORS.border}`,
                    marginLeft: i === 0 ? 0 : -1,
                    position: 'relative',
                    zIndex: active ? 1 : 0,
                    background: active ? COLORS.textPrimary : COLORS.inputBg,
                    color: active ? COLORS.selectedText : COLORS.textSecondary,
                    transition: 'background 150ms ease',
                  }}
                >
                  {opt.t}
                </button>
              )
            })}
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
        <div key={key} style={{ flexBasis: '100%' }}>
          <label style={labelAbove}>{label}</label>
          <div className="ts-select-wrap">
            <select
              className="ts-field ts-field--select"
              value={value}
              onChange={(e) => onChange(key, e.target.value)}
            >
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
    const small = kind === 'small'
    const inputClass = `ts-field${isCurrency ? ' ts-field--currency' : ''}${
      isPercent ? ' ts-field--percent' : ''
    }`
    const adornment = {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      fontFamily: FONTS.mono,
      fontSize: 14,
      color: COLORS.textSecondary,
      pointerEvents: 'none',
    }

    return (
      <div key={key} style={{ flexBasis: small && !isMobile ? 'calc(50% - 8px)' : '100%' }}>
        <label style={labelAbove}>{label}</label>
        <div style={{ position: 'relative' }}>
          {isCurrency && <span style={{ ...adornment, left: 14 }}>$</span>}
          <input
            className={inputClass}
            type="text"
            inputMode="decimal"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(key, sanitizeNumeric(e.target.value))}
          />
          {isPercent && <span style={{ ...adornment, right: 14 }}>%</span>}
        </div>
      </div>
    )
  }

  // Container for a row of fields (flex-wrap so small fields can pair up).
  const fieldRow = { display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }
  // 5+ field events split into a "basics" group (first three) and a labeled
  // second group of event-specific fields.
  const grouped = fields.length >= 5
  const group1 = grouped ? fields.slice(0, 3) : fields
  const group2 = grouped ? fields.slice(3) : []

  return (
    <section
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderTop: `2px solid ${COLORS.accent}`,
        borderRadius: 2,
        padding: isMobile ? 16 : 28,
      }}
    >
      <h2
        style={{
          fontFamily: FONTS.serif,
          fontSize: 24,
          fontWeight: 400,
          color: COLORS.textPrimary,
          margin: '0 0 22px',
        }}
      >
        {title} - your numbers
      </h2>

      <div style={fieldRow}>{group1.map(renderField)}</div>

      {grouped && (
        <>
          <div style={{ height: 1, background: COLORS.panelBorder, margin: '20px 0' }} />
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: COLORS.tagMuted,
              marginBottom: 12,
            }}
          >
            {GROUP_LABELS[eventId]}
          </div>
          <div style={fieldRow}>{group2.map(renderField)}</div>
        </>
      )}

      {errors.length > 0 && (
        <div
          style={{
            marginTop: 20,
            background: COLORS.errorBg,
            border: `1px solid ${COLORS.errorBorder}`,
            borderRadius: 2,
            padding: '12px 14px',
          }}
        >
          {errors.map((err, i) => (
            <div
              key={i}
              style={{
                fontFamily: FONTS.sans,
                fontSize: 13,
                color: COLORS.cost,
                lineHeight: 1.6,
              }}
            >
              {err}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button
          type="button"
          onClick={onCalculate}
          className="ts-btn-primary"
          style={{
            cursor: 'pointer',
            fontFamily: FONTS.sans,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.bg,
            background: COLORS.textPrimary,
            border: `1px solid ${COLORS.textPrimary}`,
            borderRadius: 2,
            padding: '11px 22px',
          }}
        >
          Calculate impact
        </button>
        <button
          type="button"
          onClick={onReset}
          className="ts-btn-secondary"
          style={{
            cursor: 'pointer',
            fontFamily: FONTS.sans,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.textSecondary,
            background: 'transparent',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 2,
            padding: '11px 22px',
          }}
        >
          Start over
        </button>
      </div>
    </section>
  )
}
