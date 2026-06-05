/**
 * Advanced stress test for TaxShift's engine + fallback insight generator.
 *
 * Where stress-test.mjs checks structural invariants across a broad catalog,
 * this suite drills into mathematical correctness:
 *   1. Bracket boundary behavior
 *   2. SALT-cap interaction with itemized deductions
 *   3. Cross-event consistency (marriage/divorce round-trips, symmetry)
 *   4. Monotonicity of deltas as a single input varies
 *   5. Progressive state tax hand-calculation checks
 *   6. Self-employment tax precision
 *   7. Fallback-insight coverage / forbidden phrases
 *
 * Run with:  node scripts/stress-test-advanced.mjs
 */
import { calculateLifeEvent } from '../src/engine/lifeEvents.js'
import { generateFallbackInsight } from '../src/ai/fallbackTemplates.js'
import {
  SINGLE,
  MFJ,
  HOH,
  STANDARD_DEDUCTION,
  SE_TAX_RATE,
  SE_FACTOR,
  SALT_CAP,
} from '../src/data/federalBrackets.js'

// ---------------------------------------------------------------------------
// Independent re-implementations (intentionally NOT importing the engine's
// math) so the assertions cross-check the engine rather than echo it.
// ---------------------------------------------------------------------------
function bracketsFor(status) {
  return status === 'mfj' ? MFJ : status === 'hoh' ? HOH : SINGLE
}

/** Progressive tax over a [threshold, rate] table. */
function bracketTax(taxable, brackets) {
  const income = Math.max(0, taxable)
  let tax = 0
  for (let i = 0; i < brackets.length; i++) {
    const [threshold, rate] = brackets[i]
    if (income <= threshold) break
    const next = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity
    tax += (Math.min(income, next) - threshold) * rate
  }
  return tax
}

/** Federal tax using the standard deduction (rounded). */
function fedStd(gross, status) {
  const ded = STANDARD_DEDUCTION[status] ?? STANDARD_DEDUCTION.single
  return Math.round(bracketTax(Math.max(0, gross - ded), bracketsFor(status)))
}

/** Federal tax using max(itemized, standard) (rounded). */
function fedItemized(gross, itemized, status) {
  const std = STANDARD_DEDUCTION[status] ?? STANDARD_DEDUCTION.single
  const ded = Math.max(itemized, std)
  return Math.round(bracketTax(Math.max(0, gross - ded), bracketsFor(status)))
}

// ---------------------------------------------------------------------------
// Assertion harness
// ---------------------------------------------------------------------------
let runCount = 0
let passCount = 0
const rows = []
const failures = []

function record(section, desc, ok, detail) {
  runCount++
  if (ok) passCount++
  else failures.push({ section, desc, detail })
  rows.push({
    sec: section,
    assertion: desc,
    result: ok ? 'PASS' : 'FAIL',
    detail: detail && detail.length > 60 ? detail.slice(0, 57) + '...' : detail || '',
  })
}

/** Strict equality assertion. */
function assertEq(section, desc, actual, expected) {
  const ok = actual === expected
  record(section, desc, ok, `got ${fmt(actual)}, expected ${fmt(expected)}`)
}

/** Approximate equality within an absolute tolerance. */
function assertClose(section, desc, actual, expected, tol) {
  const ok = Number.isFinite(actual) && Math.abs(actual - expected) <= tol
  record(section, desc, ok, `got ${fmt(actual)}, expected ${fmt(expected)} (±${tol})`)
}

/** Boolean assertion with a custom detail message. */
function assertTrue(section, desc, ok, detail) {
  record(section, desc, !!ok, detail)
}

function fmt(v) {
  return typeof v === 'number' ? v.toLocaleString('en-US') : String(v)
}

function header(title) {
  console.log(`\n${'='.repeat(72)}\n${title}\n${'='.repeat(72)}`)
}

