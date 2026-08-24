import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  SECRET_BITS,
  STEP_COUNT,
  TECHNIQUES,
  attackState,
  recoveredCount,
  techniqueById,
} from '../../lib/attacks.js'
import { useInView } from '../../hooks/useInView.js'
import { ViewToggle } from '../ViewToggle.jsx'
import { CacheSet } from './attack/CacheSet.jsx'
import { LatencyMeter } from './attack/LatencyMeter.jsx'
import { StepControls } from './attack/StepControls.jsx'

const AUTO_MS = 1400

const OPTIONS = TECHNIQUES.map((technique) => ({
  value: technique.id,
  label: technique.name,
}))

export function AttackFigure({ label, caption }) {
  const rootRef = useRef(null)
  const name = useId()

  const [techniqueId, setTechniqueId] = useState(TECHNIQUES[0].id)
  const [iteration, setIteration] = useState(0)
  const [step, setStep] = useState(0)
  const [autoRun, setAutoRun] = useState(false)

  const inView = useInView(rootRef, 0.2)
  const technique = techniqueById(techniqueId)
  const state = useMemo(
    () => attackState(techniqueId, iteration, step),
    [techniqueId, iteration, step],
  )

  const next = () => {
    if (step + 1 < STEP_COUNT) {
      setStep(step + 1)
      return
    }
    setStep(0)
    setIteration(iteration + 1)
  }

  const back = () => {
    if (step > 0) {
      setStep(step - 1)
      return
    }
    if (iteration > 0) {
      setIteration(iteration - 1)
      setStep(STEP_COUNT - 1)
    }
  }

  const replay = () => {
    setIteration(0)
    setStep(0)
    setAutoRun(false)
  }

  const chooseTechnique = (id) => {
    setTechniqueId(id)
    setIteration(0)
    setStep(0)
  }

  // Auto run drives the same advance the button does, through a ref so the
  // interval never closes over a stale iteration.
  const nextRef = useRef(next)
  useEffect(() => {
    nextRef.current = next
  })

  // Auto run stops when nobody is looking at it.
  useEffect(() => {
    if (!autoRun || !inView) return undefined
    const id = setInterval(() => nextRef.current(), AUTO_MS)
    return () => clearInterval(id)
  }, [autoRun, inView])

  const recovered = recoveredCount(iteration, step)
  const emptyLabel = techniqueId === 'flush-reload' ? 'flushed' : 'evicted'
  const currentStep = technique.steps[step]

  return (
    <figure className="figure" ref={rootRef}>
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">
          Schematic. Cycle counts are representative, not measured.
        </span>
      </header>

      <ViewToggle
        name={name}
        value={techniqueId}
        options={OPTIONS}
        onChange={chooseTechnique}
        legend="Choose a technique"
      />

      <div className="atk">
        <div className="atk__panel">
          <p className="atk__setnote">{technique.setNote}</p>
          <CacheSet lines={state.lines} measured={state.measured} emptyLabel={emptyLabel} />
          <ul className="legend legend--figure">
            <li className="legend__item">
              <span className="legend__swatch legend__swatch--attack" aria-hidden="true" />
              Attacker line
            </li>
            <li className="legend__item">
              <span className="legend__swatch legend__swatch--benign" aria-hidden="true" />
              Victim line
            </li>
          </ul>
        </div>

        <div className="atk__panel">
          <ol className="steps">
            {technique.steps.map((entry, index) => (
              <li
                key={entry.key}
                className={`steps__item${index === step ? ' is-current' : ''}`}
                aria-current={index === step ? 'step' : undefined}
              >
                <span className="steps__num">{index + 1}</span>
                {entry.name}
              </li>
            ))}
          </ol>

          <p className="atk__step-text" aria-live="polite">
            {currentStep.text}
          </p>

          <LatencyMeter meter={technique.meter} value={state.value} />

          <p className={`atk__verdict${state.activity === null ? ' is-pending' : ''}`}>
            {state.activity === null
              ? 'The attacker has not read the measurement yet.'
              : state.activity
                ? `Victim activity. Bit recorded: ${state.bit}.`
                : `No victim activity. Bit recorded: ${state.bit}.`}
          </p>
        </div>
      </div>

      <div className="loopbar">
        <p className="loopbar__count">
          Iteration <strong>{iteration + 1}</strong>
        </p>
        <p className="loopbar__label">
          Recovered private exponent bits, one per iteration:{' '}
          <strong>
            {recovered} of {SECRET_BITS.length}
          </strong>
        </p>
        <div className="bits" aria-hidden="true">
          {SECRET_BITS.map((bit, index) => (
            <span key={index} className={`bits__cell${index < recovered ? ' is-known' : ''}`}>
              {index < recovered ? bit : ''}
            </span>
          ))}
        </div>
        <p className="loopbar__note">
          A real attack runs this loop thousands of times to recover a whole key.
        </p>
      </div>

      <StepControls
        atLastStep={step === STEP_COUNT - 1}
        canGoBack={iteration > 0 || step > 0}
        autoRun={autoRun}
        onNext={next}
        onBack={back}
        onReplay={replay}
        onToggleAuto={() => setAutoRun(!autoRun)}
      />

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}
