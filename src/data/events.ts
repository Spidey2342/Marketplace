export type EventId = "calm" | "hot" | "rain" | "payday" | "exam" | "match"

export type ChoiceKind = "bulk" | "credit"

export const CALM_CHANCE = 0.25
export const HOT_DRINK_DEMAND = 1.5
export const RAIN_ARRIVAL = 0.7
export const RAIN_DRINK_DEMAND = 0.6
export const AWNING_PENALTY_SHARE = 0.5
export const PAYDAY_ARRIVAL = 1.4
export const PAYDAY_SENSITIVITY_SCALE = 2 / 3
export const EXAM_STUDENT_RATE = 1.5
export const EXAM_WORKER_RATE = 0.8
export const MATCH_DRINK_DEMAND = 1.3
export const MATCH_SNACK_DEMAND = 1.3
export const RAIN_WARM_DEMAND = 1.3
export const FASHION_PAYDAY_DEMAND = 1.6
export const FASHION_ARRIVAL = 0.6
export const MATCH_SURGE_SECONDS = 90
export const MATCH_SURGE_ARRIVAL = 2
export const CHOICE_CHANCE = 0.15
export const CHOICE_EARLIEST_S = 60
export const CHOICE_LATEST_S = 180
export const CHOICE_TIMER_S = 10
export const SHORT_ROUND_CHOICE_START = 0.2
export const SHORT_ROUND_CHOICE_END = 0.6
export const BULK_STOCK_TIMES = 2
export const BULK_COST_TIMES = 1.6
export const BULK_EXTRA_SPOIL_CHANCE = 1
export const CREDIT_UNITS = 3
export const CREDIT_PAY_CHANCE = 0.7
export const CREDIT_BONUS = 0.3

export type RoundEvent = {
  id: EventId
  name: string
  chip: string
  forecast: string
  effect: string
}

export const roundEvents: RoundEvent[] = [
  {
    id: "calm",
    name: "Calm day",
    chip: "Calm",
    forecast: "Tomorrow: Calm day. A steady market.",
    effect: "Calm day. Nothing special shifted the crowd.",
  },
  {
    id: "hot",
    name: "Hot day",
    chip: "Hot",
    forecast: "Tomorrow: Hot day expected. Drinks will move.",
    effect: "Hot day. People wanted something cold to drink.",
  },
  {
    id: "rain",
    name: "Rain",
    chip: "Rain",
    forecast: "Tomorrow: Rain expected. Warm food moves, drinks slow.",
    effect: "Rain. Fewer people came. Warm food moved, drinks slowed.",
  },
  {
    id: "payday",
    name: "Payday weekend",
    chip: "Pay",
    forecast: "Tomorrow: Payday weekend. People spend easier.",
    effect: "Payday weekend. More people came, and prices bothered them less.",
  },
  {
    id: "exam",
    name: "Exam week",
    chip: "Exam",
    forecast: "Tomorrow: Exam week. Students will be out.",
    effect: "Exam week. More students, fewer workers.",
  },
  {
    id: "match",
    name: "Match day",
    chip: "Match",
    forecast: "Tomorrow: Match day. Drinks and snacks will move.",
    effect: "Match day. Drinks and snacks moved, then a crowd surged near the close.",
  },
]

const otherEvents: EventId[] = ["hot", "rain", "payday", "exam", "match"]

export function eventById(id: EventId): RoundEvent {
  const event = roundEvents.find((item) => item.id === id)
  if (!event) throw new Error(`Unknown event ${id}`)
  return event
}

export function isEventId(value: unknown): value is EventId {
  return roundEvents.some((item) => item.id === value)
}

export function eventForRound(roundsPlayed: number, forecast: EventId | null): EventId {
  if (roundsPlayed === 0 && forecast === null) return "calm"
  return forecast ?? "calm"
}

export function pickEvent(random: () => number): EventId {
  if (random() < CALM_CHANCE) return "calm"
  const index = Math.floor(random() * otherEvents.length)
  return otherEvents[index] ?? "calm"
}

export function arrivalRate(
  event: EventId,
  awning: boolean,
  secondsLeft: number,
): number {
  if (event === "rain") {
    const penalty = (1 - RAIN_ARRIVAL) * (awning ? AWNING_PENALTY_SHARE : 1)
    return 1 - penalty
  }
  if (event === "payday") return PAYDAY_ARRIVAL
  if (event === "match" && secondsLeft <= MATCH_SURGE_SECONDS) {
    return MATCH_SURGE_ARRIVAL
  }
  return 1
}

export function drinkDemand(event: EventId, awning: boolean): number {
  if (event === "hot") return HOT_DRINK_DEMAND
  if (event === "match") return MATCH_DRINK_DEMAND
  if (event === "rain") {
    const penalty = (1 - RAIN_DRINK_DEMAND) * (awning ? AWNING_PENALTY_SHARE : 1)
    return 1 - penalty
  }
  return 1
}

export function sensitivityScale(event: EventId): number {
  return event === "payday" ? PAYDAY_SENSITIVITY_SCALE : 1
}

export function rollChoice(random: () => number): ChoiceKind | null {
  const bulk = random() < CHOICE_CHANCE
  const credit = random() < CHOICE_CHANCE
  if (bulk && credit) return random() < 0.5 ? "bulk" : "credit"
  if (bulk) return "bulk"
  if (credit) return "credit"
  return null
}

export function choiceDelayMs(durationMs: number, random: () => number): number {
  const full = durationMs >= CHOICE_LATEST_S * 1000
  const earliest = full
    ? CHOICE_EARLIEST_S * 1000
    : durationMs * SHORT_ROUND_CHOICE_START
  const latest = full
    ? CHOICE_LATEST_S * 1000
    : durationMs * SHORT_ROUND_CHOICE_END
  return earliest + random() * Math.max(0, latest - earliest)
}

export function bulkCost(packCost: number): number {
  return Math.round(packCost * BULK_COST_TIMES)
}

export function creditPayout(units: number, unitPrice: number): number {
  return Math.round(units * unitPrice * (1 + CREDIT_BONUS))
}
