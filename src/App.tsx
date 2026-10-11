import { useState } from "react"
import ChallengeScreen from "@/screens/ChallengeScreen"
import HomeScreen from "@/screens/HomeScreen"
import ResultsScreen from "@/screens/ResultsScreen"
import SetupScreen from "@/screens/SetupScreen"
import TownScreen from "@/screens/TownScreen"
import type { Screen } from "@/lib/screen"

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")

  function go(next: Screen) {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (screen === "setup") return <SetupScreen go={go} />
  if (screen === "town") return <TownScreen go={go} />
  if (screen === "results") return <ResultsScreen go={go} />
  if (screen === "challenge") return <ChallengeScreen go={go} />
  return <HomeScreen go={go} />
}
