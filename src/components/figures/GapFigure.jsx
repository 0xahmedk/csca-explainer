import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  WINDOWS_PER_VIEW,
  WINDOW_SAMPLES,
  attackerRecall,
  decide,
  falseAlarmRate,
  getDetector,
  makeTrace,
  tenantDecisionLog,
  windowFeatures,
} from '../../lib/traces.js'
import { useInView } from '../../hooks/useInView.js'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion.js'
import { TraceChart } from './gap/TraceChart.jsx'
import { FeatureBars } from './gap/FeatureBars.jsx'
import { VerdictPanel } from './gap/VerdictPanel.jsx'
import { LoadSlider } from './gap/LoadSlider.jsx'

const TICK_MS = 900
const DEFAULT_LOAD = 0.6
const LOG_LENGTH = 32

export function GapFigure({ label, caption }) {
  const rootRef = useRef(null)
  const sliderId = useId()

  const [load, setLoad] = useState(DEFAULT_LOAD)
  const [pos, setPos] = useState({ block: 0, window: 0 })

  const inView = useInView(rootRef, 0.15)
  const still = usePrefersReducedMotion()
  const animating = inView && !still

  const detector = useMemo(() => getDetector(), [])

  // A new load level is a new run: start the log over.
  useEffect(() => {
    setPos({ block: 0, window: 0 })
  }, [load])

  useEffect(() => {
    if (!animating) return undefined
    const id = setInterval(() => {
      setPos((previous) =>
        previous.window + 1 < WINDOWS_PER_VIEW
          ? { block: previous.block, window: previous.window + 1 }
          : { block: previous.block + 1, window: 0 },
      )
    }, TICK_MS)
    return () => clearInterval(id)
  }, [animating])

  // Paused, off screen, or holding still: show a fully settled view instead of
  // a half-drawn one, so the figure reads correctly without ever moving.
  const block = animating ? pos.block : 0
  const windowIndex = animating ? pos.window : WINDOWS_PER_VIEW - 1
  const sequence = animating ? pos.block * WINDOWS_PER_VIEW + pos.window : LOG_LENGTH - 1

  const attacker = useMemo(() => makeTrace({ kind: 'attacker', seed: `view|${block}` }), [block])
  const tenant = useMemo(
    () => makeTrace({ kind: 'tenant', load, seed: `view|${block}` }),
    [block, load],
  )

  const alarms = useMemo(
    () =>
      Array.from(
        { length: WINDOWS_PER_VIEW },
        (_, w) => decide(windowFeatures(tenant, w * WINDOW_SAMPLES), detector).isAttack,
      ),
    [tenant, detector],
  )

  const attackerFeatures = useMemo(
    () => windowFeatures(attacker, windowIndex * WINDOW_SAMPLES),
    [attacker, windowIndex],
  )
  const tenantFeatures = useMemo(
    () => windowFeatures(tenant, windowIndex * WINDOW_SAMPLES),
    [tenant, windowIndex],
  )

  const log = useMemo(
    () => tenantDecisionLog(load, detector, sequence, LOG_LENGTH),
    [load, detector, sequence],
  )

  // Keep the headline rate off the drag path.
  const settledLoad = useDeferredValue(load)
  const rate = useMemo(() => falseAlarmRate(settledLoad, detector), [settledLoad, detector])
  const recall = useMemo(() => attackerRecall(detector), [detector])

  return (
    <figure className="figure figure--live" ref={rootRef}>
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">Illustrative synthetic data, not measurements</span>
      </header>

      <div className="gap">
        <section className="gap__panel gap__panel--trace" aria-label="Counter traces">
          <h3 className="gap__title">Two tenants, one cache</h3>
          <TraceChart
            attacker={attacker}
            tenant={tenant}
            alarms={alarms}
            decidedThrough={windowIndex}
            currentWindow={windowIndex}
          />
          <ul className="legend legend--figure">
            <li className="legend__item">
              <span className="legend__rule legend__rule--attack" aria-hidden="true" />
              Attacker, probe loop
            </li>
            <li className="legend__item">
              <span className="legend__rule legend__rule--benign" aria-hidden="true" />
              Tenant, video compression
            </li>
          </ul>
          <p className="gap__axis">
            LLC misses per 50&nbsp;µs sample · 12.8&nbsp;ms window · dividers mark the detector’s
            1.6&nbsp;ms decision windows
          </p>
        </section>

        <section className="gap__panel" aria-label="Window summary statistics">
          <h3 className="gap__title">What the detector sees</h3>
          <FeatureBars
            attackerFeatures={attackerFeatures}
            tenantFeatures={tenantFeatures}
            detector={detector}
            windowIndex={block * WINDOWS_PER_VIEW + windowIndex}
          />
        </section>

        <section className="gap__panel" aria-label="Verdict and false alarm rate">
          <h3 className="gap__title">Verdict</h3>
          <VerdictPanel
            attackerVerdict={decide(attackerFeatures, detector).isAttack}
            tenantVerdict={alarms[windowIndex]}
            falseAlarmRate={rate}
            recall={recall}
            log={log}
          />
        </section>
      </div>

      <LoadSlider id={sliderId} load={load} onChange={setLoad} />

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}
