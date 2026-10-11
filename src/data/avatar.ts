export type LookOption = {
  id: string
  label: string
  color: string
}

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
