/**
 * Outbound link with a visible indicator, so a reader knows before clicking
 * that it leaves the page.
 */
export function ExternalLink({ href, children, className }) {
  return (
    <a
      className={className ? `xlink ${className}` : 'xlink'}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
      <svg className="xlink__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 5.75h9.25V15M18 6 6.25 17.75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="visually-hidden">, opens in a new tab</span>
    </a>
  )
}
