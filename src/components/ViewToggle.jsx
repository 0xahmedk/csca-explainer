/**
 * Two mutually exclusive views. Native radios, so arrow keys work and the
 * grouping is announced without any extra wiring.
 */
export function ViewToggle({ name, value, options, onChange, wrap = false, legend = 'Choose a view' }) {
  return (
    <fieldset className={wrap ? 'seg seg--wrap' : 'seg'}>
      <legend className="visually-hidden">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={`seg__option${value === option.value ? ' is-active' : ''}`}
        >
          <input
            className="visually-hidden"
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  )
}
