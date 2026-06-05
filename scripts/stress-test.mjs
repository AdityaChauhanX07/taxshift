/**
 * Stress test for TaxShift's engine + fallback insight generator.
 *
 * Runs calculateLifeEvent (src/engine/lifeEvents.js) and
 * generateFallbackInsight (src/ai/fallbackTemplates.js) across a wide range of
 * scenarios, asserts invariants on each, and prints a results table + summary.
 *
 * Run with:  node scripts/stress-test.mjs
 */
import { calculateLifeEvent } from '../src/engine/lifeEvents.js'
import { generateFallbackInsight } from '../src/ai/fallbackTemplates.js'
import { NO_TAX_STATES } from '../src/data/stateTaxData.js'

/** Helper: build divorce engine input from a combined income + your-share %. */
function divorceInput(combined, sharePct, state, kids, custodyToMe) {
  const yours = Math.round((combined * sharePct) / 100)
  return {
    income: combined,
    yourIncome: yours,
    spouseIncome: combined - yours,
    numChildren: kids,
    state,
    custodyToMe,
  }
}

// ---------------------------------------------------------------------------
// Test catalog. Each entry: { event, summary, input }
// `input` is engine-shaped (same object App.jsx feeds to both functions).
// ---------------------------------------------------------------------------
const tests = [
  // MARRIAGE
  { event: 'marriage', summary: 'Equal high $200K+$200K CA', input: { yourIncome: 200000, spouseIncome: 200000, state: 'CA' } },
  { event: 'marriage', summary: 'Very unequal $300K+$0 TX', input: { yourIncome: 300000, spouseIncome: 0, state: 'TX' } },
  { event: 'marriage', summary: 'Both low $25K+$25K FL', input: { yourIncome: 25000, spouseIncome: 25000, state: 'FL' } },
  { event: 'marriage', summary: 'One at cap $500K+$50K NY', input: { yourIncome: 500000, spouseIncome: 50000, state: 'NY' } },
  { event: 'marriage', summary: 'Both zero $0+$0 AZ', input: { yourIncome: 0, spouseIncome: 0, state: 'AZ' } },

  // BABY
  { event: 'baby', summary: 'Single 0 kids $80K AZ (→HoH)', input: { income: 80000, filingStatus: 'single', state: 'AZ', numChildren: 0 } },
  { event: 'baby', summary: 'MFJ 2 kids $150K IL', input: { income: 150000, filingStatus: 'mfj', state: 'IL', numChildren: 2 } },
  { event: 'baby', summary: 'Single 0 kids $0 OH', input: { income: 0, filingStatus: 'single', state: 'OH', numChildren: 0 } },
  { event: 'baby', summary: 'Single 0 kids $250K CA (CTC phaseout)', input: { income: 250000, filingStatus: 'single', state: 'CA', numChildren: 0 } },
  { event: 'baby', summary: 'HoH 3 kids $90K PA', input: { income: 90000, filingStatus: 'hoh', state: 'PA', numChildren: 3 } },

  // HOME
  { event: 'home', summary: 'High inc $200K single NY $800K home', input: { income: 200000, filingStatus: 'single', state: 'NY', homePrice: 800000, downPayment: 20, mortgageRate: 6.5, propertyTax: 15000 } },
  { event: 'home', summary: 'Low inc $60K single AZ $200K home', input: { income: 60000, filingStatus: 'single', state: 'AZ', homePrice: 200000, downPayment: 10, mortgageRate: 7, propertyTax: 2000 } },
  { event: 'home', summary: 'MFJ $300K CA $1M home (SALT)', input: { income: 300000, filingStatus: 'mfj', state: 'CA', homePrice: 1000000, downPayment: 20, mortgageRate: 6.5, propertyTax: 20000 } },
  { event: 'home', summary: 'Zero down $100K single TX $350K home', input: { income: 100000, filingStatus: 'single', state: 'TX', homePrice: 350000, downPayment: 0, mortgageRate: 7.5, propertyTax: 5000 } },

  // MOVE
  { event: 'move', summary: 'CA→TX $150K single', input: { income: 150000, filingStatus: 'single', state: 'CA', targetState: 'TX' } },
  { event: 'move', summary: 'TX→CA $150K single (mirror of CA→TX)', input: { income: 150000, filingStatus: 'single', state: 'TX', targetState: 'CA' } },
  { event: 'move', summary: 'NY→FL $200K mfj', input: { income: 200000, filingStatus: 'mfj', state: 'NY', targetState: 'FL' } },
  { event: 'move', summary: 'PA→OH $80K single', input: { income: 80000, filingStatus: 'single', state: 'PA', targetState: 'OH' } },
  { event: 'move', summary: 'WY→WY $100K single (same state)', input: { income: 100000, filingStatus: 'single', state: 'WY', targetState: 'WY' } },

  // SIDEBIZ
  { event: 'sidebiz', summary: 'Profitable $80K W2 AZ rev50K exp10K', input: { income: 80000, filingStatus: 'single', state: 'AZ', businessRevenue: 50000, businessExpenses: 10000 } },
  { event: 'sidebiz', summary: 'Break-even $90K W2 IL rev20K exp20K', input: { income: 90000, filingStatus: 'single', state: 'IL', businessRevenue: 20000, businessExpenses: 20000 } },
  { event: 'sidebiz', summary: 'High rev $100K W2 mfj GA rev100K exp5K', input: { income: 100000, filingStatus: 'mfj', state: 'GA', businessRevenue: 100000, businessExpenses: 5000 } },
  { event: 'sidebiz', summary: 'Minimal $50K W2 PA rev5K exp1K', input: { income: 50000, filingStatus: 'single', state: 'PA', businessRevenue: 5000, businessExpenses: 1000 } },

  // DIVORCE
  { event: 'divorce', summary: 'Equal $200K 50% NY 0 kids', input: divorceInput(200000, 50, 'NY', 0, false) },
  { event: 'divorce', summary: 'Unequal $250K 70% CA 2 kids custody-me', input: divorceInput(250000, 70, 'CA', 2, true) },
  { event: 'divorce', summary: 'Low inc $60K 50% TX 3 kids custody-me', input: divorceInput(60000, 50, 'TX', 3, true) },
  { event: 'divorce', summary: 'High equal $400K 50% IL 0 kids', input: divorceInput(400000, 50, 'IL', 0, false) },

  // EDGE: engine receives >$500K (UI validation bypassed)
  { event: 'marriage', summary: 'EDGE $500K+$500K (no validation)', input: { yourIncome: 500000, spouseIncome: 500000, state: 'CA' } },
]