// ===========================================================================
// SECTION 1: BRACKET BOUNDARY TESTS
// ===========================================================================
header('SECTION 1: Bracket boundary tests')
{
  // Use marriage with spouse=$0 to expose a single-filer federal liability via
  // before.federal (= calcFederalTax(you,'single') + calcFederalTax(0,'single')).
  const singleFed = (income) =>
    calculateLifeEvent('marriage', {
      yourIncome: income,
      spouseIncome: 0,
      state: 'AK',
    }).before.federal

  // 1a. Exactly at the 12%->22% boundary ($48,475 taxable + $15,750 std).
  const f_64225 = singleFed(64225)
  console.log(`1a  single $64,225 federal = ${f_64225}  (hand calc: $5,579)`)
  assertEq('1a', '$64,225 single federal == $5,579 (12% bracket top)', f_64225, 5579)
  assertEq('1a', '$64,225 matches independent bracket calc', f_64225, fedStd(64225, 'single'))

  // 1b. One dollar into the 22% bracket.
  const f_64226 = singleFed(64226)
  console.log(`1b  single $64,226 federal = ${f_64226}  (expect 5579 or 5580)`)
  assertTrue('1b', '$64,226 federal is $5,579 or $5,580 (no boundary glitch)',
    f_64226 === 5579 || f_64226 === 5580, `got ${f_64226}`)
  assertEq('1b', '$64,226 matches independent bracket calc', f_64226, fedStd(64226, 'single'))
  assertTrue('1b', 'federal is non-decreasing across the boundary',
    f_64226 >= f_64225, `${f_64225} -> ${f_64226}`)

  // 1c. The 22%->24% boundary at $103,350 taxable ($119,100 gross).
  const f_119100 = singleFed(119100)
  const f_119101 = singleFed(119101)
  console.log(`1c  single $119,100 federal = ${f_119100}, $119,101 = ${f_119101}`)
  assertEq('1c', '$119,100 single matches independent bracket calc', f_119100, fedStd(119100, 'single'))
  assertTrue('1c', '$119,101 is within $1 of $119,100 (one $1 at 24%)',
    Math.abs(f_119101 - f_119100) <= 1, `${f_119100} -> ${f_119101}`)
  assertEq('1c', '$119,101 matches independent bracket calc', f_119101, fedStd(119101, 'single'))
}

// ===========================================================================
// SECTION 2: SALT CAP STRESS
// ===========================================================================
header('SECTION 2: SALT cap stress')
{
  // 2a. Property tax ($60K) exceeds the $40K SALT cap.
  const r2a = calculateLifeEvent('home', {
    income: 300000, filingStatus: 'single', state: 'NY',
    homePrice: 1000000, downPayment: 20, mortgageRate: 6.5, propertyTax: 60000,
  })
  const interest2a = 1000000 * 0.8 * 0.065 // 52,000
  const itemized2a = interest2a + Math.min(60000, SALT_CAP) // 52,000 + 40,000 = 92,000
  console.log(`2a  interest=${interest2a}, capped itemized=${itemized2a}, after.federal=${r2a.after.federal}`)
  assertEq('2a', 'itemized caps at $92,000 (interest 52k + SALT 40k)', itemized2a, 92000)
  assertEq('2a', 'engine after.federal uses the $92,000 itemized deduction',
    r2a.after.federal, fedItemized(300000, 92000, 'single'))
  assertTrue('2a', 'note reports the $92,000 itemized figure',
    !!r2a.note && r2a.note.includes('$92,000'), r2a.note || '(no note)')

  // 2b. Same home, zero property tax -> interest-only itemized.
  const r2b = calculateLifeEvent('home', {
    income: 300000, filingStatus: 'single', state: 'NY',
    homePrice: 1000000, downPayment: 20, mortgageRate: 6.5, propertyTax: 0,
  })
  const itemized2b = 52000
  console.log(`2b  itemized (interest only)=${itemized2b}, after.federal=${r2b.after.federal}`)
  assertEq('2b', 'engine after.federal uses the $52,000 interest-only deduction',
    r2b.after.federal, fedItemized(300000, 52000, 'single'))
  assertTrue('2b', 'itemized ($52,000) beats the standard deduction ($15,750)',
    itemized2b > STANDARD_DEDUCTION.single, `${itemized2b} > ${STANDARD_DEDUCTION.single}`)

  // 2c. Low-priced home -> standard deduction wins, federal delta should be $0.
  const r2c = calculateLifeEvent('home', {
    income: 60000, filingStatus: 'single', state: 'AZ',
    homePrice: 150000, downPayment: 20, mortgageRate: 4, propertyTax: 1500,
  })
  const itemized2c = 150000 * 0.8 * 0.04 + 1500 // 4,800 + 1,500 = 6,300
  console.log(`2c  itemized=${itemized2c} (< std 15,750), federal before=${r2c.before.federal} after=${r2c.after.federal}, delta=${r2c.delta}`)
  assertEq('2c', 'itemized = $6,300 (below standard deduction)', itemized2c, 6300)
  assertEq('2c', 'federal unchanged — standard deduction still wins',
    r2c.after.federal, r2c.before.federal)
  assertClose('2c', 'total delta is ~$0 (no tax benefit)', r2c.delta, 0, 1)
}

