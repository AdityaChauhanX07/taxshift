import { useState, useRef, useEffect } from 'react'
import { parseNumericInput } from './utils/formatters.js'
import { validateField } from './utils/validation.js'
import { calculateLifeEvent } from './engine/lifeEvents.js'
import { generateFallbackInsight } from './ai/fallbackTemplates.js'
import { fetchAIInsight } from './ai/apiClient.js'
import Nav, { Wordmark } from './components/Nav.jsx'
import Reveal from './components/Reveal.jsx'
import Disclaimer from './components/Disclaimer.jsx'
import HeroPreview from './components/HeroPreview.jsx'
import CredibilityStrip from './components/CredibilityStrip.jsx'
import CoverageSection from './components/CoverageSection.jsx'
import HowItWorks from './components/HowItWorks.jsx'
import EventSelector, { EVENTS } from './components/EventSelector.jsx'
import InputForm, { EVENT_FIELDS } from './components/InputForm.jsx'
import ResultsDashboard from './components/ResultsDashboard.jsx'

/** Small inline right-arrow for the hero's primary button. */
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

  const selectorRef = useRef(null)
  const formRef = useRef(null)
  const resultsRef = useRef(null)
  // Monotonic token so a stale in-flight AI response can't clobber newer state.
  const aiRequestRef = useRef(0)

  // Smooth-scroll to the event selector (used by the nav CTA and hero buttons).
  const goToSelector = () => {
    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
  // Category accent (dark variant) for the results glow, keyed to the event.
  const selectedCat = EVENTS.find((e) => e.id === selectedEvent)?.cat || 'amber'

  return (
    <>
      <Nav onDark={!!results} onStart={goToSelector} />

      {/* HERO — light editorial, two columns */}
      <section className="hero band paper-grid" id="top">
        <div className="wrap hero-grid">
          <div>
            <Reveal className="hero-eyebrow">
              <span className="pulse" />
              <span className="kicker">Forward-looking tax estimator</span>
            </Reveal>
            <Reveal as="h1" delay={1}>
              See how your next <span className="em">life event</span>
              <br />
              changes your <span className="u">taxes</span>.
            </Reveal>
            <Reveal as="p" className="hero-sub" delay={2}>
              Most tax tools look backward at what you owe. TaxShift looks forward — pick a
              decision, enter a few numbers, and watch the before-and-after.
            </Reveal>
            <Reveal className="hero-actions" delay={3}>
              <button type="button" className="btn btn-primary" onClick={goToSelector}>
                Estimate my shift
                <ArrowRight />
              </button>
              <button type="button" className="btn btn-ghost" onClick={goToSelector}>
                Browse life events
              </button>
            </Reveal>
          </div>
          <Reveal delay={2}>
            <HeroPreview />
          </Reveal>
        </div>
      </section>

      {/* Transition: hero paper → ticker void */}
      <div className="fade-to-dark" aria-hidden="true" />

      {/* CREDIBILITY TICKER — dark marquee */}
      <CredibilityStrip />

      {/* Transition: ticker void → selector paper */}
      <div className="fade-to-light" aria-hidden="true" />

      {/* SELECTOR — event grid + specs */}
      <section className="band paper-grid" ref={selectorRef}>
        <div className="wrap section">
          <Reveal>
            <HowItWorks stage={0} />
          </Reveal>
          <EventSelector selectedEvent={selectedEvent} onSelect={handleSelect} />
          <CoverageSection />
        </div>
      </section>

      {/* FORM */}
      {selectedEvent && (
        <section className="form-band band paper-grid" ref={formRef} key={selectedEvent}>
          <div className="wrap">
            <InputForm
              eventId={selectedEvent}
              formData={formData}
              onChange={handleChange}
              onCalculate={handleCalculate}
              onReset={handleReset}
              errors={errors}
            />
          </div>
        </section>
      )}

      {/* Transition: form paper → results void */}
      {results && <div className="fade-to-dark" aria-hidden="true" />}

      {/* RESULTS — dramatic dark reveal */}
      {results && (
        <section
          className="results"
          ref={resultsRef}
          key={calcId}
          style={{ '--accent-d': `var(--c-${selectedCat}-d)` }}
        >
          <div className="wrap">
            <ResultsDashboard
              results={results}
              eventId={selectedEvent}
              totalIncome={totalIncome}
              aiEnhancing={aiLoading}
              onTryAnother={handleReset}
            />
          </div>
        </section>
      )}

      {/* Transition: results void → footer paper */}
      {results && <div className="fade-to-light" aria-hidden="true" />}

      {/* FOOTER */}
      <footer className="band paper-grid footer">
        <div className="wrap">
          <Disclaimer />
          <div className="footer-row">
            <Wordmark fontSize={22} />
            <div className="meta">
              Built for <b>DSOC Summer Edition 2026</b> · Tax, Compliance &amp; Regulatory
              Innovation
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
