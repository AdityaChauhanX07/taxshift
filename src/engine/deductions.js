import { STANDARD_DEDUCTION, SALT_CAP } from '../data/federalBrackets.js'

/**
 * Get the standard deduction for a filing status.
 * @param {'single'|'mfj'|'hoh'} filingStatus
 * @returns {number} standard deduction amount
 */
export function getStandardDeduction(filingStatus) {
  return STANDARD_DEDUCTION[filingStatus] ?? STANDARD_DEDUCTION.single
}

/**
 * Compute total itemized deductions. Mortgage interest is fully deductible;
 * property tax plus state/local tax are jointly capped by the SALT limit.
 * @param {number} mortgageInterest - deductible mortgage interest
 * @param {number} propertyTax - property taxes paid
 * @param {number} stateLocalTax - state and local income/sales tax paid
 * @returns {number} total itemized deduction
 */
export function calcItemizedDeduction(mortgageInterest, propertyTax, stateLocalTax) {
  return mortgageInterest + Math.min(propertyTax + stateLocalTax, SALT_CAP)
}

/**
 * Decide whether itemizing beats the standard deduction.
 * @param {number} itemizedTotal - total itemized deductions
 * @param {'single'|'mfj'|'hoh'} filingStatus
 * @returns {boolean} true if itemizing yields a larger deduction
 */
export function shouldItemize(itemizedTotal, filingStatus) {
  return itemizedTotal > getStandardDeduction(filingStatus)
}
