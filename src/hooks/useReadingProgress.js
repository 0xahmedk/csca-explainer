import { useEffect, useRef, useState } from 'react'

/**
 * Tracks which section the reader is in and how far through the document they
 * are. Scroll work is coalesced into one rAF per frame.
 */
export function useReadingProgress(ids) {
  const [activeId, setActiveId] = useState(ids[0])
  const [progress, setProgress] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const measure = () => {
      frame.current = 0

      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0)

      // The section whose top has most recently passed the reading line.
      const line = window.innerHeight * 0.35
      let current = ids[0]
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= line) current = id
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (frame.current) return
      frame.current = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return { activeId, progress }
}