// ---------------------------------------------------------------------------
// Assertion runner
// ---------------------------------------------------------------------------
function runOne(event, input) {
  const problems = []
  let result
  let insight
  let insightOk = false

  try {
    result = calculateLifeEvent(event, input)
  } catch (err) {
    return { problems: [`EXCEPTION in calculateLifeEvent: ${err.stack || err}`], result: null, insight: null, insightOk: false }
  }

  const { before, after, delta, breakdown } = result

  // before/after totals are non-negative integers
  for (const [tag, sc] of [['before', before], ['after', after]]) {
    if (!sc || !Number.isInteger(sc.total)) problems.push(`${tag}.total is not an integer: ${sc && sc.total}`)
    else if (sc.total < 0) problems.push(`${tag}.total is negative: ${sc.total}`)
  }

  // delta === before.total - after.total
  if (before && after && delta !== before.total - after.total) {
    problems.push(`delta (${delta}) !== before.total - after.total (${before.total - after.total})`)
  }

  // breakdown is a non-empty array
  if (!Array.isArray(breakdown) || breakdown.length === 0) {
    problems.push(`breakdown is not a non-empty array`)
  }

  // insight is a non-empty string, generated without error
  try {
    insight = generateFallbackInsight(event, result, input)
    insightOk = typeof insight === 'string' && insight.trim().length > 0
    if (!insightOk) problems.push(`insight is empty or not a string`)
  } catch (err) {
    problems.push(`EXCEPTION in generateFallbackInsight: ${err.stack || err}`)
  }

  return { problems, result, insight, insightOk }
}

