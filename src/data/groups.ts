export type PlayerGroup = {
  id: string
  name: string
  kind: string
  members: number
  rivalry: string
  code: string
}

export const groups: PlayerGroup[] = [
  {
    id: "block-a",
    name: "Block A Hostel",
    kind: "Hostel block",
    members: 46,
    rivalry: "Beat Block B this week",
    code: "BLOCKA",
  },
  {
    id: "class-26",
    name: "Class of '26",
    kind: "Class year",
    members: 38,
    rivalry: "Beat the year below this week",
    code: "YEAR26",
  },
  {
    id: "osu",
    name: "Osu Corner",
    kind: "Neighborhood",
    members: 29,
    rivalry: "Beat Labadi lane this week",
    code: "OSU",
  },
  {
    id: "united",
    name: "Stall United",
    kind: "Team",
    members: 18,
    rivalry: "Beat the night crew this week",
    code: "UNITED",
  },
]

export function groupById(id: string | null): PlayerGroup | null {
  if (!id) return null
  return groups.find((group) => group.id === id) ?? null
}

export function groupByCode(code: string): PlayerGroup | null {
  const clean = code.trim().toUpperCase()
  return groups.find((group) => group.code === clean) ?? null
}
