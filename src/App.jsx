import { useState, useRef, useEffect } from 'react'
import { COLORS, FONTS } from './utils/theme.js'
import { useMediaQuery } from './utils/useMediaQuery.js'
import { parseNumericInput } from './utils/formatters.js'
import { validateField } from './utils/validation.js'
import { calculateLifeEvent } from './engine/lifeEvents.js'
import { generateFallbackInsight } from './ai/fallbackTemplates.js'
import { fetchAIInsight } from './ai/apiClient.js'
import Disclaimer from './components/Disclaimer.jsx'
import HeroPreview from './components/HeroPreview.jsx'
import CredibilityStrip from './components/CredibilityStrip.jsx'
import CoverageSection from './components/CoverageSection.jsx'
import HowItWorks from './components/HowItWorks.jsx'
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
  // Increments once per completed calculation; drives the results scroll and
  // re-keys the dashboard so the count-up animation restarts cleanly.
  const [calcId, setCalcId] = useState(0)

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

  // Smooth-scroll once per calculation so the hero number lands roughly in the
  // upper-center of the viewport (the first thing visible after calculating).
  // Keyed on calcId, not results, so a late AI insight update doesn't re-scroll.
  useEffect(() => {
    if (calcId > 0 && resultsRef.current) {
      const top =
        resultsRef.current.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.3
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    }
  }, [calcId])

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
    setCalcId((c) => c + 1)

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
  const isMobile = useMediaQuery('(max-width: 639px)')

  // Each section is a full-width band with its own background; the inner
  // container re-centers content at 800px. hPad is the shared horizontal gutter.
  const hPad = isMobile ? 16 : 24
  const innerContainer = { maxWidth: 800, margin: '0 auto' }
  // Subtle dot-grid texture, applied only to the cream hero and form bands.
  const dotGrid = {
    backgroundImage: 'radial-gradient(circle, #D6D3CB 0.5px, transparent 0.5px)',
    backgroundSize: '24px 24px',
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.textPrimary }}>
      {/* SECTION 1 — Hero: cream + dot grid */}
      <div style={{ background: COLORS.bg, ...dotGrid }}>
        <div
          style={{
            ...innerContainer,
            padding: isMobile ? `40px ${hPad}px 48px` : `64px ${hPad}px 48px`,
          }}
        >
          <header>
            <div
              style={{
                display: 'inline-block',
                borderBottom: `2px solid ${COLORS.textPrimary}`,
                paddingBottom: 4,
                marginBottom: 16,
              }}
            >
              <span
                style={{ fontFamily: FONTS.serif, fontSize: isMobile ? 44 : 64, lineHeight: 1 }}
              >
                Tax<span style={{ fontStyle: 'italic' }}>Shift</span>
              </span>
            </div>
            <h1
              style={{
                fontFamily: FONTS.serif,
                fontSize: 30,
                fontWeight: 400,
                lineHeight: 1.3,
                color: COLORS.textPrimary,
                margin: 0,
              }}
            >
              See how your next life event
              <br />
              changes your taxes.
            </h1>
            <p
              style={{
                fontFamily: FONTS.sans,
                fontSize: 15,
                color: COLORS.textSecondary,
                margin: '12px 0 0',
              }}
            >
              Forward-looking tax estimates for life's biggest financial decisions
            </p>
          </header>

          <HeroPreview />

          <Disclaimer />
        </div>
      </div>

      {/* CREDIBILITY STRIP — compact dark data bar bridging hero and selection */}
      <CredibilityStrip />

      {/* SECTION 2 — Selection: clean white stage, faintly bordered, no dots */}
      <div
        style={{
          background: COLORS.card,
          borderTop: `1px solid ${COLORS.disclaimerBg}`,
          borderBottom: `1px solid ${COLORS.disclaimerBg}`,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            ...innerContainer,
            padding: isMobile ? `32px ${hPad}px` : `40px ${hPad}px 48px`,
          }}
        >
          <HowItWorks />
          <div style={{ marginTop: 32 }}>
            <EventSelector selectedEvent={selectedEvent} onSelect={handleSelect} />
          </div>
          <CoverageSection />
        </div>
      </div>

      {/* SECTION 3 — Form: back to warm cream + dot grid */}
      {selectedEvent && (
        <div style={{ background: COLORS.bg, ...dotGrid }}>
          <div
            ref={formRef}
            key={selectedEvent}
            className="ts-fade-in"
            style={{
              ...innerContainer,
              padding: isMobile ? `32px ${hPad}px` : `40px ${hPad}px`,
              scrollMarginTop: 24,
            }}
          >
            <InputForm
              eventId={selectedEvent}
              formData={formData}
              onChange={handleChange}
              onCalculate={handleCalculate}
              onReset={handleReset}
              errors={errors}
            />
          </div>
        </div>
      )}

      {/* SECTION 4 — Results: dramatic full-width dark band */}
      {results && (
        <div style={{ background: '#1A1A1A' }}>
          <div
            ref={resultsRef}
            key={calcId}
            className="ts-fade-in"
            style={{
              ...innerContainer,
              padding: isMobile ? `32px ${hPad}px` : `48px ${hPad}px`,
              scrollMarginTop: 24,
            }}
          >
            <ResultsDashboard
              results={results}
              eventId={selectedEvent}
              totalIncome={totalIncome}
              aiEnhancing={aiLoading}
              onTryAnother={handleReset}
            />
          </div>
        </div>
      )}

      {/* SECTION 5 — Footer: cream */}
      <div style={{ background: COLORS.bg }}>
        <div style={{ ...innerContainer, padding: `0 ${hPad}px` }}>
          <footer style={{ borderTop: `1px solid ${COLORS.border}`, padding: '20px 0 40px' }}>
            <p
              style={{
                fontFamily: FONTS.sans,
                fontSize: 12,
                color: COLORS.textSecondary,
                margin: 0,
              }}
            >
              Built for DSOC Summer Edition 2026 · Tax, Compliance &amp; Regulatory Innovation
            </p>
            <p
              style={{
                fontFamily: FONTS.sans,
                fontSize: 11,
                color: COLORS.tagMuted,
                margin: '8px 0 0',
              }}
            >
              Built with React · Recharts · Gemini · Vercel
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
