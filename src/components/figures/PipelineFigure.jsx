import { useEffect, useMemo, useRef, useState } from 'react'
import {
  COUNTERS,
  SHARED_VIEW_SEED,
  WINDOWS_PER_VIEW,
  WINDOW_SAMPLES,
  decide,
  getDetector,
  makeCounterSet,
  windowFeatures,
  windowSummary,
} from '../../lib/traces.js'
import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'
import { CounterStrips } from './pipeline/CounterStrips.jsx'
import { SummaryGrid } from './pipeline/SummaryGrid.jsx'

const TICK_MS = 1500
const STILL_WINDOW = 3

const STAGES = [
  {
    key: 'signal',
    name: 'Raw counter signal',
    note: 'Hardware counters, read through perf and sampled every 50 microseconds. Four of them are shown here.',
  },
  {
    key: 'window',
    name: 'Sliding window',
    note: 'A window of 32 samples, 1.6 milliseconds of counter history, advancing along the signal.',
  },
  {
    key: 'summary',
    name: 'Summary statistics',
    note: 'The window collapses to the mean and variance of each counter. Eight numbers, and the samples themselves are set aside.',
  },
  {
    key: 'model',
    name: 'Tree based classifier',
    note: 'A Random Forest or XGBoost ensemble reads those eight numbers and scores them.',
  },
  {
    key: 'verdict',
    name: 'Verdict and response',
    note: 'Attack or benign. On an attack the mitigation runs automatically, injecting cache noise to spoil the measurement.',
  },
]

