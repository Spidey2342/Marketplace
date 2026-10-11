import type { ReactNode } from "react"
import Icon, { type IconName } from "@/components/ui/Icon"

export default function Button({
  children,
  className = "",
  icon,
  onClick,
  type = "button",
}: {
  children: ReactNode
  className?: string
  icon?: IconName
  onClick?: () => void
  type?: "button" | "submit"
}) {
  return (
    <button className={`button ${className}`} onClick={onClick} type={type}>
      <span>{children}</span>
      {icon && <Icon name={icon} size={22} />}
    </button>
  )
}
