import type { Intent, Screen } from "@/lib/screen"

export function destination(
  intent: Intent,
  profileComplete: boolean,
): Screen | "back" {
  switch (intent) {
    case "play":
      return profileComplete ? "setup" : "avatar"
    case "continue":
      return profileComplete ? "back" : "setup"
    case "back":
      return "back"
    case "open-stall":
      return "town"
    case "restock":
    case "play-again":
      return "setup"
    case "reinvest":
      return "upgrade"
    case "upgrade-back":
      return "results"
    case "challenge":
      return "challenge"
    case "rankings":
      return "leaderboard"
    case "avatar":
      return "avatar"
    default:
      return "back"
  }
}
