import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import MarketBackdrop from "@/components/scene/MarketBackdrop"
import MiniMap from "@/components/scene/MiniMap"
import Icon from "@/components/ui/Icon"
import Joystick from "@/components/ui/Joystick"
import Pill from "@/components/ui/Pill"
import { chatPhrases } from "@/data/chat"
import { emotes } from "@/data/emotes"
import { eventById, type RoundEvent } from "@/data/events"
import ChoiceCard from "@/components/ui/ChoiceCard"
import CoachMarks from "@/components/ui/CoachMarks"
import { BUBBLE_MS, formatClock, URGENT_TIMER_SECONDS } from "@/lib/economy"
import type { Go } from "@/lib/screen"
import SaleToasts from "@/components/ui/SaleToasts"
import SetupScreen from "@/screens/SetupScreen"
import StallStatus from "@/components/ui/StallStatus"
import TownMenu from "@/components/ui/TownMenu"
import VisitSheet from "@/components/ui/VisitSheet"
import { closeVisit, usePresence } from "@/scene3d/presence"
import { sendChat, sendEmote } from "@/scene3d/TownLink"
import TownLink from "@/scene3d/TownLink"
import { blockPlayer } from "@/scene3d/townLive"
import { sendReport } from "@/lib/sync"
import { isDev, setTier, useTier } from "@/scene3d/tier"
import { requestGlideHome } from "@/state/input"
import { useGame } from "@/state/GameProvider"

const TownCanvas = lazy(() => import("@/scene3d/TownCanvas"))

function effectLine(event: RoundEvent) {
  const dot = event.effect.indexOf(". ")
  const detail = dot >= 0 ? event.effect.slice(dot + 2) : event.effect
  const sentence = `${detail.charAt(0).toLowerCase()}${detail.slice(1)}`
  return `${event.name}: ${sentence}`
}

let lastReportAt = 0

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    if (!gl) return false
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return true
  } catch {
    return false
  }
}

export default function TownScreen({
  go,
  sheet,
  onSheet,
}: {
  go: Go
  sheet: "stock" | "status" | null
  onSheet: (sheet: "stock" | "status" | null) => void
}) {
  const { state, dispatch } = useGame()
  const [now, setNow] = useState(() => Date.now())
  const [chatOpen, setChatOpen] = useState(false)
  const [eventOpen, setEventOpen] = useState(false)
  const [emotesOpen, setEmotesOpen] = useState(false)
  const emoteButtonRef = useRef<HTMLButtonElement>(null)
  const emoteWheelRef = useRef<HTMLDivElement>(null)
  const [canvasFailed, setCanvasFailed] = useState(false)
  const [webgl] = useState(webglAvailable)
  const [devTools] = useState(isDev)
  const tier = useTier()
  const { visit } = usePresence()
  const onFail = useCallback(() => setCanvasFailed(true), [])
  const openItems = state.stall.filter((line) => line.selected).length
  const showSale =
    state.roundStatus === "running" &&
    state.lastSale !== null &&
    (!webgl || canvasFailed || state.saleRevealId === state.lastSale.id)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (state.speech) sendChat(state.speech)
  }, [state.speech])

  useEffect(() => {
    if (state.emote) sendEmote(state.emote)
  }, [state.emote])

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
  const eventInfo = eventById(state.roundEvent)
  const stallName = state.avatarName.trim()
    ? `${state.avatarName.trim().toUpperCase()}'S STALL`
    : "MY STALL"

  return (
    <AppFrame className="town-screen" showBackdrop={false}>
      {webgl && !canvasFailed ? (
        <Suspense fallback={<MarketBackdrop active />}>
          <TownLink
            me={{
              nickname: state.avatarName,
              hairId: state.hairId,
              outfitId: state.outfitId,
              shoeId: state.shoeId,
              groupId: state.groupId,
              stage: state.stageId,
              friendsRoom: state.friendsRoom,
            }}
          />
          <TownCanvas event={state.roundEvent} onFail={onFail} />
        </Suspense>
      ) : (
        <MarketBackdrop active />
      )}
      <header className="town-hud">
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
              {state.roundStatus === "running"
                ? `Open · ${openItems} item${openItems === 1 ? "" : "s"}`
                : "Market opens soon"}
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
        <div className="timer-row">
          {state.roundStatus === "running" && (
            <div className={`timer-card ${remaining <= URGENT_TIMER_SECONDS ? "urgent" : ""}`}>
              <Icon name="clock" size={16} />
              <div>
                <span>MARKET CLOSES IN</span>
                <strong>{time}</strong>
              </div>
            </div>
          )}
          <button
            aria-expanded={eventOpen}
            className={`event-chip is-${state.roundEvent}`}
            onClick={() => setEventOpen((open) => !open)}
            type="button"
          >
            <span />
            {eventInfo.chip}
          </button>
        </div>
        <MiniMap />
        {eventOpen && <p className="event-note">{effectLine(eventInfo)}</p>}
      </header>

      {state.choiceOpen && state.choiceKind && state.bulkProductId !== null && (
        <ChoiceCard
          coins={state.coins}
          kind={state.choiceKind}
          onSkip={() => dispatch({ type: "resolveChoice", take: false, now })}
          onTake={() => dispatch({ type: "resolveChoice", take: true, now })}
          productId={state.bulkProductId}
          secondsLeft={
            state.choiceDeadline
              ? Math.max(0, Math.ceil((state.choiceDeadline - now) / 1000))
              : 0
          }
        />
      )}

      <SaleToasts sale={showSale ? state.lastSale : null} />

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

      {state.roundStatus !== "running" && sheet === null && (
        <section className="market-open">
          <p>Market opens soon. Stock your stall.</p>
          <button onClick={() => onSheet("stock")} type="button">
            OPEN MARKET
          </button>
        </section>
      )}

      {!state.coachSeen && state.roundStatus !== "running" && sheet === null && (
        <CoachMarks onDone={() => dispatch({ type: "dismissCoach" })} />
      )}

      {sheet === "stock" && state.roundStatus !== "running" && (
        <SetupScreen onClose={() => onSheet(null)} />
      )}
      {(sheet === "status" || (sheet === "stock" && state.roundStatus === "running")) && (
        <StallStatus onClose={() => onSheet(null)} />
      )}

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
          onClick={() => {
            if (webgl && !canvasFailed) requestGlideHome()
            onSheet(state.roundStatus === "running" ? "status" : "stock")
          }}
          type="button"
        >
          <Icon name="market" size={24} />
          <span>My stall</span>
        </button>
      </div>

      {devTools && (
        <div className="quality-bar">
          {(["low", "medium", "high"] as const).map((level) => (
            <button
              aria-pressed={tier === level}
              key={level}
              onClick={() => setTier(level, true)}
              type="button"
            >
              {level}
            </button>
          ))}
        </div>
      )}

      {visit && (
        <VisitSheet
          onClose={() => closeVisit()}
          onReport={
            visit.profileId
              ? () => {
                  const now = performance.now()
                  if (now - lastReportAt < 10000) return
                  lastReportAt = now
                  const target = visit.profileId
                  if (!target) return
                  blockPlayer(target)
                  void sendReport(target, "Reported from their stall")
                  closeVisit()
                }
              : undefined
          }
          visit={visit}
        />
      )}

      <TownMenu go={go} />
    </AppFrame>
  )
}
