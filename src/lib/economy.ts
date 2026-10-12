import { buyers } from "@/data/customers"
import {
  drinkDemand,
  eventById,
  EXAM_STUDENT_RATE,
  EXAM_WORKER_RATE,
  FASHION_ARRIVAL,
  FASHION_PAYDAY_DEMAND,
  MATCH_SNACK_DEMAND,
  RAIN_DRINK_DEMAND,
  RAIN_WARM_DEMAND,
  AWNING_PENALTY_SHARE,
  sensitivityScale,
  type EventId,
} from "@/data/events"
import { isUnlocked, isWarmFood, productById, products, type Product } from "@/data/products"
import type { StageId } from "@/data/upgrades"

export const STARTING_COINS = 100
export const ROUND_DURATION_MS = 5 * 60 * 1000
export const DEV_ROUND_DURATION_MS = 60 * 1000
export const DEV_SHORT_ROUND = false
export const PRICE_MIN = 1
export const PRICE_MAX = 40
export const GOOD_PRICE_MARGIN = 1
export const BUY_CHANCE_AT_NEIGHBOR = 0.6
export const BUY_CHANCE_BELOW_NEIGHBOR = 0.85
export const BUY_CHANCE_DROP_PER_CEDI = 0.25
export const BUY_CHANCE_FLOOR = 0.05
export const PACK_MIN = 1
export const PACK_MAX = 3
export const LIKED_ITEM_BONUS = 0.15
export const REGULAR_BONUS = 0.2
export const REGULAR_CAP = 3
export const FAIR_ABOVE_NEIGHBOR = 1
export const STUDENT_DROP_PER_CEDI = 0.35
export const WORKER_DROP_PER_CEDI = 0.15
export const VISITOR_DROP_PER_CEDI = 0.08
export const WORKER_FRESH_SLACK = 1
export const FIRST_HALF = 0.5
export const LAST_THIRD = 2 / 3
export const STUDENT_FIRST_HALF_CHANCE = 0.72
export const WORKER_MIDDLE_CHANCE = 0.7
export const VISITOR_LAST_THIRD_CHANCE = 0.375
export const STUDENT_GROUP_CHANCE = 0.7
export const STUDENT_GROUP_MIN = 2
export const STUDENT_GROUP_MAX = 3
export const VISITOR_ITEMS = 2
export const LIKED_PICK_CHANCE = 0.8
export const REGULAR_RETURN_CHANCE = 0.45
export const EVENT_FACTOR_RAIN = 60
export const EVENT_FACTOR_OTHER = 45
export const CUSTOMER_INTERVAL_MS = 12_000
export const FIRST_CUSTOMER_DELAY_MS = 4_000
export const DEV_CUSTOMER_INTERVAL_MS = 3_000
export const DEV_FIRST_CUSTOMER_DELAY_MS = 1_500
export const REPUTATION_PER_SALE = 1
export const POINTS_PER_PROFIT_COIN = 1
export const POINTS_PER_CHALLENGE = 10
export const URGENT_TIMER_SECONDS = 30
export const BUBBLE_MS = 3_000
export const HOUR_MS = 60 * 60 * 1000

export type PriceVerdict = "Too low" | "Good price" | "Too high"

export type StallLine = {
  productId: number
  price: number
  selected: boolean
  sold: number
  packs: number
  carried: number
  opened: number
}

export type CustomerType = "student" | "worker" | "visitor" | "regular" | "player"

export type Regular = {
  name: string
  productId: number
}

export type TypeCounts = Record<CustomerType, number>

export type SpoiledLine = {
  productId: number
  name: string
  units: number
  unitName: string
}

export const LIKED_PRODUCTS: Record<CustomerType, number[]> = {
  student: products.filter((product) => product.likedBy.includes("student")).map((product) => product.id),
  worker: products.filter((product) => product.likedBy.includes("worker")).map((product) => product.id),
  visitor: products.filter((product) => product.likedBy.includes("visitor")).map((product) => product.id),
  regular: [],
  player: [],
}

export function emptyTypeCounts(): TypeCounts {
  return { student: 0, worker: 0, visitor: 0, regular: 0, player: 0 }
}

