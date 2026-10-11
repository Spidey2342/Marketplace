import { useEffect, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import MiniMap from "@/components/scene/MiniMap"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import type { Go } from "@/lib/screen"

export default function TownScreen({ go }: { go: Go }) {
  const [seconds, setSeconds] = useState(294)
  const [chatOpen, setChatOpen] = useState(false)
  const [emotesOpen, setEmotesOpen] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 294))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <AppFrame activeScene className="town-screen">
      <div className="town-top">
        <div className="player-status">
          <div className="mini-avatar">
            <span />
          </div>
          <div>
            <span>KOFI&apos;S STALL</span>
            <strong>Open · 3 items</strong>
          </div>
        </div>
        <Pill className="coin-pill town-coins">
          <Icon name="coin" size={20} />
          116
          <span className="coin-gain">+16</span>
        </Pill>
      </div>

      <div className={`timer-card ${seconds < 30 ? "urgent" : ""}`}>
        <Icon name="clock" size={19} />
        <div>
          <span>MARKET CLOSES IN</span>
          <strong>{time}</strong>
        </div>
      </div>

      <MiniMap />

      <div className="sale-toast">
        <div className="toast-face" />
        <p>
          <strong>Akos bought Sobolo!</strong>
          <span>“Chale, refreshing!”</span>
        </p>
        <b>+¢5</b>
      </div>

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
          onClick={() => go("results")}
          type="button"
        >
          Finish round
        </button>
      </div>
    </AppFrame>
  )
}
