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
import { FONTS, labelStyle } from '../utils/theme.js'
import { formatCurrency, formatPercent } from '../utils/formatters.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

/**
 * Dark-theme palette scoped to the results section. The rest of the app stays
 * on the light cream palette in theme.js; these tokens only apply once results
 * are revealed, to make that reveal feel like a deliberate section break.
 */
const DARK = {
  wrapperBg: '#1A1A1A',
  savings: '#34D399', // bright mint — pops on dark
  cost: '#F87171', // bright coral — pops on dark
  heroSuffix: '#A1A09A',
  muted: '#9B9790',
  amount: '#F5F3ED', // cream, used as light text
  rate: '#7A7770',
  arrow: '#6B6560',
  cardBg: '#252525',
  cardBorder: '#333333',
  sectionLabel: '#7A7770',
  axisTick: '#A1A09A',
  refLine: '#444444',
  tooltipBg: '#333333',
  tooltipText: '#F5F3ED',
  tooltipBorder: '#444444',
  noteBg: '#2A2520',
  noteBorder: '#4A4030',
  noteText: '#D4A84A',
  analysisBg: '#222222',
  analysisBorder: '#333333',
  analysisAccent: '#CA8A04', // amber accent works as-is on dark
  insightText: '#D4D3CD',
  btnBorder: '#444444',
  btnText: '#A1A09A',
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
        background: DARK.tooltipBg,
        color: DARK.tooltipText,
        border: `1px solid ${DARK.tooltipBorder}`,
        fontFamily: FONTS.mono,
        fontSize: 12,
        borderRadius: 2,
        padding: '7px 10px',
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontFamily: FONTS.sans, opacity: 0.8, marginBottom: 2 }}>{item.label}</div>
      <div>{verdict}</div>
    </div>
  )
}

/**
 * Custom Recharts label rendered at the right end of each breakdown bar, so the
 * dollar value is always visible without hovering (important for the demo).
 */
function BarValueLabel({ x, y, width, height, value }) {
  if (value == null) return null
  const positive = value >= 0
  return (
    <text
      x={x + width + 6}
      y={y + height / 2}
      dy={4}
      textAnchor="start"
      fontFamily={FONTS.mono}
      fontSize={12}
      fill={positive ? DARK.savings : DARK.cost}
    >
      {formatCurrency(Math.abs(value))}
    </text>
  )
}

