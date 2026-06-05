/**
 * Validate a single field value against its configuration.
 *
 * The fieldConfig describes how to validate:
 *   - required {boolean}    field must be non-empty
 *   - type {string}         'number' | 'income' | 'percentage' (others skip
 *                           numeric checks)
 *   - label {string}        human-readable name used in messages
 *
 * Rules applied:
 *   - required fields must not be empty
 *   - numeric/income/percentage fields must parse to a valid number
 *   - income fields must be <= 500000
 *   - percentage fields must be between 0 and 100
 *
 * @param {string} key - field key (used as a fallback label)
 * @param {*} value - the value to validate
 * @param {{required?: boolean, type?: string, label?: string}} fieldConfig
 * @returns {string|null} an error message if invalid, otherwise null
 */
export function validateField(key, value, fieldConfig = {}) {
  const { required = false, type, label } = fieldConfig
  const name = label || key

  const isEmpty = value === '' || value === null || value === undefined

  if (required && isEmpty) {
    return `${name} is required`
  }

  // Optional and empty: nothing more to check.
  if (isEmpty) return null

  const isNumeric = type === 'number' || type === 'income' || type === 'percentage'

  if (isNumeric) {
    const num = typeof value === 'number' ? value : parseFloat(value)

    if (!Number.isFinite(num)) {
      return `${name} must be a valid number`
    }

    if (type === 'income' && num > 500000) {
      return `${name} must be $500,000 or less`
    }

    if (type === 'percentage' && (num < 0 || num > 100)) {
      return `${name} must be between 0 and 100`
    }
  }

  return null
}