// ===========================================================================
// SECTION 3: CROSS-EVENT CONSISTENCY
// ===========================================================================
header('SECTION 3: Cross-event consistency')
{
  // 3a. Marriage bonus vs. divorce cost on the same two incomes.
  const marr3a = calculateLifeEvent('marriage', { yourIncome: 120000, spouseIncome: 80000, state: 'CA' })
  const div3a = calculateLifeEvent('divorce', {
    yourIncome: 120000, spouseIncome: 80000, numChildren: 0, state: 'CA', custodyToMe: false,
  })
  const diff3a = marr3a.delta + div3a.delta // expect ~0 (exact opposites)
  console.log(`3a  marriage delta=${marr3a.delta}, divorce delta=${div3a.delta}, sum=${diff3a}`)
  assertClose('3a', 'marriage savings ≈ -(divorce cost) for $120K+$80K CA', diff3a, 0, 1)

  // 3b. Marriage is symmetric in (you, spouse).
  const m_ab = calculateLifeEvent('marriage', { yourIncome: 130000, spouseIncome: 40000, state: 'AZ' })
  const m_ba = calculateLifeEvent('marriage', { yourIncome: 40000, spouseIncome: 130000, state: 'AZ' })
  console.log(`3b  marriage(130k,40k)=${m_ab.delta}, marriage(40k,130k)=${m_ba.delta}`)
  assertEq('3b', 'marriage($A,$B) == marriage($B,$A) [AZ 130k/40k]', m_ab.delta, m_ba.delta)

  // 3c. move(CA->TX) is the exact negative of move(TX->CA).
  for (const inc of [100000, 200000, 300000]) {
    const caTx = calculateLifeEvent('move', { income: inc, filingStatus: 'single', state: 'CA', targetState: 'TX' })
    const txCa = calculateLifeEvent('move', { income: inc, filingStatus: 'single', state: 'TX', targetState: 'CA' })
    console.log(`3c  $${inc}: CA->TX delta=${caTx.delta}, TX->CA delta=${txCa.delta}`)
    assertEq('3c', `move CA->TX == -(move TX->CA) at $${inc.toLocaleString()}`, caTx.delta, -txCa.delta)
  }
}

// ===========================================================================
// SECTION 4: MONOTONICITY CHECKS
// ===========================================================================
header('SECTION 4: Monotonicity checks')
{
  // 4a. Marriage delta: from bonus toward penalty as incomes equalize.
  const lowers = [0, 30000, 60000, 90000, 120000, 150000]
  const marrDeltas = lowers.map((x) =>
    calculateLifeEvent('marriage', { yourIncome: 150000, spouseIncome: x, state: 'CA' }).delta)
  console.table(lowers.map((x, i) => ({ lowerEarner: x, delta: marrDeltas[i] })))
  let mono4a = true
  for (let i = 1; i < marrDeltas.length; i++) if (marrDeltas[i] > marrDeltas[i - 1]) mono4a = false
  assertTrue('4a', 'marriage delta is non-increasing as incomes equalize (bonus→penalty)',
    mono4a, `deltas: ${marrDeltas.join(', ')}`)

  // 4b. Sidebiz: more net business income => strictly more tax (more negative delta).
  const revenues = [10000, 30000, 50000, 80000, 120000]
  const bizDeltas = revenues.map((rev) =>
    calculateLifeEvent('sidebiz', {
      income: 80000, filingStatus: 'single', state: 'AZ',
      businessRevenue: rev, businessExpenses: 5000,
    }).delta)
  console.table(revenues.map((rev, i) => ({ revenue: rev, netBiz: rev - 5000, delta: bizDeltas[i] })))
  let mono4b = true
  for (let i = 1; i < bizDeltas.length; i++) if (bizDeltas[i] >= bizDeltas[i - 1]) mono4b = false
  assertTrue('4b', 'sidebiz delta is strictly decreasing as net income rises',
    mono4b, `deltas: ${bizDeltas.join(', ')}`)

  // 4c. Baby: incremental CTC benefit at high income (CTC phaseout territory).
  const childCounts = [0, 1, 2, 3, 4]
  const babyDeltas = childCounts.map((k) =>
    calculateLifeEvent('baby', { income: 250000, filingStatus: 'single', state: 'CA', numChildren: k }).delta)
  console.table(childCounts.map((k, i) => ({ existingChildren: k, delta: babyDeltas[i] })))
  assertTrue('4c', 'baby deltas computed for 0–4 existing children (coverage)',
    babyDeltas.every((d) => Number.isFinite(d)), `deltas: ${babyDeltas.join(', ')}`)
}

