import { useRef } from 'react'
import { VIEW_SAMPLES, WINDOWS_PER_VIEW } from '../../../lib/traces.js'
import { useElementWidth } from '../../../hooks/useElementWidth.js'

const Y_MAX = 160
const PAD = { left: 34, right: 8, top: 12, bottom: 22 }

/**
 * Part 1, the raw counter traces. Attacker and tenant differ by colour and by
 * line style, so the pair survives a greyscale printout.
 */
export function TraceChart({ attacker, tenant, alarms, decidedThrough, currentWindow }) {
  const boxRef = useRef(null)
  const width = useElementWidth(boxRef, 560)
  const height = width < 420 ? 168 : 200

  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom

  const x = (i) => PAD.left + (i / (VIEW_SAMPLES - 1)) * plotW
  const y = (v) => PAD.top + plotH - (Math.min(v, Y_MAX) / Y_MAX) * plotH
  const bandX = (w) => PAD.left + (w / WINDOWS_PER_VIEW) * plotW
  const bandW = plotW / WINDOWS_PER_VIEW

  const toPath = (trace) => {
    let d = ''
    for (let i = 0; i < trace.length; i += 1) {
      d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(trace[i]).toFixed(1)}`
    }
    return d
  }

  const flagged = []
  for (let w = 0; w <= decidedThrough && w < WINDOWS_PER_VIEW; w += 1) {
    if (alarms[w]) flagged.push(w)
  }

  return (
    <div className="trace" ref={boxRef}>
      <svg
        className="trace__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          `Two counter traces over ${VIEW_SAMPLES} samples. ` +
          `${flagged.length} of the tenant's ${decidedThrough + 1} decided windows were flagged as an attack.`
        }
      >
        {/* window boundaries */}
        {Array.from({ length: WINDOWS_PER_VIEW + 1 }, (_, w) => (
          <line
            key={`grid-${w}`}
            x1={bandX(w)}
            x2={bandX(w)}
            y1={PAD.top}
            y2={PAD.top + plotH}
            className="trace__grid"
          />
        ))}

        {/* false accusations, kept on screen as they accumulate */}
        {flagged.map((w) => (
          <g key={`flag-${w}`}>
            <rect
              x={bandX(w)}
              y={PAD.top}
              width={bandW}
              height={plotH}
              className="trace__flag-band"
            />
            <path
              d={`M${bandX(w) + bandW / 2 - 4} ${PAD.top + 1}L${bandX(w) + bandW / 2 + 4} ${PAD.top + 1}L${bandX(w) + bandW / 2} ${PAD.top + 8}Z`}
              className="trace__flag-mark"
            />
          </g>
        ))}

        {/* the window being collapsed right now */}
        <rect
          x={bandX(currentWindow)}
          y={PAD.top}
          width={bandW}
          height={plotH}
          className="trace__cursor"
        />

        {/* axes */}
        {[0, 80, 160].map((v) => (
          <g key={`tick-${v}`}>
            <line
              x1={PAD.left}
              x2={PAD.left + plotW}
              y1={y(v)}
              y2={y(v)}
              className="trace__axis-line"
            />
            <text x={PAD.left - 6} y={y(v) + 3.5} className="trace__tick" textAnchor="end">
              {v}
            </text>
          </g>
        ))}
        <text x={PAD.left} y={height - 6} className="trace__tick">
          0
        </text>
        <text x={PAD.left + plotW} y={height - 6} className="trace__tick" textAnchor="end">
          12.8 ms
        </text>

        <path d={toPath(tenant)} className="trace__line trace__line--benign" />
        <path d={toPath(attacker)} className="trace__line trace__line--attack" />
      </svg>
    </div>
  )
}