// ---------------------------------------------------------------------------
// Main: run catalog, print table
// ---------------------------------------------------------------------------
const rows = []
let passed = 0
const failures = []

tests.forEach((t, i) => {
  const n = i + 1
  const { problems, result, insightOk } = runOne(t.event, t.input)
  const ok = problems.length === 0
  if (ok) passed++
  else failures.push({ n, ...t, problems })

  rows.push({
    '#': n,
    event: t.event,
    inputs: t.summary,
    before: result ? result.before.total : 'ERR',
    after: result ? result.after.total : 'ERR',
    delta: result ? result.delta : 'ERR',
    insight: insightOk ? 'ok' : 'FAIL',
    pass: ok ? 'PASS' : 'FAIL',
  })
})

console.log('\n=== TaxShift engine + insight stress test ===\n')
console.table(rows)

// ---------------------------------------------------------------------------
// Special grouped assertions
// ---------------------------------------------------------------------------
console.log('\n--- Special check 29: CA → each of the 9 no-tax states @ $100K (deltas should all match) ---')
const noTaxDeltas = NO_TAX_STATES.map((st) => {
  const r = calculateLifeEvent('move', { income: 100000, filingStatus: 'single', state: 'CA', targetState: st })
  return { target: st, before: r.before.total, after: r.after.total, delta: r.delta }
})
console.table(noTaxDeltas)
const uniqueDeltas = [...new Set(noTaxDeltas.map((d) => d.delta))]
console.log(uniqueDeltas.length === 1
  ? `  ✓ All 9 no-tax targets return identical delta = ${uniqueDeltas[0]}`
  : `  ✗ Deltas differ across no-tax states: ${uniqueDeltas.join(', ')}`)

console.log('\n--- Special check 30: TX → progressive states @ $100K (log each state tax) ---')
const progDeltas = ['CA', 'NY', 'NJ', 'OH'].map((st) => {
  const r = calculateLifeEvent('move', { income: 100000, filingStatus: 'single', state: 'TX', targetState: st })
  // before.state is TX (0); after.state is the destination state tax.
  return { target: st, txStateTax: r.before.state, destStateTax: r.after.state, delta: r.delta }
})
console.table(progDeltas)

// ---------------------------------------------------------------------------
// Mirror check: CA→TX (#15) vs TX→CA (#16)
// ---------------------------------------------------------------------------
const caTx = calculateLifeEvent('move', { income: 150000, filingStatus: 'single', state: 'CA', targetState: 'TX' })
const txCa = calculateLifeEvent('move', { income: 150000, filingStatus: 'single', state: 'TX', targetState: 'CA' })
console.log(`\n--- Mirror check: CA→TX delta=${caTx.delta}, TX→CA delta=${txCa.delta} ` +
  `(expect exact opposites): ${caTx.delta === -txCa.delta ? '✓ match' : '✗ MISMATCH'} ---`)

// ---------------------------------------------------------------------------
// Summary + failure detail
// ---------------------------------------------------------------------------
console.log(`\n=== SUMMARY: ${passed} / ${tests.length} tests passed ===`)
if (failures.length > 0) {
  console.log(`\n${failures.length} FAILURE(S):\n`)
  for (const f of failures) {
    console.log(`  Test #${f.n} [${f.event}] ${f.summary}`)
    console.log(`    inputs: ${JSON.stringify(f.input)}`)
    for (const p of f.problems) console.log(`    ✗ ${p}`)
    console.log('')
  }
  process.exitCode = 1
} else {
  console.log('All assertions passed.')
}
