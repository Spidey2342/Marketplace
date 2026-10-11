import { useEffect, useRef, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import MiniMap from "@/components/scene/MiniMap"
import Icon from "@/components/ui/Icon"
import Joystick from "@/components/ui/Joystick"
import Pill from "@/components/ui/Pill"
import { chatPhrases } from "@/data/chat"
import { emotes } from "@/data/emotes"
import { BUBBLE_MS, formatClock, URGENT_TIMER_SECONDS } from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

export default function TownScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const [now, setNow] = useState(() => Date.now())
  const [chatOpen, setChatOpen] = useState(false)
  const [emotesOpen, setEmotesOpen] = useState(false)
  const emoteButtonRef = useRef<HTMLButtonElement>(null)
  const emoteWheelRef = useRef<HTMLDivElement>(null)
  const openItems = state.stall.filter((line) => line.selected).length
  const activeEmote = emotes.find((emote) => emote.label === state.emote)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!state.speech && !state.emote) return
    const timer = window.setTimeout(() => {
      dispatch({ type: "clearBubble" })
    }, BUBBLE_MS)
    return () => window.clearTimeout(timer)
  }, [state.speech, state.emote, dispatch])

  useEffect(() => {
    if (!emotesOpen) return
    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (emoteWheelRef.current?.contains(target)) return
      if (emoteButtonRef.current?.contains(target)) return
      setEmotesOpen(false)
    }
    window.addEventListener("pointerdown", onPointerDown)
    return () => window.removeEventListener("pointerdown", onPointerDown)
  }, [emotesOpen])

  const remaining =
    state.roundStatus === "running" && state.roundEndsAt
      ? Math.max(0, Math.ceil((state.roundEndsAt - now) / 1000))
      : 0
  const time = formatClock(remaining)
  const stallName = state.avatarName.trim()
    ? `${state.avatarName.trim().toUpperCase()}'S STALL`
    : "MY STALL"

  return (
    <AppFrame activeScene className="town-screen">
      <div className="town-top">
        <div className="player-status">
          <button
            aria-label="Edit your look"
            className="mini-avatar"
            onClick={() => go("avatar")}
            type="button"
          >
            <span />
          </button>
          <div>
            <span>{stallName}</span>
            <strong>
              Open · {openItems} item{openItems === 1 ? "" : "s"}
            </strong>
          </div>
        </div>
        <Pill className="coin-pill town-coins">
          <Icon name="coin" size={20} />
          {state.coins}
          {state.roundRevenue > 0 && (
            <span className="coin-gain">+{state.roundRevenue}</span>
          )}
        </Pill>
      </div>

      <div className={`timer-card ${remaining <= URGENT_TIMER_SECONDS ? "urgent" : ""}`}>
        <Icon name="clock" size={19} />
        <div>
          <span>MARKET CLOSES IN</span>
          <strong>{time}</strong>
        </div>
      </div>

      <MiniMap />

      {(state.speech || activeEmote) && (
        <div className="player-bubble">
          {activeEmote && <Icon name={activeEmote.icon} size={20} />}
          <span>{state.speech ?? activeEmote?.label}</span>
        </div>
      )}

      {state.roundStatus === "running" && state.lastSale && (
        <div className="sale-toast" key={state.lastSale.id}>
          <div className="toast-face" />
          <p>
            <strong>
              {state.lastSale.buyer} bought {state.lastSale.productName}!
            </strong>
            <span>“{state.lastSale.line}”</span>
          </p>
          <b>+¢{state.lastSale.price}</b>
        </div>
      )}

      {chatOpen && (
        <div className="chat-sheet">
          <div className="sheet-handle" />
          <div className="sheet-title">
            <h2>QUICK CHAT</h2>
            <button
              aria-label="Close chat"
              onClick={() => setChatOpen(false)}
              type="button"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="phrase-grid">
            {chatPhrases.map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  dispatch({ type: "setSpeech", text: phrase })
                  setChatOpen(false)
                }}
                type="button"
              >
                {phrase}
              </button>
            ))}
          </div>
          <div className="safety-line">
            <Icon name="shield" size={17} />
            Preset chat keeps the market safe.
          </div>
        </div>
      )}

      {emotesOpen && (
        <div className="emote-wheel" ref={emoteWheelRef}>
          {emotes.map((emote) => (
            <button
              key={emote.id}
              onClick={() => {
                dispatch({ type: "setEmote", label: emote.label })
                setEmotesOpen(false)
              }}
              type="button"
            >
              <Icon name={emote.icon} size={20} />
              {emote.label}
            </button>
          ))}
        </div>
      )}

      <Joystick />

      <div className="town-controls">
        <button
          className="control-button"
          onClick={() => setChatOpen(true)}
          type="button"
        >
          <Icon name="chat" size={24} />
          <span>Chat</span>
        </button>
        <button
          className="control-button emote-button"
          onClick={() => setEmotesOpen((current) => !current)}
          ref={emoteButtonRef}
          type="button"
        >
          <Icon name="star" size={27} />
          <span>Emote</span>
        </button>
        <button
          className="control-button"
          onClick={() => go("restock")}
          type="button"
        >
          <Icon name="market" size={24} />
          <span>My stall</span>
        </button>
      </div>

      <div className="town-quests">
        <button onClick={() => go("challenge")} type="button">
          <Icon name="spark" size={20} />
          <span>Weekly challenge</span>
          <Icon name="arrow" size={18} />
        </button>
        <button onClick={() => go("rankings")} type="button">
          <Icon name="group" size={20} />
          <span>Rankings</span>
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </AppFrame>
  )
}