// ===========================================================================
// SECTION 5: PROGRESSIVE STATE TAX VERIFICATION
// ===========================================================================
header('SECTION 5: Progressive state tax verification')
{
  // Move from a no-tax state isolates the destination state tax in after.state.
  // 5a. California, $100K single -> taxable $84,250 -> $4,488.
  const r5a = calculateLifeEvent('move', { income: 100000, filingStatus: 'single', state: 'TX', targetState: 'CA' })
  console.log(`5a  CA state tax on $100K single (taxable $84,250) = ${r5a.after.state}  (hand calc $4,488)`)
  assertEq('5a', 'CA state tax @ $100K single == $4,488', r5a.after.state, 4488)

  // 5b. New York, $100K single -> taxable $84,250 -> $4,729.
  const r5b = calculateLifeEvent('move', { income: 100000, filingStatus: 'single', state: 'TX', targetState: 'NY' })
  console.log(`5b  NY state tax on $100K single (taxable $84,250) = ${r5b.after.state}  (hand calc $4,729)`)
  assertEq('5b', 'NY state tax @ $100K single == $4,729', r5b.after.state, 4729)
}

// ===========================================================================
// SECTION 6: SE TAX PRECISION
// ===========================================================================
header('SECTION 6: Self-employment tax precision')
{
  // 6a. Net $100K business income (revenue 100k, expenses 0, $0 W-2, FL).
  const r6a = calculateLifeEvent('sidebiz', {
    income: 0, filingStatus: 'single', state: 'FL',
    businessRevenue: 100000, businessExpenses: 0,
  })
  const expectedSe = Math.round(100000 * SE_FACTOR * SE_TAX_RATE) // 14,130
  console.log(`6a  net $100K -> seTax=${r6a.after.seTax}  (100000 × ${SE_FACTOR} × ${SE_TAX_RATE} = ${expectedSe})`)
  assertEq('6a', 'SE tax on $100K net == $14,130', r6a.after.seTax, 14130)
  assertEq('6a', 'SE tax matches 0.9235 × 0.153 formula', r6a.after.seTax, expectedSe)

  // 6b. Net $1 business income -> SE tax rounds to $0.
  const r6b = calculateLifeEvent('sidebiz', {
    income: 0, filingStatus: 'single', state: 'FL',
    businessRevenue: 1, businessExpenses: 0,
  })
  console.log(`6b  net $1 -> seTax=${r6b.after.seTax}  (1 × ${SE_FACTOR} × ${SE_TAX_RATE} = ${(1 * SE_FACTOR * SE_TAX_RATE).toFixed(4)} → 0)`)
  assertEq('6b', 'SE tax on $1 net rounds to $0', r6b.after.seTax, 0)
}

