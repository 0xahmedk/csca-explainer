import { useId, useState } from 'react'
import { ServerStack } from './iso/ServerStack.jsx'
import { ViewToggle } from '../ViewToggle.jsx'

const VIEWS = [
  { value: 'controls', label: 'What the controls see' },
  { value: 'shared', label: 'What is physically shared' },
]

const NOTES = {
  controls: {
    icon: <LockIcon />,
    text: 'Separate virtual machines, separate operating systems, separate memory, a hypervisor between them, firewalls around them. Every boundary holds, and the separation is modelled as going all the way down.',
  },
  shared: {
    icon: <ChipIcon />,
    text: 'It does not go all the way down. One physical last level cache sits below the hypervisor, outside what any of those controls describe, and both tenants reach it on every memory access.',
  },
}

export function IsolationFigure({ label, caption }) {
  const [view, setView] = useState('controls')
  const name = useId()
  const note = NOTES[view]

  return (
    <figure className="figure">
      <header className="figure__head">
        <span className="figure__label">{label}</span>
        <span className="figure__disclaimer">Schematic, not to scale</span>
      </header>

      <div className="iso">
        <ServerStack view={view} />
        <p className="iso__note" aria-live="polite">
          <span className="iso__icon" aria-hidden="true">
            {note.icon}
          </span>
          {note.text}
        </p>
      </div>

      <ViewToggle
        name={name}
        value={view}
        options={VIEWS}
        onChange={setView}
        legend="Choose a view of the server"
      />

      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="10.5" width="16" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.75 10.5V7a4.25 4.25 0 0 1 8.5 0v3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 2.75V5M15 2.75V5M9 19v2.25M15 19v2.25M2.75 9H5M2.75 15H5M19 9h2.25M19 15h2.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
