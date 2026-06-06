import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import { formatCurrency, formatPercent } from '../utils/formatters.js'
import { EVENTS } from './EventSelector.jsx'
import Reveal from './Reveal.jsx'

// Font-family strings matching the design system (kept local so this file never
// depends on the theme tokens, which still describe the old typography).
const MONO = "'IBM Plex Mono', ui-monospace, monospace"
const SANS = "'Schibsted Grotesk', system-ui, sans-serif"

// Dark "reveal" palette, aligned with the CSS custom properties.
const D = {
  save: '#46d98a',
  cost: '#f0795f',
  panelBg: '#161614',
  panelBorder: '#2a2925',
  axisTick: '#a8a497',
  refLine: '#2a2925',
  tooltipBg: '#1f1e1b',
  tooltipText: '#f3f1ea',
}

/** Custom chart tooltip showing "Saves $X" / "Costs $X" in mono. */
function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload
  const v = item.value
  const verdict = v >= 0 ? `Saves ${formatCurrency(v)}` : `Costs ${formatCurrency(Math.abs(v))}`
  return (
    <div
      style={{
        background: D.tooltipBg,
        color: D.tooltipText,
        border: `1px solid ${D.panelBorder}`,
        fontFamily: MONO,
        fontSize: 12,
        borderRadius: 6,
        padding: '7px 10px',
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontFamily: SANS, opacity: 0.8, marginBottom: 2 }}>{item.label}</div>
      <div>{verdict}</div>
    </div>
  )
}

/** Dollar value rendered at the right end of each breakdown bar. */
function BarValueLabel({ x, y, width, height, value }) {
  if (value == null) return null
  const positive = value >= 0
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dy={4}
      textAnchor="start"
      fontFamily={MONO}
      fontSize={12}
      fill={positive ? D.save : D.cost}
    >
      {formatCurrency(Math.abs(value))}
    </text>
  )
}

