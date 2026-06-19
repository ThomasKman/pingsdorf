import { useEffect, useState } from 'react'

/**
 * Reports whether the viewport is at or below the mobile breakpoint.
 * Re-evaluates on window resize.
 */
export function useMobileViewport(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
