/**
 * 2025 state income tax data covering 24 states across three regimes:
 * no-tax, flat-rate, and progressive (bracket-based).
 */

/** States with no income tax. Tax owed is always $0. */
export const NO_TAX_STATES = [
  'AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY',
]

/** Flat-rate states, mapping code → single marginal rate. */
export const FLAT_TAX_STATES = {
  AZ: 0.025,
  CO: 0.044,
  GA: 0.0549,
  ID: 0.058,
  IL: 0.0495,
  IN: 0.0305,
  KY: 0.04,
  MA: 0.05,
  MI: 0.0425,
  NC: 0.045,
  PA: 0.0307,
}

/**
 * Progressive states, mapping code → array of [threshold, rate] tuples.
 * The threshold is the lower bound at which the marginal rate begins.
 */
export const PROGRESSIVE_STATES = {
  CA: [
    [0, 0.01],
    [10412, 0.02],
    [24684, 0.04],
    [38959, 0.06],
    [54081, 0.08],
    [68350, 0.093],
    [349137, 0.103],
    [418961, 0.113],
    [698271, 0.123],
  ],
  NY: [
    [0, 0.04],
    [8500, 0.045],
    [11700, 0.0525],
    [13900, 0.0585],
    [80650, 0.0625],
    [215400, 0.0685],
  ],
  NJ: [
    [0, 0.014],
    [20000, 0.0175],
    [35000, 0.035],
    [40000, 0.05525],
    [75000, 0.0637],
  ],
  OH: [
    [0, 0],
    [26050, 0.0275],
    [46100, 0.035],
  ],
}

/** Lookup of state code → full state name. */
export const STATE_NAMES = {
  AK: 'Alaska',
  FL: 'Florida',
  NV: 'Nevada',
  NH: 'New Hampshire',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  WA: 'Washington',
  WY: 'Wyoming',
  AZ: 'Arizona',
  CO: 'Colorado',
  GA: 'Georgia',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KY: 'Kentucky',
  MA: 'Massachusetts',
  MI: 'Michigan',
  NC: 'North Carolina',
  PA: 'Pennsylvania',
  CA: 'California',
  NY: 'New York',
  NJ: 'New Jersey',
  OH: 'Ohio',
}

/**
 * All supported states as { code, name }, sorted alphabetically by name.
 */
export const ALL_STATES = Object.entries(STATE_NAMES)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name))
