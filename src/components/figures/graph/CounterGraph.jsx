import { useRef } from 'react'
import { EDGE_THRESHOLD, NODE_COUNT, edgesToDraw } from '../../../lib/graph.js'
import { useElementWidth } from '../../../hooks/useElementWidth.js'

/**
 * Fourteen counters on a ring. Nodes carry their rank number rather than a
 * label, because fourteen names will not fit around a circle on a phone. The
 * numbered key sits under the figure.
 */
export function CounterGraph({ kind, windowIndex, title }) {
  const boxRef = useRef(null)
  const width = useElementWidth(boxRef, 300)
  const size = Math.min(width, 300)
  const centre = size / 2
  const radius = centre - 20

  const points = Array.from({ length: NODE_COUNT }, (_, i) => {
    const angle = (i / NODE_COUNT) * 2 * Math.PI - Math.PI / 2
    return { x: centre + radius * Math.cos(angle), y: centre + radius * Math.sin(angle) }
  })

  const edges = edgesToDraw(kind, windowIndex)

  return (
    <div className="cgraph" ref={boxRef}>
      <svg
        className="cgraph__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${title}. ${edges.length} counter pairs coupled in this window.`}
      >
        {edges.map((edge) => {
          const strength = (edge.weight - EDGE_THRESHOLD) / (1 - EDGE_THRESHOLD)
          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={points[edge.from].x}
              y1={points[edge.from].y}
              x2={points[edge.to].x}
              y2={points[edge.to].y}
              className="cgraph__edge"
              style={{
                strokeOpacity: (0.15 + strength * 0.75).toFixed(2),
                strokeWidth: (0.6 + strength * 1.6).toFixed(2),
              }}
            />
          )
        })}

        {points.map((point, i) => (
          <g key={i}>
            <circle cx={point.x} cy={point.y} r="8.5" className="cgraph__node" />
            <text x={point.x} y={point.y + 3} textAnchor="middle" className="cgraph__num">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <p className="cgraph__count">
        {edges.length} coupled {edges.length === 1 ? 'pair' : 'pairs'} in this window
      </p>
    </div>
  )
}
