import { useEffect, useState } from "react"
import DevJumper from "@/components/ui/DevJumper"
import { destination } from "@/lib/flow"
import type { Intent, Screen } from "@/lib/screen"
import AvatarGroupScreen from "@/screens/AvatarGroupScreen"
import ChallengeScreen from "@/screens/ChallengeScreen"
import HomeScreen from "@/screens/HomeScreen"
import LeaderboardScreen from "@/screens/LeaderboardScreen"
import ResultsScreen from "@/screens/ResultsScreen"
import TownScreen from "@/screens/TownScreen"
import PassportScreen from "@/screens/PassportScreen"
import UpgradeScreen from "@/screens/UpgradeScreen"
import { isRemote } from "@/lib/supabase"
import AuthBridge from "@/state/AuthBridge"
import BackendBridge from "@/state/BackendBridge"
import { useGame } from "@/state/GameProvider"

type StallSheet = "stock" | "status" | null

export default function App() {
  const [history, setHistory] = useState<Screen[]>(initialHistory)
  const [sheet, setSheet] = useState<StallSheet>(initialSheet)
  const { state, dispatch } = useGame()
  const screen = history[history.length - 1]
  const dev = readDevFlag()

  function go(intent: Intent) {
    if (intent === "play-again" || intent === "restock") setSheet("stock")
    else if (
      intent === "open-stall" ||
      intent === "play" ||
      intent === "continue" ||
      intent === "upgrade-back" ||
      intent === "reinvest"
    ) {
      setSheet(null)
    }
    setHistory((current) => move(current, intent, state.profileComplete))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function jump(next: Screen) {
    dispatch({ type: "applySample", screen: next })
    if (next === "setup") {
      setHistory(["home", "town"])
      setSheet("stock")
    } else {
      setSheet(null)
      setHistory(next === "home" ? ["home"] : ["home", next])
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    if (!state.showResults) return
    setHistory((current) =>
      current[current.length - 1] === "results" ? current : [...current, "results"],
    )
    setSheet(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
    dispatch({ type: "acknowledgeResults" })
  }, [state.showResults, dispatch])

  let view = <HomeScreen go={go} />
  if (screen === "avatar") view = <AvatarGroupScreen go={go} />
  if (screen === "town") view = <TownScreen go={go} onSheet={setSheet} sheet={sheet} />
  if (screen === "results") view = <ResultsScreen go={go} />
  if (screen === "challenge") view = <ChallengeScreen go={go} />
  if (screen === "leaderboard") view = <LeaderboardScreen go={go} />
  if (screen === "upgrade") view = <UpgradeScreen go={go} />
  if (screen === "passport") view = <PassportScreen go={go} />

  return (
    <>
      <BackendBridge />
      <AuthBridge />
      {!isRemote() && <p className="offline-banner">Saved on this device</p>}
      {view}
      {dev && (
        <DevJumper
          onChoice={(kind) => dispatch({ type: "forceChoice", kind })}
          onEvent={(id) => dispatch({ type: "setEvent", id })}
          onJump={jump}
        />
      )}
    </>
  )
}

function move(
  current: Screen[],
  intent: Intent,
  profileComplete: boolean,
): Screen[] {
  const next = destination(intent, profileComplete)
  if (next === "back") {
    return current.length > 1 ? current.slice(0, -1) : current
  }
  if (
    next === "town" &&
    (intent === "play" ||
      intent === "continue" ||
      intent === "play-again" ||
      intent === "restock" ||
      intent === "upgrade-back" ||
      intent === "open-stall")
  ) {
    const townAt = current.lastIndexOf("town")
    if (townAt >= 0) return current.slice(0, townAt + 1)
    if (intent === "play" || intent === "continue") return [...current, "town"]
    return ["home", "town"]
  }
  if (current[current.length - 1] === next) return current
  return [...current, next]
}

function readDevFlag(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("dev") === "1"
  } catch {
    return false
  }
}

function readDevScreen(): Screen | null {
  if (!readDevFlag()) return null
  try {
    const screen = new URLSearchParams(window.location.search).get("screen")
    if (
      screen === "home" ||
      screen === "avatar" ||
      screen === "setup" ||
      screen === "town" ||
      screen === "results" ||
      screen === "challenge" ||
      screen === "leaderboard" ||
      screen === "upgrade" ||
      screen === "passport"
    ) {
      return screen
    }
  } catch {
    return null
  }
  return null
}

function initialHistory(): Screen[] {
  const screen = readDevScreen()
  if (!screen || screen === "home") return ["home"]
  if (screen === "setup") return ["home", "town"]
  return ["home", screen]
}

function initialSheet(): StallSheet {
  return readDevScreen() === "setup" ? "stock" : null
}
