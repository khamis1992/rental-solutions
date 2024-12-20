import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined") {
      return
    }

    function checkMobile() {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Initial check
    checkMobile()

    // Add event listener
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return isMobile
}