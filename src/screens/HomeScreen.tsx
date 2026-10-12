import { useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import Brand from "@/components/scene/Brand"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

export default function HomeScreen({ go }: { go: Go }) {
  const { dispatch } = useGame()
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)

  function playTown() {
    dispatch({ type: "setFriendsRoom", code: null })
    go("play")
  }

  function joinRoom() {
    const room = code.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(room)) {
      setError(true)
      return
    }
    dispatch({ type: "setFriendsRoom", code: room })
    go("play")
  }

  return (
    <AppFrame className="home-screen">
      <div className="top-safe">
        <Pill className="online-pill">
          <span className="live-dot" />
          248 hustlers online
        </Pill>
      </div>
      <Brand />
      <section className="join-panel">
        {!joining ? (
          <>
            <Button
              className="button-primary button-play"
              icon="arrow"
              onClick={playTown}
            >
              PLAY NOW
            </Button>
            <Button className="button-light" onClick={() => setJoining(true)}>
              JOIN WITH CODE
            </Button>
            <button
              className="text-button"
              onClick={playTown}
              type="button"
            >
              Continue as guest
            </button>
          </>
        ) : (
          <form
            className="join-form"
            onSubmit={(event) => {
              event.preventDefault()
              joinRoom()
            }}
          >
            <label htmlFor="room-code">
              Enter your friend&apos;s room code
            </label>
            <div className={`code-field ${error ? "has-error" : ""}`}>
              <input
                autoFocus
                id="room-code"
                maxLength={6}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase())
                  setError(false)
                }}
                placeholder="E.G. ACCRA7"
                value={code}
              />
              <button
                aria-label="Close join form"
                onClick={() => setJoining(false)}
                type="button"
              >
                <Icon name="x" />
              </button>
            </div>
            {error && (
              <p className="field-error">
                Room codes are 6 characters.
              </p>
            )}
            <Button className="button-primary" icon="arrow" type="submit">
              JOIN ROOM
            </Button>
          </form>
        )}
        <div className="privacy-note">
          <Icon name="shield" size={17} />
          <span>Safe play · No exact location shared</span>
        </div>
      </section>
    </AppFrame>
  )
}
