import { buyers } from "@/data/customers"
import { productById, products, type Product } from "@/data/products"

export const STARTING_COINS = 100
export const ROUND_DURATION_MS = 5 * 60 * 1000
export const DEV_ROUND_DURATION_MS = 60 * 1000
export const DEV_SHORT_ROUND = false
export const PRICE_MIN = 1
export const PRICE_MAX = 15
export const GOOD_PRICE_MARGIN = 1
export const BUY_CHANCE_AT_NEIGHBOR = 0.6
export const BUY_CHANCE_BELOW_NEIGHBOR = 0.85
export const BUY_CHANCE_DROP_PER_CEDI = 0.25
export const BUY_CHANCE_FLOOR = 0.05
export const CUSTOMER_INTERVAL_MS = 12_000
export const FIRST_CUSTOMER_DELAY_MS = 4_000
export const DEV_CUSTOMER_INTERVAL_MS = 3_000
export const DEV_FIRST_CUSTOMER_DELAY_MS = 1_500
export const REPUTATION_PER_SALE = 1
export const POINTS_PER_PROFIT_COIN = 1
export const POINTS_PER_CHALLENGE = 10
export const URGENT_TIMER_SECONDS = 30
export const HOUR_MS = 60 * 60 * 1000

export type PriceVerdict = "Too low" | "Good price" | "Too high"

export type StallLine = {
  productId: number
  price: number
  selected: boolean
  sold: number
}

export type RoundFactor = "cheaper" | "expensive" | "below-cost" | "sold-out" | "steady"

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
}

export type CustomerVisit =
  | { kind: "quiet" }
  | { kind: "sold-out" }
  | {
      kind: "visit"
      bought: boolean
      productId: number
      buyer: string
      line: string
      price: number
      productName: string
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

export function selectedStockCost(stall: StallLine[]): number {
  return stall
    .filter((line) => line.selected)
    .reduce((sum, line) => sum + productById(line.productId).cost, 0)
}

export function freshStall(): StallLine[] {
  return products.map((product) => ({
    productId: product.id,
    price: product.price,
    selected: true,
    sold: 0,
  }))
}

export function clampPrice(price: number): number {
  return Math.min(PRICE_MAX, Math.max(PRICE_MIN, price))
}

export function contributionForProfit(profit: number): number {
  return Math.max(0, profit) * POINTS_PER_PROFIT_COIN
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

export function rollCustomer(
  stall: StallLine[],
  random: () => number = Math.random,
): CustomerVisit {
  const available = stall.filter((line) => {
    if (!line.selected) return false
    return line.sold < productById(line.productId).quantity
  })
  if (available.length === 0) return { kind: "sold-out" }

  const line = available[Math.floor(random() * available.length)]
  const product = productById(line.productId)
  const buyer = buyers[Math.floor(random() * buyers.length)]
  const bought = random() < buyChance(line.price, product.neighborPrice)
  return {
    kind: "visit",
    bought,
    productId: product.id,
    buyer,
    line: product.praise,
    price: line.price,
    productName: product.name,
  }
}

export function summarizeRound(input: {
  stall: StallLine[]
  customers: number
  revenue: number
  stockCost: number
  soldOutEarly: boolean
  roundsPlayed: number
  avatarName: string
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

  const factor = biggestFactor(input.stall, input.soldOutEarly)
  const reason = reasonCopy(factor, input.stall, input.revenue - input.stockCost)
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
  }
}

function biggestFactor(stall: StallLine[], soldOutEarly: boolean): RoundFactor {
  const scores: Record<RoundFactor, number> = {
    cheaper: 0,
    expensive: 0,
    "below-cost": 0,
    "sold-out": soldOutEarly ? 50 : 0,
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

function reasonCopy(factor: RoundFactor, stall: StallLine[], profit: number): string {
  const selected = stall.filter((line) => line.selected)
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
