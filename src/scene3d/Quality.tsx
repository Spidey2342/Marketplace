import { PerformanceMonitor } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { useEffect, type ReactNode } from "react"
import { dropTier, tierDpr, useTier } from "@/scene3d/tier"

export default function Quality({ children }: { children: ReactNode }) {
  const tier = useTier()
  const setDpr = useThree((state) => state.setDpr)
  const setFrameloop = useThree((state) => state.setFrameloop)

  useEffect(() => {
    setDpr(tierDpr())
  }, [setDpr, tier])

  useEffect(() => {
    function onHide() {
      setFrameloop(document.hidden ? "never" : "always")
    }
    document.addEventListener("visibilitychange", onHide)
    onHide()
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      setFrameloop("always")
    }
  }, [setFrameloop])

  return (
    <PerformanceMonitor
      ms={250}
      iterations={8}
      threshold={0.75}
      bounds={() => [40, 58]}
      flipflops={12}
      onDecline={() => dropTier()}
    >
      {children}
    </PerformanceMonitor>
  )
}
