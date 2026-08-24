import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FEATURES,
  SHARED_VIEW_SEED,
  makeTrace,
  shuffleWindow,
  windowFeatures,
} from '../../lib/traces.js'
import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'
import { WindowBars } from './shuffle/WindowBars.jsx'

const WINDOW_LENGTH = 64 // 3.2 ms, about four and a half turns of the probe loop
const WINDOW_START = 96
const AUTO_MS = 1100

const PANELS = [
  { kind: 'attacker', tone: 'attacker', title: 'Attacker probe loop' },
  { kind: 'tenant', tone: 'tenant', title: 'Video compression service, heavy load' },
]

const format = (value) => value.toFixed(2)

/** Renders -0.00 as 0.00, which is the same number and less alarming to read. */
const formatDelta = (value) => (Math.abs(value) < 0.005 ? '0.00' : value.toFixed(2))

export function ShuffleFigure({ label, caption }) {
  const rootRef = useRef(null)
  const inView = useInView(rootRef, 0.2)
  const still = usePrefersReducedMotion()

  const [shuffles, setShuffles] = useState(0)
  const [auto, setAuto] = useState(false)

  // The same two traces every other section draws, held at full load.
  const windows = useMemo(
    () =>
      PANELS.map((panel) => {
        const trace = makeTrace({ kind: panel.kind, load: 1, seed: SHARED_VIEW_SEED })
        return trace.slice(WINDOW_START, WINDOW_START + WINDOW_LENGTH)
      }),
    [],
  )

  const top = useMemo(() => {
    let peak = 0
    for (const values of windows) {
      for (const value of values) if (value > peak) peak = value
    }
    return peak * 1.05 || 1
  }, [windows])

  const views = useMemo(
    () =>
      windows.map((values, index) =>
        shuffles === 0 ? values : shuffleWindow(values, `${index}|${shuffles}`),
      ),
    [windows, shuffles],
  )

  // Statistics of the original order, to subtract from.
  const baseStats = useMemo(() => windows.map((values) => windowFeatures(values, 0, values.length)), [windows])
  const viewStats = useMemo(() => views.map((values) => windowFeatures(values, 0, values.length)), [views])

  useEffect(() => {
    if (still || !auto || !inView) return undefined
    const id = setInterval(() => setShuffles((count) => count + 1), AUTO_MS)
    return () => clearInterval(id)
  }, [still, auto, inView])

  return (
    <figure className="figure" ref={rootRef}>
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">
          Illustrative synthetic data, not measurements. Fully loaded machine.
        </span>
      </header>

      <div className="shuf">
        {PANELS.map((panel, index) => (
          <section className="shuf__panel" key={panel.kind} aria-label={panel.title}>
            <h3 className="shuf__title">{panel.title}</h3>

            <WindowBars
              values={views[index]}
              top={top}
              tone={panel.tone}
              settleKey={shuffles}
              title={`${panel.title}, one window of ${WINDOW_LENGTH} samples`}
            />
            <p className="shuf__axis">
              {WINDOW_LENGTH} samples, 3.2 ms, one bar per 50 microsecond sample
            </p>

            <table className="stats">
              <thead>
                <tr>
                  <th scope="col">Statistic</th>
                  <th scope="col">Value</th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature) => (
                  <tr key={feature.key}>
                    <th scope="row">{feature.label}</th>
                    <td>{format(viewStats[index][feature.key])}</td>
                    <td className="stats__delta">
                      {formatDelta(viewStats[index][feature.key] - baseStats[index][feature.key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <p className="shuf__result" aria-live="polite">
        {shuffles === 0 ? (
          <>Both windows are in time order. Shuffle them and watch the Change column.</>
        ) : (
          <>
            Shuffled <strong>{shuffles}</strong> {shuffles === 1 ? 'time' : 'times'}. Every
            statistic is unchanged. The rhythm is gone and the numbers do not know.
          </>
        )}
      </p>

      <div className="stepctl">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setShuffles(shuffles + 1)}
        >
          Shuffle the samples
        </button>
        <div className="stepctl__row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setShuffles(0)
              setAuto(false)
            }}
            disabled={shuffles === 0}
          >
            Time order
          </button>
          {!still && (
            <button
              type="button"
              className={`btn${auto ? ' is-on' : ''}`}
              aria-pressed={auto}
              onClick={() => setAuto(!auto)}
            >
              {auto ? 'Stop' : 'Keep shuffling'}
            </button>
          )}
        </div>
      </div>

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}
