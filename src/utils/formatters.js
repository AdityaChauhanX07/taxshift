/**
 * Format a number as whole-dollar US currency, e.g. 12345 → "$12,345".
 * @param {number} n - amount to format
 * @returns {string} formatted currency string
 */
export function formatCurrency(n) {
  const value = Number.isFinite(n) ? Math.round(n) : 0
  return '$' + value.toLocaleString('en-US')
}

/**
 * Format an effective tax rate (tax / income) as a one-decimal percentage,
 * e.g. (2500, 10000) → "25.0%".
 * @param {number} tax - tax owed
 * @param {number} income - income the rate is measured against
 * @returns {string} formatted percentage string
 */
export function formatPercent(tax, income) {
  if (!income || !Number.isFinite(income)) return '0.0%'
  return ((tax / income) * 100).toFixed(1) + '%'
}

/**
 * Parse user input into a number by stripping all characters except digits
 * and a decimal point.
 * @param {string} str - raw input string
 * @returns {number} parsed number, or 0 if not parseable
 */
export function parseNumericInput(str) {
  const cleaned = String(str).replace(/[^0-9.]/g, '')
  const value = parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}
