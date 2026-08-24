/**
 * Primary action gets its own full-width row, so the thing a reader presses
 * most is always the easiest target on a phone.
 */
export function StepControls({ atLastStep, canGoBack, autoRun, onNext, onBack, onReplay, onToggleAuto }) {
  return (
    <div className="stepctl">
      <button type="button" className="btn btn--primary" onClick={onNext}>
        {atLastStep ? 'Next iteration' : 'Next step'}
      </button>
      <div className="stepctl__row">
        <button type="button" className="btn" onClick={onBack} disabled={!canGoBack}>
          Back
        </button>
        <button type="button" className="btn" onClick={onReplay}>
          Replay
        </button>
        <button
          type="button"
          className={`btn${autoRun ? ' is-on' : ''}`}
          aria-pressed={autoRun}
          onClick={onToggleAuto}
        >
          {autoRun ? 'Pause' : 'Auto run'}
        </button>
      </div>
    </div>
  )
}
