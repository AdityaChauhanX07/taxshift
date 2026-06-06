# TaxShift

**See how your next life event changes your taxes, before it happens.**

---

## The Problem

Tax software looks backward. Every tool on the market answers one question: *what do I owe for last year?*

Nobody answers the question that actually matters when you're planning your life: *if I get married, buy a house, or start a side business, how do my taxes change?*

Today, the only way to find out is to hire an accountant or guess. Most people guess. TaxShift fixes that.

## What It Does

Pick a life event. Enter a few numbers. Instantly see a before-and-after comparison of your estimated taxes, a breakdown of where the change comes from, and a plain-English explanation of why.

The AI insight panel is powered by Gemini when an API key is configured. Without one, TaxShift falls back to built-in deterministic templates that reference your actual numbers. It always works.

## Life Events

- **Getting Married** - combined income brackets, filing status change, marriage bonus or penalty
- **Having a Baby** - Child Tax Credit ($2,200), Head of Household eligibility for single parents
- **Buying a Home** - mortgage interest deduction, property taxes, standard vs. itemized
- **Moving States** - state income tax differential across 24 states
- **Starting a Side Business** - self-employment tax (15.3%), business deductions
- **Getting Divorced** - separate filings, credit reallocation, custody-based HoH

## Tax Model

All calculations use **exact 2025 federal figures**, updated for the One Big Beautiful Bill Act (OBBBA):

| What | Value |
|------|-------|
| Federal brackets | All 7 rates (10% to 37%), three filing statuses |
| Standard deduction | $15,750 single / $31,500 MFJ / $23,625 HoH |
| Child Tax Credit | $2,200 per qualifying child |
| SALT cap | $40,000 (up from $10,000) |
| SE tax | 15.3% on 92.35% of net self-employment income |
| Mortgage interest | Deductible on first $750,000 of loan principal |
| State coverage | 24 states, roughly 80% of the US population |

Bracket thresholds from Rev. Proc. 2024-40. Standard deductions, CTC, and SALT cap reflect OBBBA changes signed July 2025.

> This is an educational estimator, not a tax calculator. Numbers are estimates for planning purposes.

## Tech Stack

React 19 · Vite · Tailwind CSS · Recharts · Gemini API · Vercel

## Run Locally

```bash
git clone https://github.com/AdityaChauhanX/taxshift.git
cd taxshift
cp .env.example .env.local   # add your Gemini API key (optional)
npm install
npm run dev
```

The AI insight panel is optional. Without a key, TaxShift uses its built-in fallback explanations and everything works normally.

## Deploy

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com) (the included `vercel.json` handles build config and the `/api/insight` serverless function)
3. Add `GEMINI_API_KEY` as an environment variable in Vercel project settings

The serverless function proxies Gemini requests and constructs prompts server-side. Your API key never reaches the browser.

## Disclaimer

TaxShift is an educational estimator using 2025 federal tax models (including OBBBA updates). It is **not tax advice**. Consult a qualified tax professional for filing decisions.

## Team

**Aditya Chauhan** · **Vladimir Khegai**

---

Built for **DSOC Summer Edition 2026** · Tax, Compliance & Regulatory Innovation