const STEPS = [
  ['01', 'Pick a life event'],
  ['02', 'Enter your numbers'],
  ['03', 'See your tax impact'],
]

/**
 * Horizontal 3-step wayfinding strip. Highlights the active stage; dashed
 * connectors sit between steps. Reused at the top of the selector and the form.
 * @param {{ stage?: number }} props - index (0-2) of the current step
 */
export default function HowItWorks({ stage = 0 }) {
  return (
    <div className="steps">
      {STEPS.flatMap(([num, text], i) => {
        const node = (
          <div key={`s${i}`} className={`step${i === stage ? ' active' : ''}`}>
            <span className="n">{num}</span>
            <span className="t">{text}</span>
          </div>
        )
        return i < STEPS.length - 1
          ? [node, <div key={`l${i}`} className="step-line" />]
          : [node]
      })}
    </div>
  )
}
