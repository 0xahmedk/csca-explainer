import { useMemo } from 'react'
import { FEATURES, SHARED_VIEW_SEED, makeTrace, windowFeatures } from '../../lib/traces.js'

const WINDOW_LENGTH = 64
const WINDOW_START = 96
const STRIP_SAMPLES = 24

const PATHS = [
  {
    key: 'classical',
    title: 'Classical baseline',
    source: 'Ghabbara and Trifa 2025, reproduced',
    ref: 1,
    reads: 'Collapse to summary statistics',
    model: 'Random Forest and XGBoost',
    fate: 'Order discarded',
  },
  {
    key: 'deep',
    title: 'Deep baseline',
    source: 'Joshi et al. 2025, reproduced on this data',
    ref: 2,
    reads: 'Read the window as a sequence',
    model: 'Hybrid deep model',
    fate: 'Order kept, counters read apart',
  },
  {
    key: 'graph',
    title: 'Proposed',
    source: 'This work',
    reads: 'Read the window as an evolving graph',
    model: 'Temporal Graph Network',
    fate: 'Order and coupling both kept',
  },
]

/**
 * One window, three ways of looking at it. The columns are deliberately
 * identical except for the middle step, which is the only place they differ.
 */
export function ModelPathsFigure({ label, caption }) {
  const windowValues = useMemo(() => {
    const trace = makeTrace({ kind: 'attacker', load: 1, seed: SHARED_VIEW_SEED })
    return trace.slice(WINDOW_START, WINDOW_START + WINDOW_LENGTH)
  }, [])

  const stats = useMemo(
    () => windowFeatures(windowValues, 0, windowValues.length),
    [windowValues],
  )
  const head = useMemo(() => Array.from(windowValues.slice(0, STRIP_SAMPLES)), [windowValues])
  const peak = useMemo(() => Math.max(...windowValues) * 1.05 || 1, [windowValues])

  return (
    <figure className="figure">
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">Illustrative synthetic data, not measurements</span>
      </header>

      <div className="paths">
        {PATHS.map((path) => (
          <section className="paths__col" key={path.key} aria-label={path.title}>
            <h3 className="paths__title">{path.title}</h3>
            <p className="paths__source">
              {path.source}
              {path.ref && (
                <a className="cite" href={`#ref-${path.ref}`}>
                  [{path.ref}]
                </a>
              )}
            </p>

            <div className="paths__step">
              <p className="paths__step-name">The same window, 64 samples, in time order</p>
              <Strip values={head} peak={peak} />
            </div>

            <p className="paths__arrow" aria-hidden="true" />

            <div className="paths__step paths__step--fate">
              <p className="paths__step-name">{path.reads}</p>

              {path.key === 'classical' && (
                <ul className="paths__nums">
                  {FEATURES.map((feature) => (
                    <li key={feature.key}>
                      <span>{feature.label}</span>
                      <strong>{stats[feature.key].toFixed(1)}</strong>
                    </li>
                  ))}
                </ul>
              )}

              {path.key === 'deep' && (
                <ol className="paths__seq">
                  {head.slice(0, 6).map((value, index) => (
                    <li key={index}>
                      <span className="paths__seq-i">t{index}</span>
                      <span className="paths__seq-v">{value.toFixed(0)}</span>
                    </li>
                  ))}
                  <li className="paths__seq-more">on to t63</li>
                </ol>
              )}

              {path.key === 'graph' && <GraphGlyph />}

              <p className="paths__fate">{path.fate}</p>
            </div>

            <p className="paths__arrow" aria-hidden="true" />

            <div className="paths__step">
              <p className="paths__step-name">{path.model}</p>
            </div>

            <p className="paths__arrow" aria-hidden="true" />

            <div className="paths__step paths__step--verdict">
              <p className="paths__step-name">Attack or benign</p>
            </div>
          </section>
        ))}
      </div>

      <p className="paths__foot">
        All three train and test on the same recordings from the same machine, so any difference
        between them belongs to the model and not to the setup.
      </p>

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}

function Strip({ values, peak }) {
  const width = 240
  const height = 34
  const slot = width / values.length
  let d = ''
  values.forEach((value, i) => {
    const x = i * slot + slot / 2
    const y = height - 2 - (Math.min(value, peak) / peak) * (height - 4)
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  })

  return (
    <svg
      className="paths__strip"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={d} className="paths__trace" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/** A few counters and the links between them, three windows running. */
function GraphGlyph() {
  const frames = [
    [[0, 1], [1, 2], [0, 2]],
    [[2, 3], [3, 4]],
    [[0, 1], [1, 2], [0, 2]],
  ]
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * 2 * Math.PI - Math.PI / 2
    return { x: 22 + 16 * Math.cos(angle), y: 22 + 16 * Math.sin(angle) }
  })

  return (
    <div className="glyphs">
      {frames.map((edges, frame) => (
        <figure className="glyphs__item" key={frame}>
          <svg viewBox="0 0 44 44" aria-hidden="true">
            {edges.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={points[a].x}
                y1={points[a].y}
                x2={points[b].x}
                y2={points[b].y}
                className="glyphs__edge"
              />
            ))}
            {points.map((point, i) => (
              <circle key={i} cx={point.x} cy={point.y} r="2.6" className="glyphs__node" />
            ))}
          </svg>
          <figcaption>w{frame + 1}</figcaption>
        </figure>
      ))}
    </div>
  )
}
