import { useState } from "react"
import type { Screen } from "@/lib/screen"

const screens: { id: Screen; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "avatar", label: "Avatar" },
  { id: "setup", label: "Stall" },
  { id: "town", label: "Town" },
  { id: "results", label: "Results" },
  { id: "challenge", label: "Challenge" },
  { id: "leaderboard", label: "Rankings" },
  { id: "upgrade", label: "Shop" },
]

export default function DevJumper({
  onJump,
}: {
  onJump: (screen: Screen) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="dev-jumper">
      {open && (
        <div className="dev-menu">
          {screens.map((screen) => (
            <button
              key={screen.id}
              onClick={() => {
                onJump(screen.id)
                setOpen(false)
              }}
              type="button"
            >
              {screen.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((current) => !current)} type="button">
        DEV
      </button>
    </div>
  )
}
