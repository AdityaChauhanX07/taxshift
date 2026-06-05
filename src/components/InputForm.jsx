import { useState } from 'react'
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

/** Strip everything but digits and a single decimal point. */
function sanitizeNumeric(raw) {
  const cleaned = String(raw).replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned
}

const inputBase = {
  fontFamily: FONTS.mono,
  fontSize: 14,
  color: COLORS.textPrimary,
  background: COLORS.inputBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 2,
  padding: '9px 11px',
  outline: 'none',
  boxSizing: 'border-box',
  width: '100%',
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
  const [focusedKey, setFocusedKey] = useState(null)
  const isMobile = useMediaQuery('(max-width: 639px)')
  const fields = EVENT_FIELDS[eventId] || []
  const title = EVENTS.find((e) => e.id === eventId)?.title || 'Your numbers'

  const renderField = (field) => {
    const { key, label, kind, placeholder } = field
    const value = formData[key] ?? ''
    const focused = focusedKey === key
    const borderColor = focused ? COLORS.textPrimary : COLORS.border

    if (kind === 'bool') {
      const current = formData[key] === true || formData[key] === undefined
      return (
        <div key={key} style={{ flexBasis: '100%' }}>
          <span style={labelAbove}>{label}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: true, t: 'Yes' },
              { v: false, t: 'No' },
            ].map((opt) => {
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
                    padding: '8px 20px',
                    borderRadius: 2,
                    border: `1px solid ${active ? COLORS.textPrimary : COLORS.border}`,
                    background: active ? COLORS.textPrimary : 'transparent',
                    color: active ? COLORS.selectedText : COLORS.textSecondary,
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
          <select
            value={value}
            onChange={(e) => onChange(key, e.target.value)}
            onFocus={() => setFocusedKey(key)}
            onBlur={() => setFocusedKey(null)}
            style={{
              ...inputBase,
              fontFamily: FONTS.sans,
              borderColor,
              cursor: 'pointer',
            }}
          >
            {kind === 'state' && <option value="">Select a state…</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )
    }

    // currency or small numeric input
    const isPercent = field.valueType === 'percentage'
    const isCurrency = kind === 'currency'
    const small = kind === 'small'

    return (
      <div key={key} style={{ flexBasis: small && !isMobile ? 120 : '100%' }}>
        <label style={labelAbove}>{label}</label>
        <div style={{ position: 'relative' }}>
          {isCurrency && (
            <span
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: COLORS.textSecondary,
                pointerEvents: 'none',
              }}
            >
              $
            </span>
          )}
          <input
            type="text"
            inputMode="decimal"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(key, sanitizeNumeric(e.target.value))}
            onFocus={() => setFocusedKey(key)}
            onBlur={() => setFocusedKey(null)}
            style={{
              ...inputBase,
              borderColor,
              paddingLeft: isCurrency ? 22 : 11,
              paddingRight: isPercent ? 26 : 11,
            }}
          />
          {isPercent && (
            <span
              style={{
                position: 'absolute',
                right: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                fontFamily: FONTS.mono,
                fontSize: 14,
                color: COLORS.textSecondary,
                pointerEvents: 'none',
              }}
            >
              %
            </span>
          )}
        </div>
      </div>
    )
  }

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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
        {fields.flatMap((field) => {
          const el = renderField(field)
          // For longer forms, divide the common fields from the event-specific
          // ones with a thin full-width rule after the state selector.
          if (fields.length >= 5 && field.key === 'state') {
            return [
              el,
              <div
                key={`${field.key}-divider`}
                style={{ flexBasis: '100%', height: 1, background: COLORS.border, margin: '4px 0' }}
              />,
            ]
          }
          return [el]
        })}
      </div>

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