export type RoundFactor =
  | "cheaper"
  | "expensive"
  | "below-cost"
  | "sold-out"
  | "spoilage"
  | "regulars"
  | "event"
  | "steady"

export type RoundOutcome = "first-sale" | "win" | "loss"

export type RoundResult = {
  profit: number
  revenue: number
  stockCost: number
  itemsSold: number
  customers: number
  reputationChange: number
  bestSeller: { productId: number; name: string; sold: number } | null
  factor: RoundFactor
  reasonTitle: string
  reasonLine: string
  outcome: RoundOutcome
  headline: string
  subline: string
  buyers: TypeCounts
  spoiled: SpoiledLine[]
  eventId: EventId
  eventName: string
  eventLine: string
  creditLine: string | null
  boughtItems: number
  boughtSpend: number
}

export type Purchase = {
  productId: number
  buyer: string
  line: string
  price: number
  productName: string
}

export type CustomerVisit =
  | { kind: "quiet" }
  | { kind: "sold-out" }
  | {
      kind: "visit"
      bought: boolean
      type: CustomerType
      buyer: string
      people: number
      purchases: Purchase[]
    }

export function readShortRound(): boolean {
  if (DEV_SHORT_ROUND) return true
  try {
    return new URLSearchParams(window.location.search).get("shortRound") === "1"
  } catch {
    return false
  }
}

export function roundDurationMs(shortRound: boolean): number {
  return shortRound ? DEV_ROUND_DURATION_MS : ROUND_DURATION_MS
}

export function customerTiming(shortRound: boolean): {
  firstDelay: number
  interval: number
} {
  return shortRound
    ? {
        firstDelay: DEV_FIRST_CUSTOMER_DELAY_MS,
        interval: DEV_CUSTOMER_INTERVAL_MS,
      }
    : {
        firstDelay: FIRST_CUSTOMER_DELAY_MS,
        interval: CUSTOMER_INTERVAL_MS,
      }
}

export function priceVerdict(price: number, product: Product): PriceVerdict {
  if (price <= product.unitCost) return "Too low"
  if (price <= product.neighborPrice + GOOD_PRICE_MARGIN) return "Good price"
  return "Too high"
}

export function buyChance(price: number, neighborPrice: number): number {
  if (price < neighborPrice) return BUY_CHANCE_BELOW_NEIGHBOR
  if (price === neighborPrice) return BUY_CHANCE_AT_NEIGHBOR
  const chance =
    BUY_CHANCE_AT_NEIGHBOR - BUY_CHANCE_DROP_PER_CEDI * (price - neighborPrice)
  return Math.max(BUY_CHANCE_FLOOR, chance)
}

export function clampPacks(packs: number): number {
  const value = Math.round(packs)
  if (Number.isNaN(value)) return PACK_MIN
  return Math.min(PACK_MAX, Math.max(PACK_MIN, value))
}

export function packUnits(product: Product, packs: number): number {
  return product.quantity * clampPacks(packs)
}

export function unitsOnTable(line: StallLine): number {
  const product = productById(line.productId)
  return Math.max(packUnits(product, line.packs), line.carried)
}

export function lineRestockCost(line: StallLine): number {
  if (!line.selected) return 0
  const product = productById(line.productId)
  const buying = Math.max(0, packUnits(product, line.packs) - line.carried)
  return buying * product.unitCost
}

export function selectedStockCost(stall: StallLine[]): number {
  return stall.reduce((sum, line) => sum + lineRestockCost(line), 0)
}

export function cheapestOpenCost(stall: StallLine[], stageId: StageId): number {
  const costs = products
    .filter((product) => isUnlocked(product, stageId))
    .map((product) => {
      const line = stall.find((item) => item.productId === product.id)
      const carried = line?.carried ?? 0
      return Math.max(0, product.quantity - carried) * product.unitCost
    })
  if (costs.length === 0) return 0
  return Math.min(...costs)
}

export function cheapestUnlocked(stageId: StageId): Product | null {
  const open = products.filter((product) => isUnlocked(product, stageId))
  if (open.length === 0) return null
  return open.reduce((best, product) => (product.cost < best.cost ? product : best))
}

const STARTER_IDS = [1, 2, 3]