/** A single BEFORE/AFTER column: label, total, effective rate, and a rate bar. */
function Column({ tag, scenario, totalIncome, accent }) {
  const ratePct = totalIncome > 0 ? (scenario.total / totalIncome) * 100 : 0
  return (
    <div style={{ flex: 1, borderLeft: `3px solid ${accent}`, paddingLeft: 14 }}>
      <div style={{ ...labelStyle, fontSize: 13, color: DARK.muted, marginBottom: 8 }}>{tag}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: DARK.amount }}>
        {formatCurrency(scenario.total)}
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 13,
          color: DARK.rate,
          marginTop: 4,
        }}
      >
        {formatPercent(scenario.total, totalIncome)} effective rate
      </div>
      {/* Thin bar visualizing the effective rate — makes before/after scannable. */}
      <div
        style={{
          marginTop: 8,
          height: 4,
          background: DARK.cardBorder,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, ratePct))}%`,
            height: '100%',
            background: accent,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  )
}

/**
 * Results view: hero delta, before→after comparison, breakdown chart,
 * optional note, and the analysis insight.
 * @param {{
 *   results: import('../engine/lifeEvents.js').LifeEventResult & { insight: string },
 *   eventId: string,
 *   totalIncome: number,
 *   onTryAnother: () => void,
 * }} props
 */
export default function ResultsDashboard({ results, totalIncome, aiEnhancing, onTryAnother }) {
  const { before, after, delta, breakdown = [], note, insight } = results
  const isMobile = useMediaQuery('(max-width: 639px)')

  const saves = delta > 0
  const costs = delta < 0
  const heroColor = saves ? DARK.savings : costs ? DARK.cost : DARK.amount
  const heroLabel = saves ? '/ year saved' : costs ? '/ year more tax' : '/ year - no change'
  // Very faint glow tinted to match the verdict, so the number feels alive on dark.
  const heroGlow = saves
    ? '0 0 40px rgba(52, 211, 153, 0.15)'
    : costs
      ? '0 0 40px rgba(248, 113, 113, 0.15)'
      : 'none'

  // Count the hero number up from $0 to the final delta over ~600ms (30 frames
  // at 50ms) for a "calculator" feel. The component is re-keyed per calculation
  // in App, so it remounts with animatedDelta back at 0 and restarts cleanly.
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

  const monthly = Math.round(Math.abs(delta) / 12)

  const chartData = breakdown.filter((d) => d.value !== 0 && d.type !== 'absolute')
  const chartHeight = Math.max(120, chartData.length * 46 + 30)

  // Subtle horizontal rule used to separate the major result subsections.
  const divider = <div style={{ height: 1, background: DARK.cardBorder, margin: '24px 0' }} />

  return (
    // The dark background and section padding are owned by the full-width
    // results band in App; this section just lays out the content.
    <section>
      {/* a) Hero delta */}
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: isMobile ? 32 : 56,
          fontWeight: 700,
          color: heroColor,
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
          textShadow: heroGlow,
        }}
      >
        {formatCurrency(Math.abs(animatedDelta))}{' '}
        <span style={{ fontSize: 20, fontWeight: 400, color: DARK.heroSuffix }}>{heroLabel}</span>
      </div>

      {/* Monthly equivalent of the annual delta */}
      {delta !== 0 && (
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: 15,
            color: DARK.muted,
            marginTop: 8,
          }}
        >
          That's about {formatCurrency(monthly)}/month
        </div>
      )}

      {divider}

      {/* b) Before → After */}
      <div
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 16 : 24,
          background: DARK.cardBg,
          border: `1px solid ${DARK.cardBorder}`,
          borderRadius: 4,
          padding: 24,
        }}
      >
        <Column tag="BEFORE" scenario={before} totalIncome={totalIncome} accent={DARK.cost} />
        {!isMobile && (
          <div style={{ fontSize: 24, color: DARK.arrow, fontFamily: FONTS.sans }}>→</div>
        )}
        <Column tag="AFTER" scenario={after} totalIncome={totalIncome} accent={DARK.savings} />
      </div>

      {/* c) Breakdown chart */}
      {chartData.length > 0 && (
        <>
          {divider}
          <div>
            <div style={{ ...labelStyle, color: DARK.sectionLabel, marginBottom: 14 }}>
              Where the change comes from
            </div>
            <div
              style={{
                width: '100%',
                height: chartHeight,
                background: DARK.cardBg,
                border: `1px solid ${DARK.cardBorder}`,
                borderRadius: 4,
                padding: 20,
                boxSizing: 'border-box',
              }}
            >
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
                    tick={{ fontFamily: FONTS.sans, fontSize: 11, fill: DARK.axisTick }}
                  />
                  <ReferenceLine x={0} stroke={DARK.refLine} strokeWidth={1} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} content={<ChartTooltip />} />
                  <Bar
                    dataKey="value"
                    radius={1}
                    barSize={20}
                    isAnimationActive={false}
                    label={<BarValueLabel />}
                  >
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.value >= 0 ? DARK.savings : DARK.cost} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* d) Contextual note */}
      {note && (
        <div
          style={{
            marginTop: 28,
            background: DARK.noteBg,
            border: `1px solid ${DARK.noteBorder}`,
            borderRadius: 2,
            padding: '12px 16px',
            fontFamily: FONTS.sans,
            fontSize: 13,
            lineHeight: 1.6,
            color: DARK.noteText,
          }}
        >
          {note}
        </div>
      )}

      {/* e) Insight panel — framed as an editorial "expert quote" */}
      {insight && (
        <>
          {divider}
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: DARK.analysisBg,
              border: `1px solid ${DARK.analysisBorder}`,
              borderLeft: `3px solid ${DARK.analysisAccent}`,
              borderRadius: 2,
              padding: '18px 20px',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 12,
                left: 16,
                fontFamily: FONTS.serif,
                fontSize: 48,
                lineHeight: 1,
                color: DARK.analysisAccent,
                opacity: 0.3,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              “
            </span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ ...labelStyle, color: DARK.sectionLabel, marginBottom: 10 }}>
                Analysis
              </div>
              <p
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: isMobile ? 13.5 : 14.5,
                  lineHeight: 1.7,
                  color: DARK.insightText,
                  margin: 0,
                  paddingLeft: 0,
                }}
              >
                {insight}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Subtle AI-enhancement indicator, shown only while the call is in flight */}
      {aiEnhancing && (
        <div
          style={{
            marginTop: 12,
            fontFamily: FONTS.sans,
            fontSize: 12,
            color: DARK.sectionLabel,
          }}
        >
          ✦ Enhancing with AI…
        </div>
      )}

      {/* f) Try another */}
      <button
        type="button"
        onClick={onTryAnother}
        className="ts-btn-dark"
        style={{
          marginTop: 32,
          cursor: 'pointer',
          fontFamily: FONTS.sans,
          fontSize: 14,
          fontWeight: 500,
          color: DARK.btnText,
          background: 'transparent',
          border: `1px solid ${DARK.btnBorder}`,
          borderRadius: 2,
          padding: '11px 22px',
        }}
      >
        ← Try another life event
      </button>
    </section>
  )
}