// ===========================================================================
// SECTION 7: INSIGHT COVERAGE
// ===========================================================================
header('SECTION 7: Insight coverage')
{
  const FORBIDDEN = ['consult a tax professional', 'NaN', 'undefined', '$NaN']
  const checkInsight = (label, eventId, input) => {
    let text = ''
    let crashed = false
    try {
      const res = calculateLifeEvent(eventId, input)
      text = generateFallbackInsight(eventId, res, input)
    } catch (err) {
      crashed = true
      text = `EXCEPTION: ${err.message}`
    }
    const isStr = typeof text === 'string' && text.trim().length > 0
    const bad = FORBIDDEN.filter((p) => text.includes(p))
    assertTrue('7a', `${label}: produces a non-empty insight without crashing`,
      !crashed && isStr, crashed ? text : `len=${text.length}`)
    assertTrue('7a', `${label}: insight contains no forbidden phrases`,
      bad.length === 0, bad.length ? `found: ${bad.join(', ')}` : 'clean')
  }

  // For each event: one scenario that saves money, one that costs money.
  checkInsight('marriage SAVES (300k+0 unequal bonus)', 'marriage', { yourIncome: 300000, spouseIncome: 0, state: 'TX' })
  checkInsight('marriage COSTS (200k+200k penalty)', 'marriage', { yourIncome: 200000, spouseIncome: 200000, state: 'CA' })

  checkInsight('baby SAVES (80k single 0 kids)', 'baby', { income: 80000, filingStatus: 'single', state: 'AZ', numChildren: 0 })
  checkInsight('baby high-income (250k single 0 kids)', 'baby', { income: 250000, filingStatus: 'single', state: 'CA', numChildren: 0 })

  checkInsight('home SAVES (itemize wins)', 'home', { income: 300000, filingStatus: 'single', state: 'NY', homePrice: 1000000, downPayment: 20, mortgageRate: 6.5, propertyTax: 60000 })
  checkInsight('home neutral (standard wins)', 'home', { income: 60000, filingStatus: 'single', state: 'AZ', homePrice: 150000, downPayment: 20, mortgageRate: 4, propertyTax: 1500 })

  checkInsight('move SAVES (CA->TX)', 'move', { income: 200000, filingStatus: 'single', state: 'CA', targetState: 'TX' })
  checkInsight('move COSTS (TX->CA)', 'move', { income: 200000, filingStatus: 'single', state: 'TX', targetState: 'CA' })

  checkInsight('sidebiz COSTS (small)', 'sidebiz', { income: 50000, filingStatus: 'single', state: 'PA', businessRevenue: 10000, businessExpenses: 2000 })
  checkInsight('sidebiz COSTS (large)', 'sidebiz', { income: 100000, filingStatus: 'mfj', state: 'GA', businessRevenue: 120000, businessExpenses: 5000 })

  checkInsight('divorce COSTS (split raises tax)', 'divorce', { yourIncome: 120000, spouseIncome: 80000, numChildren: 0, state: 'CA', custodyToMe: false })
  checkInsight('divorce SAVES (penalty removed)', 'divorce', { yourIncome: 300000, spouseIncome: 300000, numChildren: 0, state: 'CA', custodyToMe: false })

  // 7b. The $0 + $0 marriage edge case must yield a valid neutral message.
  let edgeText = ''
  let edgeCrash = false
  try {
    const res = calculateLifeEvent('marriage', { yourIncome: 0, spouseIncome: 0, state: 'AZ' })
    edgeText = generateFallbackInsight('marriage', res, { yourIncome: 0, spouseIncome: 0, state: 'AZ' })
  } catch (err) {
    edgeCrash = true
    edgeText = err.message
  }
  console.log(`7b  $0+$0 marriage insight: "${edgeText.slice(0, 80)}..."`)
  assertTrue('7b', '$0+$0 marriage yields a valid neutral message (no crash)',
    !edgeCrash && typeof edgeText === 'string' && edgeText.trim().length > 0,
    edgeCrash ? edgeText : `len=${edgeText.length}`)
  assertTrue('7b', '$0+$0 marriage insight has no forbidden phrases',
    FORBIDDEN.every((p) => !edgeText.includes(p)), 'clean')
}

// ===========================================================================
// RESULTS
// ===========================================================================
header('RESULTS')
console.table(rows)

console.log(`\n=== ${passCount} / ${runCount} assertions passed ===`)
if (failures.length > 0) {
  console.log(`\n${failures.length} FAILURE(S):\n`)
  for (const f of failures) {
    console.log(`  [${f.section}] ${f.desc}`)
    console.log(`     -> ${f.detail}`)
  }
  process.exitCode = 1
} else {
  console.log('All assertions passed.')
}
