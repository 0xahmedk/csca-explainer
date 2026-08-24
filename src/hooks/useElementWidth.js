import { useEffect, useState } from 'react'

/**
 * Measured width of an element, so hand-built SVG can be drawn in real pixels.
 * Scaling a fixed viewBox would shrink axis labels on a phone until they are
 * unreadable; drawing to the measured size keeps type at its intended size.
 */
export function useElementWidth(ref, fallback = 640) {
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const measure = () => setWidth(Math.max(260, Math.round(element.clientWidth)))
    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}
