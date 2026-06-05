import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Vercel Node.js serverless function that proxies a Google Gemini request.
 *
 * The system prompt is constructed entirely server-side so it never ships to
 * the browser. The function is intentionally forgiving: on any failure it
 * returns `{ insight: null }` with a 200 status, letting the frontend keep its
 * locally-generated fallback insight.
 *
 * Expects POST JSON: { eventId, data, results }.
 */

const SYSTEM_PROMPT = `You are a tax education assistant inside TaxShift, a forward-looking tax impact simulator. The user selected a life event and entered their financial info. You have been given the calculated before/after tax estimates.

Your job:
1. Explain in 2-3 sentences WHY their taxes changed
2. Identify the single biggest factor driving the change
3. Give 1-2 actionable, specific tips
4. Flag one thing to watch out for

Rules:
- Use plain English, no jargon
- Reference their actual dollar amounts
- Never say 'consult a tax professional' (the app disclaimer handles that)
- Keep total response under 150 words
- Be warm, specific, and helpful — not robotic or generic
- Do not use bullet points or headers — write in flowing prose`

// eslint-disable-next-line no-undef -- server-side Vercel function; `process` is valid here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export default async function handler(req, res) {
  // CORS — permit local dev and preflight.
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(200).json({ insight: null })
    return
  }

  try {
    // Vercel parses JSON bodies automatically, but guard for a raw string too.
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { eventId, data, results } = body

    if (!eventId || !results) {
      res.status(200).json({ insight: null })
      return
    }

    const { before, after, delta, breakdown } = results
    const saves = (delta ?? 0) >= 0
    const absDelta = Math.abs(delta ?? 0)
    const factors = Array.isArray(breakdown)
      ? breakdown.map((b) => b.label).join(', ')
      : ''

    const userMessage = `Life event: ${eventId}
User financial data: ${JSON.stringify(data ?? {})}
Estimated tax before this event: $${before?.total ?? 0}
Estimated tax after this event: $${after?.total ?? 0}
Net annual change: ${saves ? 'saves' : 'costs'} $${absDelta} per year
Key factors: ${factors}`

    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${userMessage}`)
    const text = (result.response.text() || '').trim()

    res.status(200).json({ insight: text || null })
  } catch {
    // Never surface an error — the frontend fallback covers this silently.
    res.status(200).json({ insight: null })
  }
}
