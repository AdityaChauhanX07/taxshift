import { useState, useRef, useEffect } from 'react'
import { COLORS, FONTS } from './utils/theme.js'
import { parseNumericInput } from './utils/formatters.js'
import { validateField } from './utils/validation.js'
import { calculateLifeEvent } from './engine/lifeEvents.js'
import { generateFallbackInsight } from './ai/fallbackTemplates.js'
import { fetchAIInsight } from './ai/apiClient.js'
import Disclaimer from './components/Disclaimer.jsx'
import EventSelector from './components/EventSelector.jsx'
import InputForm, { EVENT_FIELDS } from './components/InputForm.jsx'
import ResultsDashboard from './components/ResultsDashboard.jsx'

/** Build the default formData for a freshly selected event. */
function defaultsFor(eventId) {
  const out = {}
  for (const f of EVENT_FIELDS[eventId] || []) {
    if (f.kind === 'bool') out[f.key] = true
    else if (f.kind === 'filing') out[f.key] = 'single'
    else out[f.key] = ''
  }
  return out
}

/**
 * Translate the form's field names into the shape the engine expects.
 * @param {string} eventId
 * @param {Object} fd - raw form data
 * @returns {Object} engine-ready input
 */
function mapFormToEngine(eventId, fd) {
  const n = (v) => parseNumericInput(v)
  switch (eventId) {
    case 'marriage':
      return { yourIncome: n(fd.income), spouseIncome: n(fd.spouseIncome), state: fd.state }
    case 'baby':
      return {
        income: n(fd.income),
        filingStatus: fd.filingStatus,
        state: fd.state,
        numChildren: n(fd.existingChildren),
      }
    case 'home':
      return {
        income: n(fd.income),
        filingStatus: fd.filingStatus,
        state: fd.state,
        homePrice: n(fd.homePrice),
        downPayment: n(fd.downPayment),
        mortgageRate: n(fd.mortgageRate),
        propertyTax: n(fd.propertyTax),
      }
    case 'move':
      return {
        income: n(fd.income),
        filingStatus: fd.filingStatus,
        state: fd.currentState,
        targetState: fd.targetState,
      }
    case 'sidebiz':
      return {
        income: n(fd.income),
        filingStatus: fd.filingStatus,
        state: fd.state,
        businessRevenue: n(fd.bizRevenue),
        businessExpenses: n(fd.bizExpenses),
      }
    case 'divorce': {
      const combined = n(fd.combinedIncome)
      const yours = Math.round((combined * n(fd.myShare)) / 100)
      return {
        income: combined,
        yourIncome: yours,
        spouseIncome: combined - yours,
        numChildren: n(fd.children),
        state: fd.state,
        custodyToMe: fd.custodyToMe,
      }
    }
    default:
      return {}
  }
}

/** Total income used for effective-rate calculations, per event type. */
function computeTotalIncome(eventId, fd) {
  const n = (v) => parseNumericInput(v)
  switch (eventId) {
    case 'marriage':
      return n(fd.income) + n(fd.spouseIncome)
    case 'divorce':
      return n(fd.combinedIncome)
    case 'sidebiz':
      return n(fd.income) + Math.max(0, n(fd.bizRevenue) - n(fd.bizExpenses))
    default:
      return n(fd.income)
  }
}

export default function App() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({})
  const [results, setResults] = useState(null)
  const [errors, setErrors] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  const formRef = useRef(null)
  const resultsRef = useRef(null)
  // Monotonic token so a stale in-flight AI response can't clobber newer state.
  const aiRequestRef = useRef(0)

  // Smooth-scroll the form into view when an event is first selected.
  useEffect(() => {
    if (selectedEvent && !results && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedEvent, results])

  // Smooth-scroll to results once they're computed.
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [results])

  const handleSelect = (id) => {
    aiRequestRef.current += 1 // cancel any in-flight AI enhancement
    setAiLoading(false)
    setSelectedEvent(id)
    setFormData(defaultsFor(id))
    setResults(null)
    setErrors([])
  }

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    aiRequestRef.current += 1 // cancel any in-flight AI enhancement
    setAiLoading(false)
    setSelectedEvent(null)
    setFormData({})
    setResults(null)
    setErrors([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCalculate = () => {
    const fields = EVENT_FIELDS[selectedEvent] || []
    const found = []
    for (const f of fields) {
      if (f.kind === 'bool') continue
      const err = validateField(f.key, formData[f.key], {
        required: f.required,
        type: f.valueType,
        label: f.label,
      })
      if (err) found.push(err)
    }

    if (found.length > 0) {
      aiRequestRef.current += 1 // cancel any in-flight AI enhancement
      setAiLoading(false)
      setErrors(found)
      setResults(null)
      return
    }

    setErrors([])
    const engineInput = mapFormToEngine(selectedEvent, formData)
    const calc = calculateLifeEvent(selectedEvent, engineInput)
    const insight = generateFallbackInsight(selectedEvent, calc, engineInput)

    // Show the fallback insight instantly, then try to replace it with the AI
    // version in the background. If the call fails or times out, the fallback
    // simply stays.
    setResults({ ...calc, insight })

    const requestId = ++aiRequestRef.current
    setAiLoading(true)
    fetchAIInsight(selectedEvent, engineInput, calc).then((aiInsight) => {
      if (aiRequestRef.current !== requestId) return // a newer request superseded this one
      if (aiInsight) {
        setResults((prev) => (prev ? { ...prev, insight: aiInsight } : prev))
      }
      setAiLoading(false)
    })
  }

  const totalIncome = selectedEvent ? computeTotalIncome(selectedEvent, formData) : 0

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '36px 20px 56px' }}>
        {/* Header */}
        <header>
          <div
            style={{
              display: 'inline-block',
              borderBottom: `2px solid ${COLORS.textPrimary}`,
              paddingBottom: 4,
            }}
          >
            <span style={{ fontFamily: FONTS.serif, fontSize: 36, lineHeight: 1 }}>
              Tax<span style={{ fontStyle: 'italic' }}>Shift</span>
            </span>
          </div>
          <p
            style={{
              fontFamily: FONTS.sans,
              fontSize: 14,
              color: COLORS.textSecondary,
              margin: '12px 0 0',
            }}
          >
            See how your next life event changes your taxes — before it happens
          </p>
        </header>

        <div style={{ marginTop: 18 }}>
          <Disclaimer />
        </div>

        <div style={{ marginTop: 32 }}>
          <EventSelector selectedEvent={selectedEvent} onSelect={handleSelect} />
        </div>

        {selectedEvent && (
          <div ref={formRef} style={{ marginTop: 36, scrollMarginTop: 24 }}>
            <InputForm
              eventId={selectedEvent}
              formData={formData}
              onChange={handleChange}
              onCalculate={handleCalculate}
              onReset={handleReset}
              errors={errors}
            />
          </div>
        )}

        {results && (
          <div ref={resultsRef} style={{ marginTop: 40, scrollMarginTop: 24 }}>
            <ResultsDashboard
              results={results}
              eventId={selectedEvent}
              totalIncome={totalIncome}
              aiEnhancing={aiLoading}
              onTryAnother={handleReset}
            />
          </div>
        )}

        {/* Footer */}
        <footer
          style={{
            marginTop: 64,
            paddingTop: 16,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <p
            style={{
              fontFamily: FONTS.sans,
              fontSize: 12,
              color: COLORS.textSecondary,
              margin: 0,
            }}
          >
            TaxShift — DSOC Summer Edition 2026 · Tax, Compliance &amp; Regulatory Innovation
          </p>
        </footer>
      </div>
    </div>
  )
}
