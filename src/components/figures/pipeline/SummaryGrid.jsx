import { COUNTERS } from '../../../lib/traces.js'

const STATS = [
  { key: 'mean', label: 'mean' },
  { key: 'variance', label: 'var' },
]

const pct = (value, max) => `${Math.max(0, Math.min(100, (value / max) * 100)).toFixed(1)}%`

/**
 * What the window becomes. Eight numbers, and from here on the classifier sees
 * nothing else.
 */
export function SummaryGrid({ attacker, tenant, scales, settleKey }) {
  return (
    <div className="sgrid" key={settleKey}>
      {COUNTERS.map((counter) =>
        STATS.map((stat) => {
          const id = `${counter.key}-${stat.key}`
          return (
            <div className="sgrid__row" key={id}>
              <span className="sgrid__label">
                {counter.label.replace('LLC ', '').replace('Instructions retired', 'instructions')}
                <span className="sgrid__stat"> {stat.label}</span>
              </span>
              <span className="sgrid__bars">
                <span className="sgrid__track">
                  <span
                    className="sgrid__fill sgrid__fill--attacker"
                    style={{ width: pct(attacker[counter.key][stat.key], scales[id]) }}
                  />
                </span>
                <span className="sgrid__track">
                  <span
                    className="sgrid__fill sgrid__fill--tenant"
                    style={{ width: pct(tenant[counter.key][stat.key], scales[id]) }}
                  />
                </span>
              </span>
            </div>
          )
        }),
      )}
    </div>
  )
}
