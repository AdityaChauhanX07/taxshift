import { useSyncExternalStore } from 'react'

/**
 * Subscribe to a CSS media query and return whether it currently matches.
 * Used for the handful of responsive tweaks that live in inline styles rather
 * than Tailwind classes. Built on useSyncExternalStore so it stays correct
 * across query changes without manual effect/setState juggling.
 * @param {string} query - e.g. '(max-width: 640px)'
 * @returns {boolean} whether the query currently matches
 */
export function useMediaQuery(query) {
  const subscribe = (callback) => {
    const mql = window.matchMedia(query)
    mql.addEventListener('change', callback)
    return () => mql.removeEventListener('change', callback)
  }
  const getSnapshot = () => window.matchMedia(query).matches
  const getServerSnapshot = () => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
