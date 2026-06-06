import { useEffect, useRef, useState } from 'react'

/**
 * Fires once when the element scrolls into view. Uses IntersectionObserver with
 * a setTimeout safety net so content can never stay permanently hidden (e.g. if
 * the element starts already on-screen or the observer never fires).
 * @param {number} threshold - fraction of the element that must be visible
 * @returns {[React.RefObject, boolean]} ref to attach, and whether it's in view
 */
// eslint-disable-next-line react-refresh/only-export-components -- small co-located hook shared with the Reveal wrapper
export function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold },
    )
    io.observe(el)
    // Safety net: never leave content hidden if the observer doesn't fire.
    const fallback = setTimeout(() => setInView(true), 1500)
    return () => {
      io.disconnect()
      clearTimeout(fallback)
    }
  }, [threshold])
  return [ref, inView]
}

/**
 * Wrapper that fades/slides its children in the first time they scroll into
 * view. Purely decorative — never gates content (the `in` class only animates).
 * @param {{ children: React.ReactNode, delay?: number, as?: string,
 *   className?: string, style?: Object }} props
 */
export default function Reveal({ children, delay = 0, as = 'div', className = '', style }) {
  const [ref, inView] = useInView()
  const Tag = as
  const d = delay ? `d${delay}` : ''
  const cls = ['reveal', d, inView ? 'in' : '', className].join(' ').replace(/\s+/g, ' ').trim()
  return (
    <Tag ref={ref} className={cls} style={style}>
      {children}
    </Tag>
  )
}
