import { useRef, useState } from 'react'
import { WAYS } from '../../../lib/attacks.js'
import { useElementWidth } from '../../../hooks/useElementWidth.js'

// url(#...) references cannot carry the characters useId emits.
let patternSeq = 0

const LABELS = {
  attacker: 'attacker data',
  victim: 'victim data',
  other: 'other data',
}

/**
 * One cache set, eight ways, drawn the same way for both techniques. Occupancy
 * is carried by fill, by hatch pattern and by the row's own label, so the
 * diagram still reads with the colour taken away.
 */
export function CacheSet({ lines, measured, emptyLabel }) {
  const boxRef = useRef(null)
  const width = useElementWidth(boxRef, 420)
  const [ids] = useState(() => {
    patternSeq += 1
    return {
      attacker: `csca-atk-${patternSeq}`,
      victim: `csca-vic-${patternSeq}`,
    }
  })

  const narrow = width < 380
  const rowH = narrow ? 24 : 27
  const gap = 4
  const height = WAYS * (rowH + gap) - gap
  const font = narrow ? 10 : 11

  const idxW = narrow ? 20 : 24
  const latW = measured ? (narrow ? 46 : 54) : 0
  const boxX = idxW + 6
  const boxW = width - boxX - (latW ? latW + 6 : 0)

  return (
    <div className="cset" ref={boxRef}>
      <svg
        className="cset__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={lines
          .map((line, way) => `Way ${way}: ${line.state === 'empty' ? emptyLabel : LABELS[line.state]}`)
          .join('. ')}
      >
        <defs>
          <pattern
            id={ids.attacker}
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="5" className="cset__hatch cset__hatch--attack" />
          </pattern>
          <pattern id={ids.victim} width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.6" cy="1.6" r="1.1" className="cset__dot" />
          </pattern>
        </defs>

        {lines.map((line, way) => {
          const y = way * (rowH + gap)
          const fill =
            line.state === 'attacker'
              ? `url(#${ids.attacker})`
              : line.state === 'victim'
                ? `url(#${ids.victim})`
                : 'none'

          return (
            <g key={way} className={line.muted ? 'cset__row is-muted' : 'cset__row'}>
              <text
                x={idxW}
                y={y + rowH / 2 + font * 0.36}
                textAnchor="end"
                fontSize={font}
                className="cset__index"
              >
                {way}
              </text>

              <rect
                x={boxX}
                y={y}
                width={boxW}
                height={rowH}
                rx="2"
                className={`cset__cell cset__cell--${line.state}${line.shared ? ' is-shared' : ''}`}
                style={{ fill }}
              />

              <text
                x={boxX + 9}
                y={y + rowH / 2 + font * 0.36}
                fontSize={font}
                className="cset__label"
              >
                {line.state === 'empty' ? emptyLabel : LABELS[line.state]}
              </text>

              {line.flagged && (
                <path
                  d={`M${boxX + boxW - 14} ${y + rowH / 2 - 4}L${boxX + boxW - 6} ${y + rowH / 2}L${boxX + boxW - 14} ${y + rowH / 2 + 4}Z`}
                  className="cset__flag"
                />
              )}

              {line.latency !== undefined && (
                <text
                  x={width}
                  y={y + rowH / 2 + font * 0.36}
                  textAnchor="end"
                  fontSize={font}
                  className="cset__latency"
                >
                  {line.latency} c
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
