import { loadLabel } from '../../../lib/traces.js'

/** The figure's only control. Native range input, so keyboard support is free. */
export function LoadSlider({ id, load, onChange }) {
  return (
    <div className="loadctl">
      <label className="loadctl__head" htmlFor={id}>
        <span>System load</span>
        <strong>{loadLabel(load)}</strong>
      </label>
      <input
        id={id}
        className="loadctl__input"
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(load * 100)}
        aria-valuetext={`${loadLabel(load)}, ${Math.round(load * 100)} percent`}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <div className="loadctl__scale" aria-hidden="true">
        <span>idle</span>
        <span>heavy</span>
      </div>
    </div>
  )
}
