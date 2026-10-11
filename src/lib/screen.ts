export type Screen =
  | "home"
  | "avatar"
  | "setup"
  | "town"
  | "results"
  | "challenge"
  | "leaderboard"

export type Go = (screen: Screen) => void
