export type LookOption = {
  id: string
  label: string
  color: string
}

export const bodyTypes: LookOption[] = [
  { id: "slim", label: "Slim", color: "#075846" },
  { id: "medium", label: "Medium", color: "#075846" },
  { id: "broad", label: "Broad", color: "#075846" },
]

export const skinTones: LookOption[] = [
  { id: "cocoa", label: "Cocoa", color: "#3d2317" },
  { id: "espresso", label: "Espresso", color: "#4a2e1f" },
  { id: "mocha", label: "Mocha", color: "#5c3a28" },
  { id: "caramel", label: "Caramel", color: "#7a4f35" },
  { id: "honey", label: "Honey", color: "#9a6848" },
  { id: "amber", label: "Amber", color: "#b8845c" },
  { id: "sand", label: "Sand", color: "#d4a574" },
  { id: "pearl", label: "Pearl", color: "#e8c9a8" },
]

export const hairs: LookOption[] = [
  { id: "short", label: "Short", color: "#2a1a16" },
  { id: "puff", label: "Puff", color: "#1c120f" },
  { id: "braids", label: "Braids", color: "#3b2418" },
  { id: "fade", label: "Fade", color: "#4a3024" },
]

export const outfits: LookOption[] = [
  { id: "kente", label: "Kente", color: "#ffc928" },
  { id: "green", label: "Market green", color: "#075846" },
  { id: "red", label: "Chop red", color: "#e94b3c" },
  { id: "indigo", label: "Night indigo", color: "#303c72" },
  { id: "cream", label: "Cream", color: "#fff4d2" },
  { id: "orange", label: "Sun orange", color: "#f08b31" },
]

export const shoes: LookOption[] = [
  { id: "sandals", label: "Sandals", color: "#8a5b43" },
  { id: "kicks", label: "Kicks", color: "#182f2a" },
  { id: "slides", label: "Slides", color: "#e7b423" },
]

export function lookById(options: LookOption[], id: string): LookOption {
  return options.find((option) => option.id === id) ?? options[0]
}

export type AvatarProfile = {
  hair: string
  outfit: string
  shoes: string
  skin: string
  body: string
}

export function avatarFromState(input: {
  hairId: string
  outfitId: string
  shoeId: string
  skinToneId: string
  bodyTypeId: string
}): AvatarProfile {
  return {
    hair: input.hairId,
    outfit: input.outfitId,
    shoes: input.shoeId,
    skin: input.skinToneId,
    body: input.bodyTypeId,
  }
}
