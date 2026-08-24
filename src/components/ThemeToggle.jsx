/**
 * Both icons are always in the DOM; CSS picks which one shows from
 * <html data-theme>, so no component branches on the theme in JS.
 */
export function ThemeToggle({ onToggle }) {
  return (
    <button type="button" className="nav__toggle" onClick={onToggle}>
      <span className="visually-hidden">Switch between light and dark</span>
      <svg className="icon-light" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.75 4.75l1.8 1.8M17.45 17.45l1.8 1.8M19.25 4.75l-1.8 1.8M6.55 17.45l-1.8 1.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <svg className="icon-dark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20.5 14.4A8.75 8.75 0 0 1 9.6 3.5a8.75 8.75 0 1 0 10.9 10.9Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
