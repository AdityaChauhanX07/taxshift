import { useState } from 'react'
import { COLORS, FONTS } from '../utils/theme.js'
import { useMediaQuery } from '../utils/useMediaQuery.js'

/**
 * Minimal, stroke-based identifier icons per event. Each renders inside a
 * shared 28x28 viewBox <svg> that sets stroke="currentColor", so the color is
 * driven entirely by the wrapping span (selected vs. default card state).
 */
const ICON_PATHS = {
  // Two interlocking rings.
  marriage: (
    <>
      <circle cx="10" cy="14" r="7" />
      <circle cx="18" cy="14" r="7" />
    </>
  ),
  // Head + onesie body with two arm bumps and a leg notch.
  baby: (
    <>
      <circle cx="14" cy="7" r="3" />
      <path d="M10 12 L18 12 L17 20 L15 20 L14 18 L13 20 L11 20 Z" />
      <path d="M10 13 L8 16" />
      <path d="M18 13 L20 16" />
    </>
  ),
  // Triangle roof on a rectangle body with a center door.
  home: (
    <>
      <path d="M5 13 L14 5 L23 13" />
      <path d="M7 13 L7 22 L21 22 L21 13" />
      <path d="M11.5 22 L11.5 17 L16.5 17 L16.5 22" />
    </>
  ),
  // Location pin (circle + point) with a curved arrow sweeping right.
  move: (
    <>
      <circle cx="7" cy="8" r="3" />
      <path d="M4.8 10 L7 14 L9.2 10" />
      <path d="M11 17 Q16 18.5 20 13" />
      <path d="M17.5 11.5 L20 13 L17.5 14.5" />
    </>
  ),
  // Briefcase: body, handle, clasp line.
  sidebiz: (
    <>
      <rect x="5" y="10" width="18" height="11" rx="1.5" />
      <path d="M11 10 L11 8 L17 8 L17 10" />
      <path d="M5 15 L23 15" />
    </>
  ),
  // A single stem forking into two diverging legs.
  divorce: (
    <>
      <path d="M14 4 L14 12" />
      <path d="M14 12 L9 23" />
      <path d="M14 12 L19 23" />
    </>
  ),
}

/**
 * The six supported life events, in display order. Exported so InputForm can
 * reuse the titles without duplicating the list.
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared event list consumed by App.jsx and InputForm.jsx
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
  const isMobile = useMediaQuery('(max-width: 639px)')
  const iconSize = isMobile ? 24 : 28

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EVENTS.map((event, i) => {
          const selected = selectedEvent === event.id
          const isHovered = hovered === event.id && !selected
          const tag = String(i + 1).padStart(2, '0')

          return (
            <button
              key={event.id}
              type="button"
              className={`ts-event-card${selected ? ' is-selected' : ''}`}
              onClick={() => onSelect(event.id)}
              onMouseEnter={() => setHovered(event.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                textAlign: 'left',
                cursor: 'pointer',
                background: selected ? COLORS.textPrimary : COLORS.card,
                border: `1px solid ${
                  selected || isHovered ? COLORS.textPrimary : COLORS.border
                }`,
                borderRadius: 2,
                padding: '20px 22px',
                fontFamily: FONTS.sans,
              }}
            >
              {/* Subtle stroke-based identifier icon, top-right corner. */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: isMobile ? 12 : 16,
                  right: isMobile ? 14 : 18,
                  display: 'flex',
                  color: selected ? COLORS.textSecondary : COLORS.tagMuted,
                  opacity: isHovered ? 0.8 : 0.5,
                  transition: 'opacity 200ms ease',
                  pointerEvents: 'none',
                }}
              >
                <svg
                  width={iconSize}
                  height={iconSize}
                  viewBox="0 0 28 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICON_PATHS[event.id]}
                </svg>
              </span>

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
