import { useEffect, useState } from "react"
import AvatarGroupScreen from "@/screens/AvatarGroupScreen"
import ChallengeScreen from "@/screens/ChallengeScreen"
import HomeScreen from "@/screens/HomeScreen"
import ResultsScreen from "@/screens/ResultsScreen"
import SetupScreen from "@/screens/SetupScreen"
import TownScreen from "@/screens/TownScreen"
import type { Screen } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => readDevScreen() ?? "home")
  const { state, dispatch } = useGame()

  function go(next: Screen) {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    if (!state.showResults) return
    setScreen("results")
    window.scrollTo({ top: 0, behavior: "smooth" })
    dispatch({ type: "acknowledgeResults" })
  }, [state.showResults, dispatch])

  if (screen === "avatar") return <AvatarGroupScreen go={go} />
  if (screen === "setup") return <SetupScreen go={go} />
  if (screen === "town") return <TownScreen go={go} />
  if (screen === "results") return <ResultsScreen go={go} />
  if (screen === "challenge") return <ChallengeScreen go={go} />
  return <HomeScreen go={go} />
}

function readDevScreen(): Screen | null {
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get("dev") !== "1") return null
    const screen = params.get("screen")
    if (
      screen === "home" ||
      screen === "avatar" ||
      screen === "setup" ||
      screen === "town" ||
      screen === "results" ||
      screen === "challenge"
    ) {
      return screen
    }
  } catch {
    return null
  }
  return null
}
