import { useRef } from 'react'
import { useElementWidth } from '../../../hooks/useElementWidth.js'

const HEIGHT = 92

/** One window, one bar per sample, drawn in whatever order it is handed. */
export function WindowBars({ values, top, tone, settleKey, title }) {
  const boxRef = useRef(null)
  const width = useElementWidth(boxRef, 320)

  const count = values.length
  const slot = width / count
  const barW = Math.max(1.5, slot - 1)

  return (
    <div className="wbars" ref={boxRef}>
      <svg
        className="wbars__svg"
        key={settleKey}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={title}
      >
        {Array.from(values, (value, i) => {
          const h = Math.max(1, (Math.min(value, top) / top) * (HEIGHT - 4))
          return (
            <rect
              key={i}
              x={i * slot + (slot - barW) / 2}
              y={HEIGHT - h}
              width={barW}
              height={h}
              className={`wbars__bar wbars__bar--${tone}`}
            />
          )
        })}
      </svg>
    </div>
  )
}
