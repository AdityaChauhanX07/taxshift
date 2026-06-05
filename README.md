# TaxShift

**See how your next life event changes your taxes — before it happens.**

## The Problem

Most people only discover how a major life event affects their taxes *after* it has already happened — at filing time, when nothing can be changed. Getting married, having a child, buying a home, or moving states can swing a tax bill by thousands of dollars, yet there's no simple way to preview that impact in advance. TaxShift turns tax planning from a year-end surprise into a forward-looking decision.

## What It Does

TaxShift is an interactive, forward-looking tax impact simulator. You pick a life event, enter a few numbers, and instantly see a before → after comparison of your estimated federal and state taxes, a breakdown of exactly where the change comes from, and a plain-English explanation of *why* — enhanced by Claude when an API key is configured, with a built-in deterministic fallback so it always works.

## Life Events Covered

- **Getting Married** — filing status change, combined income, marriage bonus or penalty
- **Having a Baby** — Child Tax Credit, Head of Household status, dependent benefits
- **Buying a Home** — mortgage interest deduction, property taxes, standard vs. itemized
- **Moving States** — state income tax differential and partial-year considerations
- **Starting a Side Business** — self-employment tax, business deductions, additional income tax
- **Getting Divorced** — separate filings, lost joint benefits, credit reallocation

## Tax Coverage

Built on **2025 federal tax models, including OBBBA updates**:

- **Federal brackets** — full 2025 schedule (10% → 37%) for Single, Married Filing Jointly, and Head of Household
- **Standard deduction** — $15,750 single · $31,500 MFJ · $23,625 HoH
- **Child Tax Credit** — $2,200 per qualifying child
- **Self-employment tax** — 15.3% (12.4% Social Security + 2.9% Medicare) on 92.35% of net SE income
- **SALT cap** — $40,000 itemized state-and-local-tax deduction limit (OBBBA)
- **Mortgage interest** — deductible on principal up to $750,000
- **State income tax** — **24 states covering ~80% of the U.S. population**, including all nine no-income-tax states

> Figures are estimates for education and planning, not exact filing calculations.

## Tech Stack

React 19 · Vite · Recharts · Tailwind CSS · Claude API (via a Vercel serverless proxy)

## Run Locally

```bash
git clone https://github.com/AdityaChauhanX/taxshift.git
cd taxshift
cp .env.example .env.local   # then add your Claude API key (optional — fallback works without it)
npm install
npm run dev
```

The app runs at the URL Vite prints (default `http://localhost:5173`). The AI insight is optional: without a key, TaxShift uses its built-in fallback explanations.

## Deploy

1. Push the repository to GitHub.
2. Connect the repo to [Vercel](https://vercel.com) and import it (the included `vercel.json` configures the build and the `/api/insight` serverless function).
3. In the Vercel project settings, add an environment variable **`CLAUDE_API_KEY`** with your Anthropic API key.

Vercel builds the static frontend and deploys `api/insight.js` as a serverless function that proxies Claude requests, keeping your API key server-side.

## Disclaimer

TaxShift is an educational estimator using 2025 federal tax models (including OBBBA updates). It is **not tax advice**. Consult a qualified tax professional for filing decisions.

## Team

- **Aditya Chauhan** — _[role]_

Built for **DSOC Summer Edition 2026 · Tax, Compliance & Regulatory Innovation**.
