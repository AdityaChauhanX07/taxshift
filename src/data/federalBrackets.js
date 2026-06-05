/**
 * 2025 federal tax data (post-OBBBA updates).
 * Each bracket is a [threshold, marginalRate] tuple. The threshold is the
 * lower bound of income at which the marginal rate begins to apply.
 */

/** Single filer brackets. */
export const SINGLE = [
  [0, 0.10],
  [11925, 0.12],
  [48475, 0.22],
  [103350, 0.24],
  [197300, 0.32],
  [250525, 0.35],
  [626350, 0.37],
]

/** Married filing jointly brackets. */
export const MFJ = [
  [0, 0.10],
  [23850, 0.12],
  [96950, 0.22],
  [206700, 0.24],
  [394600, 0.32],
  [501050, 0.35],
  [751600, 0.37],
]

/** Head of household brackets. */
export const HOH = [
  [0, 0.10],
  [17000, 0.12],
  [64850, 0.22],
  [103350, 0.24],
  [197300, 0.32],
  [250525, 0.35],
  [626350, 0.37],
]

/** Standard deduction by filing status. */
export const STANDARD_DEDUCTION = {
  single: 15750,
  mfj: 31500,
  hoh: 23625,
}

/** Child tax credit amount per qualifying child. */
export const CHILD_TAX_CREDIT = 2200

/** Combined self-employment tax rate (12.4% Social Security + 2.9% Medicare). */
export const SE_TAX_RATE = 0.153

/** Portion of net SE income subject to SE tax (92.35%). */
export const SE_FACTOR = 0.9235

/** Cap on the state and local tax (SALT) itemized deduction. */
export const SALT_CAP = 40000

/** Mortgage principal limit for deductible interest. */
export const MORTGAGE_LIMIT = 750000
