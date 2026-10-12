import { useState } from "react"
import { roundEvents, type ChoiceKind, type EventId } from "@/data/events"
import { requireSavedAccount } from "@/lib/account"
import { isRemote } from "@/lib/supabase"
import type { Screen } from "@/lib/screen"
import { useAuth } from "@/state/AuthProvider"

const screens: { id: Screen; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "avatar", label: "Avatar" },
  { id: "setup", label: "Stock" },
  { id: "town", label: "Town" },
  { id: "results", label: "Results" },
  { id: "challenge", label: "Challenge" },
  { id: "leaderboard", label: "Rankings" },
  { id: "upgrade", label: "Shop" },
]

export default function DevJumper({
  onJump,
  onEvent,
  onChoice,
}: {
  onJump: (screen: Screen) => void
  onEvent: (id: EventId) => void
  onChoice: (kind: ChoiceKind) => void
}) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const saved = isRemote() && requireSavedAccount(user)

  return (
    <div className="dev-jumper">
      {open && (
        <div className="dev-menu">
          <span className="dev-save-flag">Saved account: {saved ? "yes" : "no"}</span>
          {roundEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => {
                onEvent(event.id)
                setOpen(false)
              }}
              type="button"
            >
              {event.name}
            </button>
          ))}
          <button
            onClick={() => {
              onChoice("bulk")
              setOpen(false)
            }}
            type="button"
          >
            Bulk card
          </button>
          <button
            onClick={() => {
              onChoice("credit")
              setOpen(false)
            }}
            type="button"
          >
            Credit card
          </button>
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