export function freshStall(): StallLine[] {
  return products.map((product) => ({
    productId: product.id,
    price: product.price,
    selected: STARTER_IDS.includes(product.id),
    sold: 0,
    packs: PACK_MIN,
    carried: 0,
    opened: 0,
  }))
}

export function stockLeft(line: StallLine): number {
  const cap = line.opened > 0 ? line.opened : unitsOnTable(line)
  return Math.max(0, cap - line.sold)
}

export function clampPrice(price: number): number {
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, price))
}

export function contributionForProfit(profit: number): number {
  return Math.max(0, profit) * POINTS_PER_PROFIT_COIN
}

export function playerWeekPoints(
  profitContribution: number,
  challengesCompleted: number,
): number {
  return profitContribution + challengesCompleted * POINTS_PER_CHALLENGE
}

export const DEFAULT_ROUND_PROFIT = 40

export function roundsToGo(shortfall: number, profits: number[]): number {
  const wins = profits.filter((profit) => profit > 0)
  const average = wins.length
    ? wins.reduce((sum, profit) => sum + profit, 0) / wins.length
    : DEFAULT_ROUND_PROFIT
  const pace = average > 0 ? average : DEFAULT_ROUND_PROFIT
  return Math.max(1, Math.ceil(shortfall / pace))
}

export function timeUntilSunday(now: number): { days: number; hours: number } {
  const end = new Date(now)
  const day = end.getDay()
  const daysUntilSunday = day === 0 ? 0 : 7 - day
  end.setDate(end.getDate() + daysUntilSunday)
  end.setHours(23, 59, 59, 999)
  if (end.getTime() <= now) end.setDate(end.getDate() + 7)
  const hoursTotal = Math.floor((end.getTime() - now) / HOUR_MS)
  return {
    days: Math.floor(hoursTotal / 24),
    hours: hoursTotal % 24,
  }
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(seconds / 60)
  const remain = seconds % 60
  return `${minutes}:${String(remain).padStart(2, "0")}`
}

export function dropForType(type: CustomerType): number {
  if (type === "student") return STUDENT_DROP_PER_CEDI
  if (type === "visitor") return VISITOR_DROP_PER_CEDI
  return WORKER_DROP_PER_CEDI
}

export function buyChanceFor(
  price: number,
  product: Product,
  type: CustomerType,
  liked: boolean,
  regular: boolean,
  event: EventId = "calm",
  awning = false,
): number {
  let chance = BUY_CHANCE_AT_NEIGHBOR
  if (liked) chance += LIKED_ITEM_BONUS
  if (regular) chance += REGULAR_BONUS
  let ceiling = product.neighborPrice
  if (type === "worker" && product.perishable) ceiling += WORKER_FRESH_SLACK
  const over = price - ceiling
  if (over > 0) chance -= dropForType(type) * sensitivityScale(event) * over
  chance *= eventDemand(product, event, awning)
  return Math.min(1, Math.max(BUY_CHANCE_FLOOR, chance))
}

export function eventDemand(product: Product, event: EventId, awning: boolean): number {
  if (product.category === "fashion") {
    return event === "payday" ? FASHION_PAYDAY_DEMAND : 1
  }
  if (product.category === "drinks") return drinkDemand(event, awning)
  let demand = 1
  if (event === "match" && product.category === "snacks") demand *= MATCH_SNACK_DEMAND
  if (event === "rain" && isWarmFood(product)) demand *= RAIN_WARM_DEMAND
  return demand
}

export function awningSavedCedis(drinkRevenue: number): number {
  const withAwning = 1 - (1 - RAIN_DRINK_DEMAND) * AWNING_PENALTY_SHARE
  if (withAwning <= 0) return 0
  return Math.round(drinkRevenue * (1 - RAIN_DRINK_DEMAND / withAwning))
}

function examShare(base: number, favored: "student" | "worker", event: EventId): number {
  if (event !== "exam") return base
  const student = (favored === "student" ? base : 1 - base) * EXAM_STUDENT_RATE
  const worker = (favored === "worker" ? base : 1 - base) * EXAM_WORKER_RATE
  const total = student + worker
  if (total <= 0) return base
  return (favored === "student" ? student : worker) / total
}

