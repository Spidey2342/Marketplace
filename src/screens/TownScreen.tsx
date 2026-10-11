import { useEffect, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import MiniMap from "@/components/scene/MiniMap"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import {
  formatClock,
  URGENT_TIMER_SECONDS,
} from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

export default function TownScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const [now, setNow] = useState(() => Date.now())
  const [chatOpen, setChatOpen] = useState(false)
  const [emotesOpen, setEmotesOpen] = useState(false)
  const openItems = state.stall.filter((line) => line.selected).length

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const remaining =
    state.roundStatus === "running" && state.roundEndsAt
      ? Math.max(0, Math.ceil((state.roundEndsAt - now) / 1000))
      : 0
  const time = formatClock(remaining)
  const stallName = `${(state.avatarName || "My").toUpperCase()}'S STALL`

  return (
    <AppFrame activeScene className="town-screen">
      <div className="town-top">
        <div className="player-status">
          <div className="mini-avatar">
            <span />
          </div>
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
            {[
              "Fresh stock here!",
              "Good price!",
              "Come to my stall",
              "Nice one!",
            ].map((phrase) => (
              <button
                key={phrase}
                onClick={() => setChatOpen(false)}
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
        <div className="emote-wheel">
          {["AY", "ƆY", "10", "OK"].map((emote) => (
            <button
              key={emote}
              onClick={() => setEmotesOpen(false)}
              type="button"
            >
              {emote}
            </button>
          ))}
        </div>
      )}

      <button
        aria-label="Move avatar"
        className="virtual-joystick"
        type="button"
      >
        <span className="joystick-direction joystick-up" />
        <span className="joystick-direction joystick-right" />
        <span className="joystick-direction joystick-down" />
        <span className="joystick-direction joystick-left" />
        <span className="joystick-knob" />
      </button>

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
          type="button"
        >
          <Icon name="star" size={27} />
          <span>Emote</span>
        </button>
        <button
          className="control-button"
          onClick={() => go("setup")}
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
        <button
          className="finish-demo"
          onClick={() => dispatch({ type: "endRound", now: Date.now() })}
          type="button"
        >
          Finish round
        </button>
      </div>
    </AppFrame>
  )
}
