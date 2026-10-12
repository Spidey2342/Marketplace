export const CHARACTER_NEAR_METERS = 15

export const TRI_BUDGET = {
  showcase: 8000,
  streetNear: 4000,
  streetFar: 2000,
  crowdTotal: 60000,
} as const

export const CROSSFADE_S = 0.2

export const FAR_ANIM_INTERVAL_S = 0.1

export const SELL_CALL_MIN_S = 10
export const SELL_CALL_MAX_S = 15

export const CLIP = {
  idle: "idle",
  walk: "walk",
  run: "run",
  wave: "wave",
  cheer: "cheer",
  sellCall: "sell_call",
  buy: "buy",
} as const

export type CharacterLod = "showcase" | "street-near" | "street-far"

export type CharacterLook = {
  hairId: string
  outfitId: string
  shoeId: string
  skinToneId: string
  bodyTypeId: string
}
