import { useState } from 'react'
import { COLORS, FONTS } from '../utils/theme.js'

/**
 * The six supported life events, in display order. Exported so InputForm can
 * reuse the titles without duplicating the list.
 */
export const EVENTS = [
  {
    id: 'marriage',
    title: 'Getting Married',
    desc: 'Filing status, combined income, marriage bonus or penalty',
  },
  {
    id: 'baby',
    title: 'Having a Baby',
    desc: 'Child Tax Credit, Head of Household status, dependent benefits',
  },
  {
    id: 'home',
    title: 'Buying a Home',
    desc: 'Mortgage interest deduction, property taxes, standard vs. itemized',
  },
  {
    id: 'move',
    title: 'Moving States',
    desc: 'State income tax differential, partial-year considerations',
  },
  {
    id: 'sidebiz',
    title: 'Starting a Side Business',
    desc: 'Self-employment tax, business deductions, additional income tax',
  },
  {
    id: 'divorce',
    title: 'Getting Divorced',
    desc: 'Separate filings, lost joint benefits, credit reallocation',
  },
]

/**
 * Grid of selectable life-event cards.
 * @param {{selectedEvent: string|null, onSelect: (id: string) => void}} props
 */
export default function EventSelector({ selectedEvent, onSelect }) {
  const [hovered, setHovered] = useState(null)

  return (
    <section>
      <h2
        style={{
          fontFamily: FONTS.serif,
          fontSize: 24,
          fontWeight: 400,
          color: COLORS.textPrimary,
          margin: '0 0 16px',
        }}
      >
        What's changing?
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        {EVENTS.map((event, i) => {
          const selected = selectedEvent === event.id
          const isHovered = hovered === event.id && !selected
          const tag = String(i + 1).padStart(2, '0')

          return (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event.id)}
              onMouseEnter={() => setHovered(event.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                background: selected ? COLORS.textPrimary : COLORS.card,
                border: `1px solid ${
                  selected || isHovered ? COLORS.textPrimary : COLORS.border
                }`,
                borderRadius: 2,
                padding: '16px 18px',
                transition: 'border-color 0.15s ease',
                fontFamily: FONTS.sans,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  color: selected ? COLORS.selectedDesc : COLORS.tagMuted,
                  marginBottom: 8,
                }}
              >
                {tag}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: selected ? COLORS.selectedText : COLORS.textPrimary,
                  marginBottom: 5,
                }}
              >
                {event.title}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.45,
                  color: selected ? COLORS.selectedDesc : COLORS.textSecondary,
                }}
              >
                {event.desc}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