export function pickCustomerType(
  progress: number,
  regulars: Regular[],
  seen: string[],
  random: () => number,
  event: EventId = "calm",
): CustomerType {
  const waiting = regulars.some((regular) => !seen.includes(regular.name))
  if (waiting && random() < REGULAR_RETURN_CHANCE) return "regular"
  if (progress >= LAST_THIRD && random() < VISITOR_LAST_THIRD_CHANCE) {
    return "visitor"
  }
  if (progress < FIRST_HALF) {
    const studentChance = examShare(STUDENT_FIRST_HALF_CHANCE, "student", event)
    return random() < studentChance ? "student" : "worker"
  }
  if (progress < LAST_THIRD) {
    const workerChance = examShare(WORKER_MIDDLE_CHANCE, "worker", event)
    return random() < workerChance ? "worker" : "student"
  }
  const studentChance = examShare(FIRST_HALF, "student", event)
  return random() < studentChance ? "student" : "worker"
}

function partySize(type: CustomerType, random: () => number): number {
  if (type !== "student" || random() > STUDENT_GROUP_CHANCE) return 1
  return random() < 0.5 ? STUDENT_GROUP_MIN : STUDENT_GROUP_MAX
}

function availableLines(stall: StallLine[]): StallLine[] {
  return stall.filter((line) => line.selected && stockLeft(line) > 0)
}

function pickLine(
  stall: StallLine[],
  type: CustomerType,
  favorite: number | null,
  random: () => number,
): StallLine | null {
  let available = availableLines(stall)
  if (available.length === 0) return null
  if (random() >= FASHION_ARRIVAL) {
    const everyday = available.filter(
      (line) => productById(line.productId).category !== "fashion",
    )
    if (everyday.length > 0) available = everyday
  }
  const likedIds = favorite !== null ? [favorite] : LIKED_PRODUCTS[type]
  const liked = available.filter((line) => likedIds.includes(line.productId))
  const pool = liked.length > 0 && random() < LIKED_PICK_CHANCE ? liked : available
  return pool[Math.floor(random() * pool.length)]
}

export function rollVisit(
  stall: StallLine[],
  progress: number,
  regulars: Regular[],
  seen: string[],
  random: () => number = Math.random,
  event: EventId = "calm",
  awning = false,
): CustomerVisit {
  if (availableLines(stall).length === 0) return { kind: "sold-out" }
  const type = pickCustomerType(progress, regulars, seen, random, event)
  const waiting = regulars.filter((regular) => !seen.includes(regular.name))
  const regular = type === "regular" ? waiting[0] : undefined
  const buyer = regular?.name ?? buyers[Math.floor(random() * buyers.length)]
  const people = type === "visitor" ? 1 : partySize(type, random)
  const attempts = type === "visitor" ? VISITOR_ITEMS : people
  const scratch = stall.map((line) => ({ ...line }))
  const purchases: Purchase[] = []
  for (let index = 0; index < attempts; index += 1) {
    const line = pickLine(scratch, type, regular?.productId ?? null, random)
    if (!line) break
    const product = productById(line.productId)
    const liked =
      type === "regular"
        ? line.productId === regular?.productId
        : LIKED_PRODUCTS[type].includes(line.productId)
    const chance = buyChanceFor(
      line.price,
      product,
      type,
      liked,
      type === "regular",
      event,
      awning,
    )
    if (random() >= chance) continue
    line.sold += 1
    purchases.push({
      productId: product.id,
      buyer,
      line: product.praise,
      price: line.price,
      productName: product.name,
    })
  }
  return {
    kind: "visit",
    bought: purchases.length > 0,
    type,
    buyer,
    people,
    purchases,
  }
}

export function fairPrice(price: number, neighborPrice: number): boolean {
  return price <= neighborPrice + FAIR_ABOVE_NEIGHBOR
}

export function pushRegular(regulars: Regular[], next: Regular): Regular[] {
  const trimmed = regulars.filter((item) => item.name !== next.name)
  return [...trimmed, next].slice(-REGULAR_CAP)
}

