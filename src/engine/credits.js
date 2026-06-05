import { CHILD_TAX_CREDIT } from '../data/federalBrackets.js'

/**
 * Compute the child tax credit, applying the standard phaseout of $50 per
 * $1,000 (or fraction thereof) of AGI above the filing-status threshold
 * ($400K for MFJ, $200K for single/HOH).
 * @param {number} numChildren - number of qualifying children
 * @param {number} agi - adjusted gross income
 * @param {'single'|'mfj'|'hoh'} filingStatus
 * @returns {number} credit amount, rounded and floored at 0
 */
export function calcChildTaxCredit(numChildren, agi, filingStatus) {
  const base = numChildren * CHILD_TAX_CREDIT
  const threshold = filingStatus === 'mfj' ? 400000 : 200000

  const excess = Math.max(0, agi - threshold)
  const reduction = Math.ceil(excess / 1000) * 50

  return Math.max(0, Math.round(base - reduction))
}
