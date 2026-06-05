import { calcFederalTax, calcFederalTaxItemized } from './federalTax.js'
import { calcStateTax } from './stateTax.js'
import { calcSelfEmploymentTax, calcSEDeduction } from './selfEmployment.js'
import { calcChildTaxCredit } from './credits.js'
import {
  getStandardDeduction,
  calcItemizedDeduction,
  shouldItemize,
} from './deductions.js'
import { SALT_CAP, STANDARD_DEDUCTION } from '../data/federalBrackets.js'
import { STATE_NAMES, NO_TAX_STATES } from '../data/stateTaxData.js'
import { formatCurrency } from '../utils/formatters.js'

/**
 * @typedef {Object} Scenario
 * @property {number} federal - federal income tax
 * @property {number} state - state income tax
 * @property {number} credits - tax credits (reduce total)
 * @property {number} seTax - self-employment tax
 * @property {number} total - federal - credits + state + seTax
 */

/**
 * @typedef {Object} LifeEventResult
 * @property {Scenario} before
 * @property {Scenario} after
 * @property {number} delta - before.total - after.total (positive = savings)
 * @property {{label: string, value: number}[]} breakdown - per-line impacts
 *   (positive = savings, negative = cost)
 * @property {string|null} note - optional contextual note
 */

/**
 * Compute before/after tax scenarios for a single life event.
 *
 * Supported event IDs and the formData fields they read:
 *   - "marriage": yourIncome, spouseIncome, state (or yourState/spouseState)
 *   - "baby":     filingStatus, income, numChildren, state
 *   - "home":     filingStatus, income, state, homePrice, downPayment (%),
 *                 mortgageRate (%), propertyTax
 *   - "move":     filingStatus, income, state, targetState
 *   - "sidebiz":  filingStatus, income (W-2), state, businessRevenue,
 *                 businessExpenses
 *   - "divorce":  income (or yourIncome/spouseIncome), numChildren, state,
 *                 custodyToMe (boolean)
 *
 * @param {string} eventId - the life event to model
 * @param {Object} formData - the user's input values
 * @returns {LifeEventResult}
 */
