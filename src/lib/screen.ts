export type Screen =
  | "home"
  | "avatar"
  | "setup"
  | "town"
  | "results"
  | "challenge"
  | "leaderboard"
  | "upgrade"

export type Intent =
  | "play"
  | "continue"
  | "back"
  | "open-stall"
  | "restock"
  | "play-again"
  | "reinvest"
  | "upgrade-back"
  | "challenge"
  | "rankings"
  | "avatar"

export type Go = (intent: Intent) => void
