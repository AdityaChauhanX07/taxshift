import {
  NO_TAX_STATES,
  FLAT_TAX_STATES,
  PROGRESSIVE_STATES,
} from '../data/stateTaxData.js'
import { calcBracketTax } from './federalTax.js'

/**
 * Compute state income tax for a given state.
 * @param {number} taxableIncome - income subject to state tax
 * @param {string} stateCode - two-letter state code (e.g. 'CA')
 * @returns {number|null} tax owed rounded to the nearest dollar, or null if
 *   the state is not supported
 */
export function calcStateTax(taxableIncome, stateCode) {
  const income = Math.max(0, taxableIncome)

  if (NO_TAX_STATES.includes(stateCode)) return 0

  if (Object.prototype.hasOwnProperty.call(FLAT_TAX_STATES, stateCode)) {
    return Math.round(income * FLAT_TAX_STATES[stateCode])
  }

  if (Object.prototype.hasOwnProperty.call(PROGRESSIVE_STATES, stateCode)) {
    return Math.round(calcBracketTax(income, PROGRESSIVE_STATES[stateCode]))
  }

  return null
}
