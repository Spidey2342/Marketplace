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

export type RankedGroup = {
  id: string
  name: string
  points: number
  moved: number
}

export const leaderboard: RankedGroup[] = [
  { id: "block-a", name: "Block A Hostel", points: 920, moved: 2 },
  { id: "block-b", name: "Block B Hostel", points: 870, moved: -1 },
  { id: "labadi", name: "Labadi Lane", points: 760, moved: 1 },
  { id: "night", name: "Night Crew", points: 640, moved: 0 },
  { id: "class-26", name: "Class of '26", points: 510, moved: 3 },
  { id: "osu", name: "Osu Corner", points: 430, moved: -2 },
  { id: "year-below", name: "Year Below", points: 280, moved: 1 },
  { id: "united", name: "Stall United", points: 150, moved: -4 },
]

export const groupHustlers = [
  { nickname: "Akos", tag: 4821, points: 86 },
  { nickname: "Yaw", tag: 3190, points: 64 },
  { nickname: "Esi", tag: 7744, points: 41 },
]