/** One BEFORE/AFTER block: label, total, effective rate, and an animated bar. */
function Block({ tag, kind, scenario, totalIncome, widthPct }) {
  return (
    <div className={`ba-block ${kind}`}>
      <div className="lbl">{tag}</div>
      <div className="amt">{formatCurrency(scenario.total)}</div>
      <div className="sub">{formatPercent(scenario.total, totalIncome)} effective rate</div>
      <div className="rate-bar">
        <div className={`rate-fill ${kind}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  )
}

/**
 * Results view (dark reveal): hero delta, before→after comparison, breakdown
 * chart, optional note, and the analysis insight. Rendered inside App's
 * `.results` section, so this component owns only the inner content.
 * @param {{
 *   results: import('../engine/lifeEvents.js').LifeEventResult & { insight: string },
 *   eventId: string,
 *   totalIncome: number,
 *   aiEnhancing: boolean,
 *   onTryAnother: () => void,
 * }} props
 */
export default function ResultsDashboard({ results, eventId, totalIncome, aiEnhancing, onTryAnother }) {
  const { before, after, delta, breakdown = [], note, insight } = results
  const event = EVENTS.find((e) => e.id === eventId)

  const saves = delta > 0
  const costs = delta < 0
  const negClass = costs ? ' neg' : ''
  const heroLabel = saves ? 'saved' : costs ? 'added' : 'no change'

  // Count the hero number up from $0 to the final delta over ~600ms (30 frames
  // at 50ms) for a "calculator" feel. Re-keyed per calculation in App, so it
  // remounts at 0 and restarts cleanly.
  const [animatedDelta, setAnimatedDelta] = useState(0)
  useEffect(() => {
    const frames = 30
    const step = delta / frames
    let current = 0
    let frame = 0
    const id = setInterval(() => {
      frame += 1
      current += step
      if (frame >= frames) {
        setAnimatedDelta(delta)
        clearInterval(id)
      } else {
        setAnimatedDelta(Math.round(current))
      }
    }, 50)
    return () => clearInterval(id)
  }, [delta])

  // Drive the before/after rate bars from 0 → final width on mount so the CSS
  // width transition plays.
  const [barsIn, setBarsIn] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setBarsIn(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const beforeRate = totalIncome > 0 ? before.total / totalIncome : 0
  const afterRate = totalIncome > 0 ? after.total / totalIncome : 0
  const maxRate = Math.max(beforeRate, afterRate, 0.001)
  const beforeWidth = barsIn ? Math.min(100, (beforeRate / maxRate) * 100) : 0
  const afterWidth = barsIn ? Math.min(100, (afterRate / maxRate) * 100) : 0

  const monthly = Math.round(Math.abs(delta) / 12)

  const chartData = breakdown.filter((d) => d.value !== 0 && d.type !== 'absolute')
  const chartHeight = Math.max(120, chartData.length * 46 + 40)

  return (
    <div className="results-inner">
      <Reveal>
        <span className="kicker on-dark">
          {event ? `${event.kicker} · ${event.title}` : 'Your result'}
        </span>
      </Reveal>

      {/* Hero number */}
      <Reveal className="result-headline" delay={1} style={{ marginTop: 18 }}>
        <span className={`result-big${negClass}`}>{formatCurrency(Math.abs(animatedDelta))}</span>
        <span className="result-unit">
          / year <b>{heroLabel}</b>
        </span>
      </Reveal>
      {delta !== 0 && (
        <Reveal as="p" className="result-context" delay={2}>
          {saves
            ? `That's about $${monthly.toLocaleString()} a month back in your pocket.`
            : `That's about $${monthly.toLocaleString()} a month of additional tax to plan for.`}
        </Reveal>
      )}

      <div className="rule" />

      {/* Before / After */}
      <Reveal>
        <span className="kicker on-dark">The two scenarios</span>
      </Reveal>
      <Reveal className="ba-panel" delay={1} style={{ marginTop: 22 }}>
        <Block
          tag="Before — today"
          kind="before"
          scenario={before}
          totalIncome={totalIncome}
          widthPct={beforeWidth}
        />
        <div className="ba-mid">→</div>
        <Block
          tag={`After — ${event ? event.title.toLowerCase() : 'the change'}`}
          kind="after"
          scenario={after}
          totalIncome={totalIncome}
          widthPct={afterWidth}
        />
      </Reveal>

      {/* Breakdown chart */}
      {chartData.length > 0 && (
        <>
          <div className="rule" />
          <Reveal>
            <span className="kicker on-dark">Where the change comes from</span>
          </Reveal>
          <Reveal delay={1} style={{ marginTop: 22 }}>
            <div className="breakdown-panel" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 70, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={180}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontFamily: SANS, fontSize: 11, fill: D.axisTick }}
                  />
                  <ReferenceLine x={0} stroke={D.refLine} strokeWidth={1} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} content={<ChartTooltip />} />
                  <Bar
                    dataKey="value"
                    radius={2}
                    barSize={20}
                    isAnimationActive={false}
                    label={<BarValueLabel />}
                  >
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.value >= 0 ? D.save : D.cost} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Reveal>
        </>
      )}

      {/* Contextual note */}
      {note && <div className="result-note">{note}</div>}

      <div className="rule" />

      {/* Analysis insight */}
      {insight && (
        <Reveal className="analysis" delay={1}>
          <div className="a-head">
            <span className="a-tag">❝ Analysis</span>
            <span className="a-badge">Plain English</span>
          </div>
          <p>{insight}</p>
        </Reveal>
      )}

      {/* AI-enhancement indicator, shown only while the call is in flight */}
      {aiEnhancing && <div className="ai-enhancing">✦ Enhancing with AI…</div>}

      {/* Try another */}
      <Reveal className="result-actions" delay={2}>
        <button type="button" onClick={onTryAnother} className="btn-back">
          ← Try another life event
        </button>
      </Reveal>
    </div>
  )
}
