import type { ReactNode } from "react"

export default function Pill({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`pill ${className}`}>{children}</div>
}