export function calculateLifeEvent(eventId, formData = {}) {
  const fd = formData
  const notes = []
  const unsupportedStates = new Set()

  /** Coerce any field value to a finite number, defaulting to 0. */
  const num = (v) => {
    const x = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(x) ? x : 0
  }

  /** Normalize the filing status field, defaulting to 'single'. */
  const status = () => {
    const s = fd.filingStatus
    return s === 'mfj' || s === 'hoh' || s === 'single' ? s : 'single'
  }

  /**
   * State tax on (gross - deduction), tracking unsupported states.
   * @param {number} gross
   * @param {'single'|'mfj'|'hoh'} filing
   * @param {string} code - state code
   * @param {number} [deductionOverride] - use instead of the standard deduction
   */
  const stateTax = (gross, filing, code, deductionOverride) => {
    const deduction =
      deductionOverride != null ? deductionOverride : getStandardDeduction(filing)
    const taxable = Math.max(0, gross - deduction)
    const t = calcStateTax(taxable, code)
    if (t === null) {
      if (code) unsupportedStates.add(code)
      return 0
    }
    return t
  }

  /** Assemble a rounded scenario object with a consistent total. */
  const scenario = (federal, state, credits = 0, seTax = 0) => {
    const f = Math.round(federal)
    const s = Math.round(state)
    const c = Math.round(credits)
    const se = Math.round(seTax)
    return { federal: f, state: s, credits: c, seTax: se, total: f - c + s + se }
  }

  let before
  let after
  let breakdown = []

  switch (eventId) {
    case 'marriage': {
      const you = num(fd.yourIncome)
      const spouse = num(fd.spouseIncome)
      const state1 = fd.yourState || fd.state
      const state2 = fd.spouseState || fd.state
      const combined = you + spouse

      before = scenario(
        calcFederalTax(you, 'single') + calcFederalTax(spouse, 'single'),
        stateTax(you, 'single', state1) + stateTax(spouse, 'single', state2),
      )
      after = scenario(
        calcFederalTax(combined, 'mfj'),
        stateTax(combined, 'mfj', state1),
      )

      breakdown = [
        { label: 'Federal bracket change', value: before.federal - after.federal },
        { label: 'State tax change', value: before.state - after.state },
      ]
      break
    }

    case 'baby': {
      const cur = status()
      const income = num(fd.income)
      const kids = num(fd.numChildren)
      const newStatus = cur === 'single' ? 'hoh' : cur
      const newKids = kids + 1

      before = scenario(
        calcFederalTax(income, cur),
        stateTax(income, cur, fd.state),
        calcChildTaxCredit(kids, income, cur),
      )
      after = scenario(
        calcFederalTax(income, newStatus),
        stateTax(income, newStatus, fd.state),
        calcChildTaxCredit(newKids, income, newStatus),
      )

      breakdown = [
        { label: 'Child Tax Credit (+$2,200)', value: after.credits - before.credits },
      ]
      if (newStatus !== cur) {
        breakdown.push({
          label: 'Head of Household status',
          value: before.federal - after.federal,
        })
        notes.push(
          `Switching from Single to Head of Household gives you wider tax brackets and a larger standard deduction (${formatCurrency(
            STANDARD_DEDUCTION.hoh,
          )} vs ${formatCurrency(STANDARD_DEDUCTION.single)}).`,
        )
      }
      breakdown.push({ label: 'State tax change', value: before.state - after.state })
      break
    }

    case 'home': {
      const cur = status()
      const income = num(fd.income)

      before = scenario(
        calcFederalTax(income, cur),
        stateTax(income, cur, fd.state),
      )

      const homePrice = num(fd.homePrice)
      const downPct = num(fd.downPayment)
      const rate = num(fd.mortgageRate)
      const propertyTax = num(fd.propertyTax)

      const loan = homePrice * (1 - downPct / 100)
      const annualInterest = loan * (rate / 100)
      const itemized = calcItemizedDeduction(annualInterest, propertyTax, 0)
      const std = getStandardDeduction(cur)
      const useItemized = shouldItemize(itemized, cur)
      const deduction = Math.max(itemized, std)

      after = scenario(
        calcFederalTaxItemized(income, itemized, cur),
        stateTax(income, cur, fd.state, deduction),
      )

      breakdown = [
        {
          label: useItemized ? 'Mortgage interest deduction' : 'Standard deduction still better',
          value: before.federal - after.federal,
        },
        { label: 'State tax change', value: before.state - after.state },
      ]

      const cappedPropertyTax = Math.min(propertyTax, SALT_CAP)
      if (useItemized) {
        notes.push(
          `Itemizing ${formatCurrency(itemized)} (mortgage interest ${formatCurrency(
            annualInterest,
          )} + property tax ${formatCurrency(
            cappedPropertyTax,
          )}) beats the ${formatCurrency(std)} standard deduction.`,
        )
      } else {
        notes.push(
          `Your itemized deductions (${formatCurrency(
            itemized,
          )}) don't exceed the ${formatCurrency(
            std,
          )} standard deduction, so you'd keep taking the standard deduction.`,
        )
      }
      break
    }

    case 'move': {
      const cur = status()
      const income = num(fd.income)
      const fromState = fd.state
      const toState = fd.targetState

      const fed = calcFederalTax(income, cur)
      const fromTax = stateTax(income, cur, fromState)
      const toTax = stateTax(income, cur, toState)

      before = scenario(fed, fromTax)
      after = scenario(fed, toTax)

      const fromName = STATE_NAMES[fromState] || fromState || 'current state'
      const toName = STATE_NAMES[toState] || toState || 'target state'

      breakdown = [
        { label: `${fromName} state tax`, value: -fromTax },
        { label: `${toName} state tax`, value: -toTax },
        { label: 'Net annual change', value: fromTax - toTax },
      ]

      if (NO_TAX_STATES.includes(toState)) {
        notes.push(
          `${toName} has no state income tax, saving you ${formatCurrency(
            fromTax,
          )} per year.`,
        )
      } else if (toTax > fromTax) {
        notes.push(
          `Moving to ${toName} raises your state tax by ${formatCurrency(
            toTax - fromTax,
          )} per year.`,
        )
      }
      break
    }

    case 'sidebiz': {
      const cur = status()
      const w2 = num(fd.income)
      const revenue = num(fd.businessRevenue)
      const expenses = num(fd.businessExpenses)
      const netBiz = Math.max(0, revenue - expenses)

      before = scenario(
        calcFederalTax(w2, cur),
        stateTax(w2, cur, fd.state),
      )

      const seTax = calcSelfEmploymentTax(netBiz)
      const seDeduction = calcSEDeduction(seTax)
      const totalIncome = w2 + netBiz

      after = scenario(
        calcFederalTax(totalIncome - seDeduction, cur),
        stateTax(totalIncome, cur, fd.state),
        0,
        seTax,
      )

      breakdown = [
        {
          label: 'Additional federal income tax',
          value: -(after.federal - before.federal),
        },
        { label: 'Self-employment tax (15.3%)', value: -seTax },
        { label: 'State tax increase', value: -(after.state - before.state) },
      ]
      break
    }

    case 'divorce': {
      let yourIncome = num(fd.yourIncome)
      let spouseIncome = num(fd.spouseIncome)
      const combinedInput = num(fd.income)
      if (yourIncome + spouseIncome === 0 && combinedInput > 0) {
        yourIncome = Math.round(combinedInput / 2)
        spouseIncome = combinedInput - yourIncome
      }
      const combined = yourIncome + spouseIncome
      const kids = num(fd.numChildren)
      const custodyToMe = fd.custodyToMe === true || fd.custodyToMe === 'true'

      before = scenario(
        calcFederalTax(combined, 'mfj'),
        stateTax(combined, 'mfj', fd.state),
        calcChildTaxCredit(kids, combined, 'mfj'),
      )

      const myStatus = kids > 0 && custodyToMe ? 'hoh' : 'single'
      const exStatus = kids > 0 && !custodyToMe ? 'hoh' : 'single'
      const myKids = custodyToMe ? kids : 0
      const exKids = custodyToMe ? 0 : kids

      const afterFederal =
        calcFederalTax(yourIncome, myStatus) + calcFederalTax(spouseIncome, exStatus)
      const afterCredits =
        calcChildTaxCredit(myKids, yourIncome, myStatus) +
        calcChildTaxCredit(exKids, spouseIncome, exStatus)
      const afterState =
        stateTax(yourIncome, myStatus, fd.state) +
        stateTax(spouseIncome, exStatus, fd.state)

      after = scenario(afterFederal, afterState, afterCredits)

      breakdown = [
        {
          label: 'Federal tax change (both filers)',
          value: before.federal - after.federal,
        },
        { label: 'State tax change', value: before.state - after.state },
        {
          label: 'Child credit reallocation',
          value: after.credits - before.credits,
        },
      ]

      if (after.total > before.total) {
        notes.push(
          `Filing separately after divorce raises the combined tax by ${formatCurrency(
            after.total - before.total,
          )} per year, a common effect when one return splits into two.`,
        )
      }
      break
    }

    default:
      throw new Error(`Unknown life event: ${eventId}`)
  }

  if (unsupportedStates.size > 0) {
    notes.push(
      `State tax for ${[...unsupportedStates].join(
        ', ',
      )} isn't supported yet and was treated as $0.`,
    )
  }

  breakdown = breakdown.map((item) => ({
    label: item.label,
    value: Math.round(item.value),
  }))

  const delta = before.total - after.total
  const note = notes.length > 0 ? notes.join(' ') : null

  return { before, after, delta, breakdown, note }
}
