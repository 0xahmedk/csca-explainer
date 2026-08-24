import { useId, useMemo, useState } from 'react'
import { AXES, axisFor, axisMax, bestThreshold, modelFit, scoreThreshold } from '../../lib/programs.js'
import { ViewToggle } from '../ViewToggle.jsx'

const MODES = [
  { value: 'hand', label: 'One counter, your cut' },
  { value: 'model', label: 'Four counters, a model' },
]

const DEFAULT_COUNTER = 'misses'

export function ThresholdWidget({ label, caption }) {
  const sliderId = useId()
  const modeName = useId()
  const counterName = useId()

  const [mode, setMode] = useState('hand')
  const [counter, setCounter] = useState(DEFAULT_COUNTER)
  const axis = axisFor(counter)
  const max = useMemo(() => axisMax(counter), [counter])

  // Opens on a cut that looks reasonable, so the first thing shown is a
  // credible attempt rather than an empty control.
  const [thresholds, setThresholds] = useState({})
  const threshold = thresholds[counter] ?? Math.round(max * 0.55)

  const hand = useMemo(() => scoreThreshold(counter, threshold), [counter, threshold])
  const best = useMemo(() => bestThreshold(counter), [counter])
  const model = useMemo(() => modelFit(), [])

  const showingModel = mode === 'model'
  const marks = showingModel ? model.marks : hand.marks
  const position = (mark) =>
    showingModel
      ? ((mark.score - model.min) / (model.max - model.min)) * 100
      : (mark.program[counter] / max) * 100
  const linePosition = showingModel
    ? ((model.boundary - model.min) / (model.max - model.min)) * 100
    : (threshold / max) * 100

  return (
    <figure className="figure tw">
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">Illustrative synthetic data, not measurements</span>
      </header>

      <ViewToggle
        name={modeName}
        value={mode}
        options={MODES}
        onChange={setMode}
        legend="Choose how to separate the programs"
      />

      {!showingModel && (
        <ViewToggle
          name={counterName}
          value={counter}
          options={AXES.map((entry) => ({ value: entry.key, label: entry.label }))}
          onChange={setCounter}
          wrap
          legend="Choose a counter"
        />
      )}

      <div className="tw__rows">
        {marks.map((mark) => (
          <div
            className={`tw__row${mark.wrong ? ' is-wrong' : ''}`}
            key={mark.program.name}
          >
            <span className="tw__name">
              {mark.program.name}
              <span className="tw__kind">{mark.program.kind}</span>
            </span>
            <span className="tw__track">
              <span className="tw__line" style={{ left: `${linePosition}%` }} />
              <span
                className={`tw__dot tw__dot--${mark.program.kind}`}
                style={{ left: `${position(mark)}%` }}
              />
            </span>
            <span className="tw__flag">{mark.wrong ? 'misread' : ''}</span>
          </div>
        ))}
      </div>

      {showingModel ? (
        <div className="tw__readout">
          <p className="tw__score">{model.errors} of 10 misread</p>
          <p className="tw__detail">
            One model reading all four counters together separates every program in the set. The
            combination carries what no single counter does.
          </p>
        </div>
      ) : (
        <>
          <div className="loadctl">
            <label className="loadctl__head" htmlFor={sliderId}>
              <span>
                Flag as attack when {axis.label.toLowerCase()} is{' '}
                {axis.attackSide === 'high' ? 'above' : 'below'} the line
              </span>
              <strong>{Math.round(threshold)}</strong>
            </label>
            <input
              id={sliderId}
              className="loadctl__input"
              type="range"
              min="0"
              max={Math.round(max)}
              step="1"
              value={Math.round(threshold)}
              onChange={(event) =>
                setThresholds({ ...thresholds, [counter]: Number(event.target.value) })
              }
            />
            <div className="loadctl__scale" aria-hidden="true">
              <span>0</span>
              <span>{Math.round(max)}</span>
            </div>
          </div>

          <div className="tw__readout">
            <p className="tw__score">{hand.errors} of 10 misread</p>
            <p className="tw__detail">
              {hand.falseAlarms} ordinary {hand.falseAlarms === 1 ? 'program' : 'programs'} called an
              attack, {hand.missed} real {hand.missed === 1 ? 'attack' : 'attacks'} missed. The best
              any cut on this counter alone can manage is {best.errors}.
            </p>
          </div>
        </>
      )}

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}