export function PipelineFigure({ label, caption }) {
  const rootRef = useRef(null)
  const inView = useInView(rootRef, 0.15)
  const still = usePrefersReducedMotion()

  const [stage, setStage] = useState(0)
  const [windowIndex, setWindowIndex] = useState(0)
  const [playing, setPlaying] = useState(true)

  const detector = useMemo(() => getDetector(), [])

  // Section 3 shows the idle machine only, on the traces every other section
  // draws from.
  const attacker = useMemo(
    () => makeCounterSet({ kind: 'attacker', load: 0, seed: SHARED_VIEW_SEED }),
    [],
  )
  const tenant = useMemo(
    () => makeCounterSet({ kind: 'tenant', load: 0, seed: SHARED_VIEW_SEED }),
    [],
  )

  // Bar scales are fixed across every window, so a bar moving means the signal
  // moved and not the axis.
  const scales = useMemo(() => {
    const out = {}
    for (const { key } of COUNTERS) {
      out[`${key}-mean`] = 0
      out[`${key}-variance`] = 0
    }
    for (let w = 0; w < WINDOWS_PER_VIEW; w += 1) {
      const a = windowSummary(attacker, w * WINDOW_SAMPLES)
      const t = windowSummary(tenant, w * WINDOW_SAMPLES)
      for (const { key } of COUNTERS) {
        out[`${key}-mean`] = Math.max(out[`${key}-mean`], a[key].mean, t[key].mean)
        out[`${key}-variance`] = Math.max(out[`${key}-variance`], a[key].variance, t[key].variance)
      }
    }
    for (const id of Object.keys(out)) out[id] = out[id] * 1.1 || 1
    return out
  }, [attacker, tenant])

  const activeWindow = still ? STILL_WINDOW : windowIndex
  const activeStage = still ? STAGES.length - 1 : stage
  const start = activeWindow * WINDOW_SAMPLES

  const attackerSummary = useMemo(() => windowSummary(attacker, start), [attacker, start])
  const tenantSummary = useMemo(() => windowSummary(tenant, start), [tenant, start])

  const attackerVerdict = decide(windowFeatures(attacker.misses, start), detector)
  const tenantVerdict = decide(windowFeatures(tenant.misses, start), detector)

  const advance = () => {
    if (stage + 1 < STAGES.length) {
      setStage(stage + 1)
      return
    }
    setStage(0)
    setWindowIndex((windowIndex + 1) % WINDOWS_PER_VIEW)
  }

  const back = () => {
    if (stage > 0) {
      setStage(stage - 1)
      return
    }
    setStage(STAGES.length - 1)
    setWindowIndex((windowIndex + WINDOWS_PER_VIEW - 1) % WINDOWS_PER_VIEW)
  }

  const advanceRef = useRef(advance)
  useEffect(() => {
    advanceRef.current = advance
  })

  useEffect(() => {
    if (still || !playing || !inView) return undefined
    const id = setInterval(() => advanceRef.current(), TICK_MS)
    return () => clearInterval(id)
  }, [still, playing, inView])

  return (
    <figure className="figure" ref={rootRef}>
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">
          Illustrative synthetic data, not measurements. Idle machine.
        </span>
      </header>

      <ol className="pipe">
        {STAGES.map((entry, index) => (
          <li
            key={entry.key}
            className={`pipe__stage${index === activeStage ? ' is-active' : ''}`}
            aria-current={index === activeStage ? 'step' : undefined}
          >
            <p className="pipe__head">
              <span className="pipe__num">{index + 1}</span>
              <span className="pipe__name">{entry.name}</span>
            </p>
            <p className="pipe__note">{entry.note}</p>

            {entry.key === 'signal' && (
              <>
                <CounterStrips
                  attacker={attacker}
                  tenant={tenant}
                  windowIndex={activeWindow}
                  windowActive={activeStage >= 1}
                />
                <ul className="legend legend--figure">
                  <li className="legend__item">
                    <span className="legend__rule legend__rule--solid" aria-hidden="true" />
                    Attacker probe loop
                  </li>
                  <li className="legend__item">
                    <span className="legend__rule legend__rule--dashed" aria-hidden="true" />
                    Video compression service
                  </li>
                </ul>
              </>
            )}

            {entry.key === 'window' && (
              <div className="pipe__windows" aria-hidden="true">
                {Array.from({ length: WINDOWS_PER_VIEW }, (_, w) => (
                  <span
                    key={w}
                    className={`pipe__win${w === activeWindow ? ' is-current' : ''}`}
                  />
                ))}
              </div>
            )}

            {entry.key === 'summary' && (
              <>
                <p className="pipe__collapse">32 samples per counter become 8 numbers</p>
                <SummaryGrid
                  attacker={attackerSummary}
                  tenant={tenantSummary}
                  scales={scales}
                  settleKey={activeWindow}
                />
              </>
            )}

            {entry.key === 'model' && (
              <div className="pipe__model">
                <TreeIcon />
                <p>
                  Eight features in, one score out, for each process under watch. The ensemble was
                  trained on labelled recordings of known attacks and known benign software.
                </p>
              </div>
            )}

            {entry.key === 'verdict' && (
              <ul className="pverdict">
                <li className="pverdict__row">
                  <span className="pverdict__who">Attacker probe loop</span>
                  <span className="badge badge--strong">
                    {attackerVerdict.isAttack ? 'attack' : 'benign'}
                  </span>
                  <span className="pverdict__action">
                    {attackerVerdict.isAttack ? 'Noise injection started' : 'No action'}
                  </span>
                </li>
                <li className="pverdict__row">
                  <span className="pverdict__who">Video compression service</span>
                  <span className="badge">{tenantVerdict.isAttack ? 'attack' : 'benign'}</span>
                  <span className="pverdict__action">
                    {tenantVerdict.isAttack ? 'Noise injection started' : 'No action'}
                  </span>
                </li>
              </ul>
            )}
          </li>
        ))}
      </ol>

      {!still && (
        <div className="stepctl">
          <button type="button" className="btn btn--primary" onClick={advance}>
            {stage + 1 < STAGES.length ? 'Next stage' : 'Next window'}
          </button>
          <div className="stepctl__row">
            <button type="button" className="btn" onClick={back}>
              Back
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setStage(0)
                setWindowIndex(0)
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

function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="pipe__icon">
      <circle cx="12" cy="4.5" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="13" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="13" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="21" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="18" cy="21" r="2.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.4 6.2 7.6 11.3M13.6 6.2l2.8 5.1M6 15.25v3.5M18 15.25v3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
