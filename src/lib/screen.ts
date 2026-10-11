export type Screen = "home" | "setup" | "town" | "results" | "challenge"

export type Go = (screen: Screen) => void
