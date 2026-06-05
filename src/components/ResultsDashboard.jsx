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
import { COLORS, FONTS, labelStyle } from '../utils/theme.js'
import { formatCurrency, formatPercent } from '../utils/formatters.js'

/** Custom chart tooltip showing "Saves $X" / "Costs $X" in mono. */
function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload
  const v = item.value
  const verdict = v >= 0 ? `Saves ${formatCurrency(v)}` : `Costs ${formatCurrency(Math.abs(v))}`
  return (
    <div
      style={{
        background: COLORS.textPrimary,
        color: COLORS.bg,
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

/** A single BEFORE/AFTER column: label, total, and effective rate. */
function Column({ tag, scenario, totalIncome }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ ...labelStyle, fontSize: 13, marginBottom: 8 }}>{tag}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: COLORS.textPrimary }}>
        {formatCurrency(scenario.total)}
      </div>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: 13,
          color: COLORS.textSecondary,
          marginTop: 4,
        }}
      >
        {formatPercent(scenario.total, totalIncome)} effective rate
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

  const saves = delta > 0
  const costs = delta < 0
  const heroColor = saves ? COLORS.savings : costs ? COLORS.cost : COLORS.textSecondary
  const sign = saves ? '−' : costs ? '+' : ''
  const heroLabel = saves ? '/ year saved' : costs ? '/ year more tax' : '/ year — no change'

  const chartData = breakdown.filter((d) => d.value !== 0 && d.type !== 'absolute')
  const chartHeight = Math.max(120, chartData.length * 46 + 30)

  return (
    <section>
      {/* a) Hero delta */}
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 48,
          fontWeight: 700,
          color: heroColor,
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
        }}
      >
        {sign}
        {formatCurrency(Math.abs(delta))}{' '}
        <span style={{ fontSize: 20, fontWeight: 400 }}>{heroLabel}</span>
      </div>

      {/* b) Before → After */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          marginTop: 28,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 2,
          padding: '20px 24px',
        }}
      >
        <Column tag="BEFORE" scenario={before} totalIncome={totalIncome} />
        <div style={{ fontSize: 24, color: COLORS.textSecondary, fontFamily: FONTS.sans }}>→</div>
        <Column tag="AFTER" scenario={after} totalIncome={totalIncome} />
      </div>

      {/* c) Breakdown chart */}
      {chartData.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ ...labelStyle, marginBottom: 14 }}>Where the change comes from</div>
          <div style={{ width: '100%', height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <XAxis type="number" hide domain={['dataMin', 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={180}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontFamily: FONTS.sans, fontSize: 11, fill: COLORS.textSecondary }}
                />
                <ReferenceLine x={0} stroke={COLORS.textPrimary} strokeWidth={1} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<ChartTooltip />} />
                <Bar dataKey="value" radius={1} barSize={20} isAnimationActive={false}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.value >= 0 ? COLORS.savings : COLORS.cost} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* d) Contextual note */}
      {note && (
        <div
          style={{
            marginTop: 28,
            background: COLORS.noteBg,
            border: `1px solid ${COLORS.noteBorder}`,
            borderRadius: 2,
            padding: '12px 16px',
            fontFamily: FONTS.sans,
            fontSize: 13,
            lineHeight: 1.6,
            color: COLORS.noteText,
          }}
        >
          {note}
        </div>
      )}

      {/* e) Insight panel */}
      {insight && (
        <div
          style={{
            marginTop: 28,
            background: COLORS.inputBg,
            border: `1px solid ${COLORS.panelBorder}`,
            borderLeft: `3px solid ${COLORS.accent}`,
            borderRadius: 2,
            padding: '18px 20px',
          }}
        >
          <div style={{ ...labelStyle, marginBottom: 10 }}>Analysis</div>
          <p
            style={{
              fontFamily: FONTS.sans,
              fontSize: 14.5,
              lineHeight: 1.7,
              color: COLORS.textPrimary,
              margin: 0,
            }}
          >
            {insight}
          </p>
        </div>
      )}

      {/* Subtle AI-enhancement indicator, shown only while the call is in flight */}
      {aiEnhancing && (
        <div
          style={{
            marginTop: 12,
            fontFamily: FONTS.sans,
            fontSize: 12,
            color: COLORS.tagMuted,
          }}
        >
          ✦ Enhancing with AI…
        </div>
      )}

      {/* f) Try another */}
      <button
        type="button"
        onClick={onTryAnother}
        style={{
          marginTop: 32,
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
        ← Try another life event
      </button>
    </section>
  )
}
