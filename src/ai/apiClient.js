/**
 * Frontend client for the AI insight endpoint. Designed to be fire-and-forget
 * safe: it never throws and returns null on any failure (network error,
 * timeout, bad response, or a null insight), so callers can always fall back to
 * the locally-generated template insight.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api/insight'

/** Abort the request if the server takes longer than this (ms). */
const TIMEOUT_MS = 8000

/**
 * Request an AI-generated insight for a calculated life event.
 * @param {string} eventId - the life event id
 * @param {Object} formData - the (engine-shaped) financial inputs
 * @param {Object} results - the calculation results (before/after/delta/breakdown)
 * @returns {Promise<string|null>} the insight text, or null on any failure
 */
export async function fetchAIInsight(eventId, formData, results) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, data: formData, results }),
      signal: controller.signal,
    })

    if (!response.ok) return null

    const json = await response.json()
    const insight = json?.insight
    return typeof insight === 'string' && insight.trim() ? insight : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
