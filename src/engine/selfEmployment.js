import { SE_TAX_RATE, SE_FACTOR } from '../data/federalBrackets.js'

/**
 * Compute self-employment tax on net business income.
 * Only 92.35% of net income is subject to the 15.3% combined rate.
 * @param {number} netBusinessIncome - net profit from self-employment
 * @returns {number} SE tax owed, rounded to the nearest dollar
 */
export function calcSelfEmploymentTax(netBusinessIncome) {
  const net = Math.max(0, netBusinessIncome)
  return Math.round(net * SE_FACTOR * SE_TAX_RATE)
}

/**
 * Compute the deductible (employer-equivalent) half of SE tax, which reduces
 * adjusted gross income.
 * @param {number} seTax - the self-employment tax owed
 * @returns {number} deductible half, rounded to the nearest dollar
 */
export function calcSEDeduction(seTax) {
  return Math.round(seTax / 2)
}
