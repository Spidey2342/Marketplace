import { useEffect, useRef, useState } from "react"
import type { Go } from "@/lib/screen"
import { challengeProgress, useGame } from "@/state/GameProvider"

export default function TownMenu({ go }: { go: Go }) {
  const { state } = useGame()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const waiting = challengeProgress(state).some((step) => !step.done)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (root.current?.contains(target)) return
      setOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown)
    return () => window.removeEventListener("pointerdown", onPointerDown)
  }, [open])

  function pick(intent: "challenge" | "rankings" | "avatar") {
    setOpen(false)
    go(intent)
  }

  return (
    <div className="town-menu" ref={root}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="town-menu-button"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        Menu
        {waiting && <i className="menu-dot" />}
      </button>
      {open && (
        <div className="town-menu-pop" role="menu">
          <button onClick={() => pick("challenge")} role="menuitem" type="button">
            Weekly challenge
          </button>
          <button onClick={() => pick("rankings")} role="menuitem" type="button">
            Rankings
          </button>
          <button onClick={() => pick("avatar")} role="menuitem" type="button">
            Profile
          </button>
        </div>
      )}
    </div>
  )
}
