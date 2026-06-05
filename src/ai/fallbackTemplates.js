import { formatCurrency } from '../utils/formatters.js'
import { STATE_NAMES, NO_TAX_STATES } from '../data/stateTaxData.js'

/**
 * Deterministic, template-based insight generator used when the AI insight
 * endpoint is unavailable. Produces a warm, specific 2-4 sentence explanation
 * that references the user's actual numbers.
 *
 * @param {string} eventId - the life event modeled
 * @param {import('../engine/lifeEvents.js').LifeEventResult} results
 * @param {Object} formData - the raw user inputs
 * @returns {string} a plain-English insight
 */
export function generateFallbackInsight(eventId, results, formData = {}) {
  const { delta = 0, before, after, breakdown = [] } = results || {}

  /** Format an absolute dollar amount. */
  const money = (n) => formatCurrency(Math.abs(Math.round(n || 0)))
  /** Coerce a field to a finite number. */
  const num = (v) => {
    const x = typeof v === 'number' ? v : parseFloat(v)
    return Number.isFinite(x) ? x : 0
  }
  /** True if any breakdown label contains the given substring. */
  const hasLabel = (text) =>
    breakdown.some((b) => b.label.toLowerCase().includes(text.toLowerCase()))

  switch (eventId) {
    case 'marriage': {
      if (delta === 0) {
        return (
          `Getting married would be close to a wash on your taxes - your combined income lands in roughly the same brackets whether you file jointly or separately, and either way you'd claim the doubled $31,500 standard deduction. ` +
          `Tip: marriage rarely hurts at your income level, so file jointly for the simpler single return and revisit if either income changes significantly.`
        )
      }
      if (delta > 0) {
        const you = num(formData.yourIncome)
        const spouse = num(formData.spouseIncome)
        const hi = Math.max(you, spouse)
        const lo = Math.min(you, spouse)
        const ratio = hi > 0 ? lo / hi : 1

        if (ratio < 0.6) {
          return (
            `Filing jointly is a clear win here - you'd save about ${money(delta)} a year. ` +
            `Because your incomes are uneven, more of your combined earnings get taxed in the lower brackets instead of piling onto one return, and your standard deduction doubles to $31,500. ` +
            `This is the classic "marriage bonus," and the wider the gap between two incomes, the bigger it tends to get. ` +
            `Tip: if the wedding is near year-end, tying the knot before December 31 locks in the full year's benefit.`
          )
        }
        return (
          `Filing jointly would save you about ${money(delta)} a year. ` +
          `Combining your incomes spreads them across the wider joint brackets, and your standard deduction doubles to $31,500. ` +
          `Tip: if you're marrying near year-end, doing it before December 31 gives you the full year's benefit instead of prorating it.`
        )
      }
      return (
        `Filing jointly would actually cost you about ${money(delta)} more a year. ` +
        `When two similar incomes combine, they climb into higher brackets faster than two separate single returns would - the classic "marriage penalty" that tends to hit dual high earners. ` +
        `Tip: maxing out pre-tax retirement contributions (401(k), traditional IRA) lowers your combined taxable income and can offset a good chunk of the penalty.`
      )
    }

    case 'baby': {
      const wasSingle = formData.filingStatus === 'single'
      let text =
        `Welcome to the tax perks of parenthood - this works out to about ${money(delta)} in your favor. ` +
        `The Child Tax Credit puts $2,200 straight against your tax bill; because it's a credit and not a deduction, that's a dollar-for-dollar reduction, not just a trim off your taxable income.`
      if (wasSingle) {
        text +=
          ` Filing as Head of Household also widens your brackets and lifts your standard deduction from $15,750 to $23,625.`
      }
      text +=
        ` Tip: if you'll be paying for daycare, look into the Child and Dependent Care Credit too - it can stack on top of this.`
      return text
    }

    case 'home': {
      const itemizing = hasLabel('mortgage interest')
      if (itemizing) {
        return (
          `Buying this home tips you into itemizing, saving roughly ${money(delta)} a year. ` +
          `Your mortgage interest and property taxes now add up to more than the standard deduction, so it pays to itemize them instead - though keep in mind state and local taxes are capped at $40,000 (the SALT cap). ` +
          `Tip: mortgage interest is front-loaded, so this deduction is strongest in these early years and slowly shrinks as you pay down principal - lean on it now.`
        )
      }
      return (
        `Even with the mortgage interest and property taxes, the standard deduction still comes out ahead, so buying wouldn't lower your federal tax. ` +
        `That's common with lower-priced homes or low mortgage rates, where the deductible amounts simply don't clear the standard-deduction bar. ` +
        `Tip: the home can still be a great investment in its own right - just don't count a tax break into the math right now, because there isn't one yet.`
      )
    }

    case 'move': {
      const toName = STATE_NAMES[formData.targetState] || formData.targetState || 'your new state'
      if (delta === 0) {
        return (
          `Moving to ${toName} would be roughly tax-neutral - your state income tax comes out about the same in both places for your income. ` +
          `Tip: that frees you to weigh the move on lifestyle, housing, and career rather than state taxes, which won't move the needle much here.`
        )
      }
      if (delta > 0) {
        if (NO_TAX_STATES.includes(formData.targetState)) {
          return (
            `Making this move saves you about ${money(delta)} a year, because ${toName} has no state income tax at all - your entire state tax bill simply disappears. ` +
            `Tip: if you move mid-year you'll file part-year returns in both states, so a January 1 move is the cleanest cutoff and avoids splitting the year.`
          )
        }
        return (
          `Relocating to ${toName} trims your state tax by about ${money(delta)} a year. ` +
          `Tip: if you move mid-year you'll file part-year returns in both states, so a January 1 move is the cleanest way to avoid prorating across two tax homes.`
        )
      }
      return (
        `Heading to ${toName} adds about ${money(delta)} a year in state income tax that you aren't paying now. ` +
        `It's easy to overlook, but it's a real recurring cost. ` +
        `Tip: fold this number into your cost-of-living comparison - a higher salary or cheaper rent can quietly get eaten up by a bigger state tax bill.`
      )
    }

    case 'sidebiz': {
      const seTax = after?.seTax ?? 0
      return (
        `A side business is a great move - just go in clear-eyed, because it'd add about ${money(delta)} to your taxes. ` +
        `That's two layers: regular income tax on the profit at your marginal rate, plus ${money(seTax)} in self-employment tax at 15.3%. ` +
        `The SE tax is the part that surprises people - as your own boss you cover both the employer and employee halves of Social Security and Medicare. ` +
        `Tip: track every legitimate expense - home office, software, mileage, equipment - because each dollar you deduct saves you roughly 35-40 cents in combined taxes.`
      )
    }

    case 'divorce': {
      const kids = num(formData.numChildren)
      const hasCustodyAngle =
        kids > 0 && (formData.custodyToMe === true || formData.custodyToMe === 'true' || formData.custodyToMe === false)

      if (delta === 0) {
        return (
          `Splitting into two returns would be roughly tax-neutral here - at your income the joint brackets are essentially double the single ones, so the combined bill lands in about the same place either way. ` +
          `Tip: that means taxes shouldn't weigh heavily in the financial planning; focus on asset division and support instead.`
        )
      }
      if (delta < 0) {
        let text =
          `Splitting into two single returns would raise the household's combined tax by about ${money(delta)} a year. ` +
          `You lose the doubled standard deduction - one $31,500 joint deduction becomes two separate $15,750 ones - and each income can land in higher brackets on its own.`
        if (hasCustodyAngle) {
          text +=
            ` The custodial parent files as Head of Household, which widens those brackets and helps, but it doesn't fully close the gap.`
        }
        text += ` Tip: build this ongoing cost into your post-divorce budget so it isn't a surprise next April.`
        return text
      }
      return (
        `Here's an unexpected silver lining: separating your returns would actually lower the combined tax by about ${money(delta)} a year. ` +
        `The "marriage penalty" had been quietly costing you - when both spouses earn high, similar incomes, filing jointly pushes you into higher brackets faster than two single returns would. ` +
        `Splitting removes that penalty, so the divorce carries at least one small financial upside.`
      )
    }

    default: {
      const direction = delta >= 0 ? `save about ${money(delta)}` : `cost about ${money(delta)} more`
      return `Based on your numbers, this change would ${direction} a year in taxes. The biggest driver is the shift between your before and after totals of ${formatCurrency(before?.total ?? 0)} and ${formatCurrency(after?.total ?? 0)}.`
    }
  }
}
