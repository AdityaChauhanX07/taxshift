import { useEffect, useState } from 'react'

/** Reusable arrow-less wordmark used in the nav and footer. */
export function Wordmark({ fontSize }) {
  return (
    <a className="wordmark" href="#top" style={fontSize ? { fontSize } : undefined}>
      Tax<span className="shift">Shift</span>
      <span className="dot">.</span>
    </a>
  )
}

/**
 * Fixed top navigation. Turns translucent once scrolled, and flips to the dark
 * ("on-void") treatment while the results section owns the viewport.
 * @param {{ onDark: boolean, onStart: () => void }} props
 */
export default function Nav({ onDark, onStart }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cls = ['nav', scrolled ? 'scrolled' : '', onDark ? 'on-void' : ''].join(' ').trim()
  return (
    <nav className={cls}>
      <Wordmark />
      <button type="button" className="nav-cta" onClick={onStart}>
        Run a scenario
      </button>
    </nav>
  )
}