export function settleStock(stall: StallLine[]): {
  stall: StallLine[]
  spoiled: SpoiledLine[]
} {
  const spoiled: SpoiledLine[] = []
  const next = stall.map((line) => {
    if (!line.selected || line.opened <= 0) {
      return { ...line, sold: 0, opened: 0 }
    }
    const left = Math.max(0, line.opened - line.sold)
    const product = productById(line.productId)
    if (product.perishable) {
      if (left > 0) {
        spoiled.push({
          productId: product.id,
          name: product.name.toLowerCase(),
          units: left,
          unitName: product.unitName,
        })
      }
      return { ...line, sold: 0, opened: 0, carried: 0 }
    }
    return { ...line, sold: 0, opened: 0, carried: left }
  })
  return { stall: next, spoiled }
}

export function spoiledSentence(spoiled: SpoiledLine[]): string {
  if (spoiled.length === 0) return ""
  return spoiled
    .map((item) => `${item.units} ${item.unitName} of ${item.name} spoiled`)
    .join(". ")
}

export function summarizeRound(input: {
  stall: StallLine[]
  customers: number
  revenue: number
  stockCost: number
  soldOutEarly: boolean
  roundsPlayed: number
  avatarName: string
  buyers: TypeCounts
  spoiled: SpoiledLine[]
  event: EventId
  awning: boolean
  creditLine: string | null
  boughtItems?: number
  boughtSpend?: number
}): RoundResult {
  const itemsSold = input.stall.reduce((sum, line) => sum + line.sold, 0)
  const profit = input.revenue - input.stockCost
  const reputationChange = Math.max(0, itemsSold * REPUTATION_PER_SALE)
  const best = [...input.stall].sort((a, b) => b.sold - a.sold)[0]
  const bestSeller =
    best && best.sold > 0
      ? {
          productId: best.productId,
          name: productById(best.productId).name,
          sold: best.sold,
        }
      : null

  const drinkRevenue = input.stall.reduce((sum, line) => {
    const product = productById(line.productId)
    return product.drink ? sum + line.sold * line.price : sum
  }, 0)
  const saved = input.awning && input.event === "rain" ? awningSavedCedis(drinkRevenue) : 0
  const eventInfo = eventById(input.event)
  const factor = biggestFactor(
    input.stall,
    input.soldOutEarly,
    input.spoiled,
    input.buyers,
    input.customers,
    input.event,
  )
  const reason = reasonCopy(
    factor,
    input.stall,
    input.revenue - input.stockCost,
    input.spoiled,
    input.buyers,
    input.event,
    input.awning,
    saved,
  )
  const eventFields = {
    eventId: input.event,
    eventName: eventInfo.name,
    eventLine:
      input.event === "rain" && input.awning && saved > 0
        ? `Rain cut the drinks, but your awning saved you ¢${saved}.`
        : eventInfo.effect,
    creditLine: input.creditLine,
    boughtItems: input.boughtItems ?? 0,
    boughtSpend: input.boughtSpend ?? 0,
  }
  const isFirstSale = input.roundsPlayed === 0 && itemsSold > 0
  const name = input.avatarName.trim() || "Chale"

  if (isFirstSale) {
    return {
      profit,
      revenue: input.revenue,
      stockCost: input.stockCost,
      itemsSold,
      customers: input.customers,
      reputationChange,
      bestSeller,
      factor,
      reasonTitle: profit < 0 ? "What to try" : "Why you won",
      reasonLine: reason,
      outcome: "first-sale",
      headline: `Solid hustle, ${name}!`,
      subline: "Your first sale is in the books.",
      buyers: input.buyers,
      spoiled: input.spoiled,
      ...eventFields,
    }
  }

  if (profit < 0) {
    return {
      profit,
      revenue: input.revenue,
      stockCost: input.stockCost,
      itemsSold,
      customers: input.customers,
      reputationChange,
      bestSeller,
      factor,
      reasonTitle: "What to try",
      reasonLine: reason,
      outcome: "loss",
      headline: "Ei, you are still in the game.",
      subline: "Nothing you already earned is gone.",
      buyers: input.buyers,
      spoiled: input.spoiled,
      ...eventFields,
    }
  }

  return {
    profit,
    revenue: input.revenue,
    stockCost: input.stockCost,
    itemsSold,
    customers: input.customers,
    reputationChange,
    bestSeller,
    factor,
    reasonTitle: "Why you won",
    reasonLine: reason,
    outcome: "win",
    headline: `Solid hustle, ${name}!`,
    subline: "The market closed on a good note.",
    buyers: input.buyers,
    spoiled: input.spoiled,
    ...eventFields,
  }
}

