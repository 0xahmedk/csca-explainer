import { useEffect, useMemo, useRef, useState } from 'react'
import {
  GRAPH_COUNTERS,
  PERIOD_WINDOWS,
  TOTAL_WINDOWS,
  recurrenceRow,
} from '../../lib/graph.js'
import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'
import { CounterGraph } from './graph/CounterGraph.jsx'

const TICK_MS = 1100
const STILL_WINDOW = 4

const PANELS = [
  { kind: 'attacker', title: 'Attacker probe loop' },
  { kind: 'tenant', title: 'Video compression service, heavy load' },
]

export function GraphFigure({ label, caption }) {
  const rootRef = useRef(null)
  const inView = useInView(rootRef, 0.15)
  const still = usePrefersReducedMotion()

  const [windowIndex, setWindowIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  const active = still ? STILL_WINDOW : windowIndex

  const rows = useMemo(
    () => PANELS.map((panel) => recurrenceRow(panel.kind, active)),
    [active],
  )

  useEffect(() => {
    if (still || !playing || !inView) return undefined
    const id = setInterval(() => {
      setWindowIndex((current) => (current + 1) % TOTAL_WINDOWS)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [still, playing, inView])

  return (
    <figure className="figure" ref={rootRef}>
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">
          Illustrative synthetic data, not measurements. Fully loaded machine.
        </span>
      </header>

      <div className="cg">
        {PANELS.map((panel, index) => (
          <section className="cg__panel" key={panel.kind} aria-label={panel.title}>
            <h3 className="cg__title">{panel.title}</h3>

            <CounterGraph kind={panel.kind} windowIndex={active} title={panel.title} />

            <p className="cg__striplabel">
              How much each window resembles this one
              <span>window 1 to {TOTAL_WINDOWS}</span>
            </p>
            <div className="strip" aria-hidden="true">
              {rows[index].map((value, w) => (
                <span
                  key={w}
                  className={`strip__cell${w === active ? ' is-current' : ''}`}
                  style={{ '--weight': Math.max(0, value).toFixed(3) }}
                />
              ))}
            </div>
            <p className="cg__read">
              {panel.kind === 'attacker'
                ? `The same coupling returns every ${PERIOD_WINDOWS} windows, on the period of the probe loop.`
                : 'Dense coupling, different every window, and it never comes back.'}
            </p>
          </section>
        ))}
      </div>

      <ol className="cg__key">
        {GRAPH_COUNTERS.map((counter, i) => (
          <li key={counter.name}>
            <span className="cg__key-num">{i + 1}</span>
            {counter.name}
          </li>
        ))}
      </ol>

      {!still && (
        <div className="stepctl">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setWindowIndex((windowIndex + 1) % TOTAL_WINDOWS)}
          >
            Next window
          </button>
          <div className="stepctl__row">
            <button
              type="button"
              className="btn"
              onClick={() =>
                setWindowIndex((windowIndex + TOTAL_WINDOWS - 1) % TOTAL_WINDOWS)
              }
            >
              Back
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setWindowIndex(0)
                setPlaying(false)
              }}
            >
              Restart
            </button>
            <button
              type="button"
              className={`btn${playing ? ' is-on' : ''}`}
              aria-pressed={playing}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        </div>
      )}

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}
