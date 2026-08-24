import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'csca-theme'

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

/**
 * Theme lives on <html data-theme>, resolved before first paint by the inline
 * script in index.html. Components style themselves off that attribute and
 * never read the theme in JS.
 */
export function useTheme() {
  const [theme, setTheme] = useState(currentTheme)

  // Follow the OS while the reader has made no explicit choice.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return
      } catch {
        // Storage unavailable: fall through and follow the OS.
      }
      const next = event.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = next
      setTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((previous) => {
      const next = previous === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Persisting is a nicety; the toggle still works without it.
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
