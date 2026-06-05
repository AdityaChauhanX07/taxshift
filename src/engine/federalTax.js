import { SINGLE, MFJ, HOH, STANDARD_DEDUCTION } from '../data/federalBrackets.js'

/**
 * Resolve the bracket array for a given filing status.
 * @param {'single'|'mfj'|'hoh'} filingStatus
 * @returns {Array<[number, number]>} bracket tuples
 */
function bracketsFor(filingStatus) {
  switch (filingStatus) {
    case 'mfj':
      return MFJ
    case 'hoh':
      return HOH
    case 'single':
    default:
      return SINGLE
  }
}

/**
 * Compute progressive tax by walking a bracket array.
 * Each bracket's marginal rate applies only to income within that band.
 * @param {number} taxableIncome - income after deductions
 * @param {Array<[number, number]>} brackets - [threshold, rate] tuples, ascending
 * @returns {number} tax owed (unrounded)
 */
export function calcBracketTax(taxableIncome, brackets) {
  const income = Math.max(0, taxableIncome)
  let tax = 0

  for (let i = 0; i < brackets.length; i++) {
    const [threshold, rate] = brackets[i]
    if (income <= threshold) break

    const nextThreshold = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity
    const bandTop = Math.min(income, nextThreshold)
    tax += (bandTop - threshold) * rate
  }

  return tax
}

/**
 * Compute federal income tax using the standard deduction.
 * @param {number} grossIncome - gross income before deductions
 * @param {'single'|'mfj'|'hoh'} filingStatus
 * @returns {number} federal tax owed, rounded to the nearest dollar
 */
export function calcFederalTax(grossIncome, filingStatus) {
  const deduction = STANDARD_DEDUCTION[filingStatus] ?? STANDARD_DEDUCTION.single
  const taxable = Math.max(0, grossIncome - deduction)
  return Math.round(calcBracketTax(taxable, bracketsFor(filingStatus)))
}

/**
 * Compute federal income tax using the greater of itemized or standard deduction.
 * @param {number} grossIncome - gross income before deductions
 * @param {number} itemizedAmount - total itemized deductions
 * @param {'single'|'mfj'|'hoh'} filingStatus
 * @returns {number} federal tax owed, rounded to the nearest dollar
 */
export function calcFederalTaxItemized(grossIncome, itemizedAmount, filingStatus) {
  const standard = STANDARD_DEDUCTION[filingStatus] ?? STANDARD_DEDUCTION.single
  const deduction = Math.max(itemizedAmount, standard)
  const taxable = Math.max(0, grossIncome - deduction)
  return Math.round(calcBracketTax(taxable, bracketsFor(filingStatus)))
}
