/**
 * Static, non-interactive "sample result" card shown in the hero. All numbers
 * are hardcoded (a marketing teaser, not live data) so visitors see what
 * TaxShift produces before touching a thing. Styled as a dark reveal card to
 * preview the dark results experience.
 */
export default function HeroPreview() {
  return (
    <div className="preview">
      <div className="preview-head">
        <div>
          <div className="preview-title">Getting Married</div>
          <div className="preview-meta">
            $130,000 + $40,000 income
            <br />
            Arizona · Married Filing Jointly
          </div>
        </div>
        <span className="preview-tag">Sample</span>
      </div>

      <div className="ba-row">
        <div className="ba-cell">
          <div className="ba-label">Before</div>
          <div className="ba-val mono">$26,401</div>
          <div className="ba-rate">15.5% rate</div>
        </div>
        <div className="ba-arrow">→</div>
        <div className="ba-cell">
          <div className="ba-label">After</div>
          <div className="ba-val mono">$23,761</div>
          <div className="ba-rate">14.0% rate</div>
        </div>
      </div>

      <div className="impact">
        <div className="big mono">$2,640</div>
        <div className="cap">
          / year saved
          <br />≈ <b>$220/mo</b>
        </div>
      </div>
    </div>
  )
}
