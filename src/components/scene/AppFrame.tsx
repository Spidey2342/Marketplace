import type { ReactNode } from "react"
import MarketBackdrop from "@/components/scene/MarketBackdrop"

export default function AppFrame({
  activeScene,
  children,
  className = "",
}: {
  activeScene?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <main className={`app-frame ${className}`}>
      <MarketBackdrop active={activeScene} />
      <div className="grain" />
      {children}
    </main>
  )
}
