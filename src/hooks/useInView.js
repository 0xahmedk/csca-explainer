import { useEffect, useState } from 'react'

/** True while the element is on screen. Used to stop animation nobody is watching. */
export function useInView(ref, threshold = 0.2) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, threshold])

  return inView
}
