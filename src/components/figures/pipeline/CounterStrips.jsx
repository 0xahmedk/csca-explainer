import { useRef } from 'react'
import { COUNTERS, VIEW_SAMPLES, WINDOW_SAMPLES } from '../../../lib/traces.js'
import { useElementWidth } from '../../../hooks/useElementWidth.js'

const ROW_H = 40

/**
 * The four counters as they arrive, both processes on each strip. Monochrome
 * here, so the attacker is a solid line and the tenant a dashed one, and both
 * are labelled.
 */
export function CounterStrips({ attacker, tenant, windowIndex, windowActive }) {
  const boxRef = useRef(null)
  const width = useElementWidth(boxRef, 480)

  const padLeft = 2
  const plotW = width - padLeft - 2
  const x = (i) => padLeft + (i / (VIEW_SAMPLES - 1)) * plotW
  const bandX = (w) => padLeft + (w / (VIEW_SAMPLES / WINDOW_SAMPLES)) * plotW
  const bandW = plotW / (VIEW_SAMPLES / WINDOW_SAMPLES)

  return (
    <div className="strips" ref={boxRef}>
      {COUNTERS.map((counter) => {
        const a = attacker[counter.key]
        const t = tenant[counter.key]

        let peak = 0
        for (let i = 0; i < a.length; i += 1) {
          if (a[i] > peak) peak = a[i]
          if (t[i] > peak) peak = t[i]
        }
        const top = peak * 1.08 || 1
        const y = (v) => ROW_H - 3 - (v / top) * (ROW_H - 6)

        const toPath = (trace) => {
          let d = ''
          for (let i = 0; i < trace.length; i += 1) {
            d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(trace[i]).toFixed(1)}`
          }
          return d
        }

        return (
          <div className="strips__row" key={counter.key}>
            <p className="strips__label">
              <span>{counter.label}</span>
              <code>{counter.perf}</code>
            </p>
            <svg
              className="strips__svg"
              width={width}
              height={ROW_H}
              viewBox={`0 0 ${width} ${ROW_H}`}
              role="img"
              aria-label={`${counter.label}, attacker and tenant`}
            >
              <rect
                x={bandX(windowIndex)}
                y="0"
                width={bandW}
                height={ROW_H}
                className={windowActive ? 'strips__window is-active' : 'strips__window'}
              />
              <path d={toPath(t)} className="strips__line strips__line--tenant" />
              <path d={toPath(a)} className="strips__line strips__line--attacker" />
            </svg>
          </div>
        )
      })}
    </div>
  )
}
