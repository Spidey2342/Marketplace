export type Screen =
  | "home"
  | "avatar"
  | "setup"
  | "town"
  | "results"
  | "challenge"

export type Go = (screen: Screen) => void
