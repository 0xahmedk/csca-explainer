/**
 * Part 3, the verdict and the running count of accusations against a tenant
 * that has done nothing wrong.
 */
export function VerdictPanel({ attackerVerdict, tenantVerdict, falseAlarmRate, recall, log }) {
  const flaggedInLog = log.filter(Boolean).length

  return (
    <div className="verdict">
      <ul className="verdict__rows">
        <li className="verdict__row">
          <span className="verdict__who">Probe loop</span>
          <span className="badge badge--attack">{attackerVerdict ? 'attack' : 'benign'}</span>
        </li>
        <li className="verdict__row">
          <span className="verdict__who">Video service</span>
          {tenantVerdict ? (
            <span className="badge badge--attack">attack, false alarm</span>
          ) : (
            <span className="badge">benign</span>
          )}
        </li>
      </ul>

      <div className="verdict__readout">
        <p className="verdict__number">{Math.round(falseAlarmRate * 100)}%</p>
        <p className="verdict__caption">
          of the tenant’s windows are accused, across a 320-window sample at this load.
        </p>
      </div>

      <div className="ribbon" aria-hidden="true">
        {log.map((flag, index) => (
          <span key={index} className={`ribbon__cell${flag ? ' is-flagged' : ''}`} />
        ))}
      </div>
      <p className="verdict__log">
        {flaggedInLog} of the last {log.length} windows flagged
      </p>

      <p className="verdict__note">
        The probe loop is still caught {Math.round(recall * 100)}% of the time. The detector has
        not stopped working. It has stopped being usable.
      </p>
    </div>
  )
}