function biggestFactor(
  stall: StallLine[],
  soldOutEarly: boolean,
  spoiled: SpoiledLine[],
  buyers: TypeCounts,
  customers: number,
  event: EventId,
): RoundFactor {
  const spoiledUnits = spoiled.reduce((sum, item) => sum + item.units, 0)
  const regularShare = customers > 0 ? buyers.regular / customers : 0
  const scores: Record<RoundFactor, number> = {
    cheaper: 0,
    expensive: 0,
    "below-cost": 0,
    "sold-out": soldOutEarly ? 50 : 0,
    spoilage: spoiledUnits * 12,
    regulars: regularShare >= 0.3 && buyers.regular >= 2 ? 40 + buyers.regular : 0,
    event: event === "calm" ? 0 : event === "rain" ? EVENT_FACTOR_RAIN : EVENT_FACTOR_OTHER,
    steady: 1,
  }

  for (const line of stall) {
    if (!line.selected) continue
    const product = productById(line.productId)
    if (line.price < product.neighborPrice) scores.cheaper += 10 + line.sold
    if (line.price > product.neighborPrice + GOOD_PRICE_MARGIN) {
      scores.expensive += 10 + (product.quantity - line.sold)
    }
    if (line.price <= product.unitCost) {
      scores["below-cost"] += 100 + line.sold * 10
    }
  }

  return (Object.keys(scores) as RoundFactor[]).reduce((best, factor) =>
    scores[factor] > scores[best] ? factor : best,
  )
}

function reasonCopy(
  factor: RoundFactor,
  stall: StallLine[],
  profit: number,
  spoiled: SpoiledLine[],
  buyers: TypeCounts,
  event: EventId,
  awning: boolean,
  saved: number,
): string {
  const selected = stall.filter((line) => line.selected)
  if (factor === "event") {
    if (event === "rain") {
      return awning && saved > 0
        ? `Rain cut your sobolo sales, but your awning saved you ¢${saved}.`
        : "Rain cut your sobolo sales."
    }
    return eventById(event).effect
  }
  if (factor === "spoilage") {
    const sentence = spoiledSentence(spoiled)
    return sentence
      ? `${sentence}. Fresh stock doesn't keep overnight.`
      : "Fresh stock didn't keep overnight."
  }
  if (factor === "regulars") {
    return `${buyers.regular} regulars came back. That extra trust filled the stall.`
  }
  if (factor === "sold-out") {
    return "You sold out before the market closed. Next time, carry a bit more."
  }
  if (factor === "below-cost") {
    const line =
      selected.find((item) => item.price <= productById(item.productId).unitCost) ??
      selected[0]
    const name = line ? productById(line.productId).name : "An item"
    return `You sold ${name} under cost. The sales came, but the profit stayed thin.`
  }
  if (factor === "expensive") {
    const line =
      selected.find(
        (item) =>
          item.price >
          productById(item.productId).neighborPrice + GOOD_PRICE_MARGIN,
      ) ?? selected[0]
    if (!line) return "Prices sat above the neighbours'. Fewer people stopped."
    const product = productById(line.productId)
    return `Ei, ${product.name} was above the neighbours' ¢${product.neighborPrice}. Fewer people stopped.`
  }
  if (factor === "cheaper") {
    const line =
      selected.find(
        (item) => item.price < productById(item.productId).neighborPrice,
      ) ?? selected[0]
    if (!line) {
      return "Your prices sat with the neighbours'. People still came."
    }
    const product = productById(line.productId)
    const gap = product.neighborPrice - line.price
    return `Your ${product.name} was ¢${gap} cheaper than your neighbours'. More people stopped by.`
  }
  if (factor === "steady" && profit < 0) {
    return "Sales didn't cover the stock. Next round, stay close to the neighbours' prices."
  }
  return "Your prices sat with the neighbours'. People still came."
}
