import { FEATURES } from '../../../lib/traces.js'

const pct = (value, max) => `${Math.max(0, Math.min(100, (value / max) * 100)).toFixed(1)}%`

/**
 * Part 2, the collapse. One 32-sample window becomes four numbers, and those
 * four numbers are the whole of what the classifier is given.
 */
export function FeatureBars({ attackerFeatures, tenantFeatures, detector, windowIndex }) {
  let closeness = 0
  for (const { key } of FEATURES) {
    const max = detector.display[key]
    closeness += 1 - Math.min(1, Math.abs(attackerFeatures[key] - tenantFeatures[key]) / max)
  }
  const overlap = Math.round((closeness / FEATURES.length) * 100)

  return (
    <div className="collapse">
      <p className="collapse__step">
        <span aria-hidden="true">↓</span> 32 samples → 4 numbers
      </p>

      <div className="bars" key={windowIndex}>
        {FEATURES.map((feature) => (
          <div className="bars__row" key={feature.key}>
            <span className="bars__label">{feature.label}</span>
            <span className="bars__pair">
              <span className="bars__track">
                <span
                  className="bars__fill bars__fill--attack"
                  style={{ width: pct(attackerFeatures[feature.key], detector.display[feature.key]) }}
                />
              </span>
              <span className="bars__track">
                <span
                  className="bars__fill bars__fill--benign"
                  style={{ width: pct(tenantFeatures[feature.key], detector.display[feature.key]) }}
                />
              </span>
            </span>
          </div>
        ))}
      </div>

      <p className="collapse__overlap">
        Summary overlap <strong>{overlap}%</strong>
      </p>
    </div>
  )
}
