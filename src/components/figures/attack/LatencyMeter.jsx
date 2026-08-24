/**
 * The only thing the attacker ever actually observes: how long an access took,
 * against the threshold that separates a cache hit from a trip to memory.
 */
export function LatencyMeter({ meter, value }) {
  const pct = (cycles) => `${Math.max(0, Math.min(100, (cycles / meter.max) * 100))}%`
  const above = meter.activity === 'above'
  const inActivity = value !== null && (above ? value >= meter.threshold : value < meter.threshold)

  return (
    <div className="meter">
      <p className="meter__head">
        <span>{meter.label}</span>
        <strong>{value === null ? 'not measured yet' : `${value} cycles`}</strong>
      </p>

      <div className="meter__track">
        <span
          className="meter__region"
          style={
            above
              ? { left: pct(meter.threshold), right: 0 }
              : { left: 0, right: `${100 - (meter.threshold / meter.max) * 100}%` }
          }
        />
        <span className="meter__threshold" style={{ left: pct(meter.threshold) }} />
        {value !== null && (
          <span
            className={`meter__marker${inActivity ? ' is-activity' : ''}`}
            style={{ left: pct(value) }}
          />
        )}
      </div>

      <p className="meter__scale">
        <span>0</span>
        <span>threshold {meter.threshold}</span>
        <span>{meter.max}</span>
      </p>
      <p className="meter__key">
        Shaded band is {meter.activityLabel}: {above ? 'slower than' : 'faster than'} the threshold.
      </p>
    </div>
  )
}
