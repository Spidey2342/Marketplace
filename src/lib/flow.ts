import type { Intent, Screen } from "@/lib/screen"

export function destination(
  intent: Intent,
  profileComplete: boolean,
): Screen | "back" {
  switch (intent) {
    case "play":
      return profileComplete ? "town" : "avatar"
    case "continue":
      return "town"
    case "back":
      return "back"
    case "open-stall":
    case "restock":
    case "play-again":
    case "upgrade-back":
      return "town"
    case "reinvest":
      return "upgrade"
    case "challenge":
      return "challenge"
    case "rankings":
      return "leaderboard"
    case "avatar":
      return "avatar"
    case "passport":
      return "passport"
    default:
      return "back"
  }
}
