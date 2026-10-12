import type { ReactNode } from "react"
import MarketBackdrop from "@/components/scene/MarketBackdrop"

export default function AppFrame({
  activeScene,
  showBackdrop = true,
  children,
  className = "",
}: {
  activeScene?: boolean
  showBackdrop?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <main className={`app-frame ${className}`}>
      {showBackdrop && <MarketBackdrop active={activeScene} />}
      <div className="grain" />
      {children}
    </main>
  )
}
