import { useEffect, useState } from "react"
import DevJumper from "@/components/ui/DevJumper"
import { destination } from "@/lib/flow"
import type { Intent, Screen } from "@/lib/screen"
import AvatarGroupScreen from "@/screens/AvatarGroupScreen"
import ChallengeScreen from "@/screens/ChallengeScreen"
import HomeScreen from "@/screens/HomeScreen"
import LeaderboardScreen from "@/screens/LeaderboardScreen"
import ResultsScreen from "@/screens/ResultsScreen"
import SetupScreen from "@/screens/SetupScreen"
import TownScreen from "@/screens/TownScreen"
import UpgradeScreen from "@/screens/UpgradeScreen"
import { useGame } from "@/state/GameProvider"

export default function App() {
  const [history, setHistory] = useState<Screen[]>(() => [
    readDevScreen() ?? "home",
  ])
  const { state, dispatch } = useGame()
  const screen = history[history.length - 1]
  const dev = readDevFlag()

  function go(intent: Intent) {
    setHistory((current) => move(current, intent, state.profileComplete))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function jump(next: Screen) {
    dispatch({ type: "applySample", screen: next })
    setHistory(next === "home" ? ["home"] : ["home", next])
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    if (!state.showResults) return
    setHistory((current) =>
      current[current.length - 1] === "results" ? current : [...current, "results"],
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
    dispatch({ type: "acknowledgeResults" })
  }, [state.showResults, dispatch])

  let view = <HomeScreen go={go} />
  if (screen === "avatar") view = <AvatarGroupScreen go={go} />
  if (screen === "setup") view = <SetupScreen go={go} />
  if (screen === "town") view = <TownScreen go={go} />
  if (screen === "results") view = <ResultsScreen go={go} />
  if (screen === "challenge") view = <ChallengeScreen go={go} />
  if (screen === "leaderboard") view = <LeaderboardScreen go={go} />
  if (screen === "upgrade") view = <UpgradeScreen go={go} />

  return (
    <>
      {view}
      {dev && <DevJumper onJump={jump} />}
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
  if (intent === "upgrade-back" && current[current.length - 2] === "results") {
    return current.slice(0, -1)
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
      screen === "upgrade"
    ) {
      return screen
    }
  } catch {
    return null
  }
  return null
}
