import type { RoundResult } from "@/lib/economy"

export const sampleResult: RoundResult = {
  profit: 18,
  revenue: 77,
  stockCost: 59,
  itemsSold: 9,
  customers: 11,
  reputationChange: 9,
  bestSeller: { productId: 1, name: "Sobolo", sold: 4 },
  factor: "cheaper",
  reasonTitle: "Cheaper than the neighbours",
  reasonLine: "Your prices sat under the stalls next door.",
  outcome: "win",
  headline: "The stall ate today.",
  subline: "Sobolo did the most work.",
}
