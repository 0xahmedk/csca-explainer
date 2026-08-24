import { ThemeToggle } from './ThemeToggle.jsx'

export function ProgressNav({ sections, activeId, progress, onToggleTheme }) {
  const active = sections.find((section) => section.id === activeId) ?? sections[0]

  return (
    <nav className="nav" aria-label="Sections">
      <p className="nav__current" aria-hidden="true">
        {sections.indexOf(active) + 1}. {active.navLabel}
      </p>

      <ol className="nav__ticks">
        {sections.map((section, index) => (
          <li key={section.id} className="nav__tick-item">
            <a
              className="nav__tick"
              href={`#${section.id}`}
              aria-current={section.id === activeId ? 'true' : undefined}
            >
              <span className="visually-hidden">
                {index + 1}. {section.navLabel}
              </span>
            </a>
          </li>
        ))}
      </ol>

      <ThemeToggle onToggle={onToggleTheme} />

      <div
        className="nav__progress"
        style={{ '--progress': progress }}
        aria-hidden="true"
      />
    </nav>
  )
}
