import { EXPLORER_BADGE, EXPLORER_COINS } from "@/data/visits"

export const NOTE_MAX = 140
export const PASSPORT_AFTER = 3
export const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
export const WEEK_EPOCH_MS = Date.UTC(2026, 0, 4)

export type ProofType = "photo" | "receipt" | "note" | "auto"

export type Challenge = {
  id: number
  kicker: string
  title: string
  body: string
  rewardCoins: number
  rewardBadge: string
  proof: ProofType
  steps: string[]
}

export const challenges: Challenge[] = [
  {
    id: 0,
    kicker: "First sale energy",
    title: "Make your first real sale.",
    body: "Sell one simple thing to someone you know. Start small.",
    rewardCoins: 200,
    rewardBadge: "First Sale badge",
    proof: "photo",
    steps: ["Choose one thing to sell", "Agree a fair price", "Make the sale and add proof"],
  },
  {
    id: 1,
    kicker: "Look around",
    title: "Price survey.",
    body: "Photograph or note the prices of the same item at 3 real stalls.",
    rewardCoins: 150,
    rewardBadge: "Price Scout badge",
    proof: "note",
    steps: ["Pick one item", "Check 3 stalls", "Write the prices down"],
  },
  {
    id: 2,
    kicker: "Ask around",
    title: "Ask 5 people what they would buy from you.",
    body: "Write down the top answer.",
    rewardCoins: 150,
    rewardBadge: "Listener badge",
    proof: "note",
    steps: ["Ask 5 people", "Listen for the top answer", "Write that answer"],
  },
  {
    id: 3,
    kicker: "Show the thing",
    title: "Make a sample.",
    body: "Make a sample or mini version of your product and show it.",
    rewardCoins: 180,
    rewardBadge: "Maker badge",
    proof: "photo",
    steps: ["Make a small version", "Show it to someone", "Add a photo"],
  },
  {
    id: 4,
    kicker: "Keep a little",
    title: "Save ¢10.",
    body: "Save ¢10 of real money you earned, and note how.",
    rewardCoins: 120,
    rewardBadge: "Saver badge",
    proof: "receipt",
    steps: ["Earn a little", "Set ¢10 aside", "Add the receipt"],
  },
  {
    id: 5,
    kicker: "Hear it straight",
    title: "Get honest feedback.",
    body: "Ask your best customer, and write it in one sentence.",
    rewardCoins: 160,
    rewardBadge: "Feedback badge",
    proof: "note",
    steps: ["Find your best customer", "Ask what to change", "Write one sentence"],
  },
]

/** Sits beside the rotating six so this week's real-life challenge does not move. */
export const explorerChallenge: Challenge = {
  id: 6,
  kicker: "Walk the lane",
  title: "Buy from 3 different stalls.",
  body: "Buy from three stalls in the town. It counts itself.",
  rewardCoins: EXPLORER_COINS,
  rewardBadge: EXPLORER_BADGE,
  proof: "auto",
  steps: ["Find a stall", "Buy something small", "Do that at 3 different stalls"],
}

export function weekId(now: number): number {
  return Math.floor((now - WEEK_EPOCH_MS) / MS_PER_WEEK)
}

export function currentChallenge(now: number): Challenge {
  const index = ((weekId(now) % challenges.length) + challenges.length) % challenges.length
  const challenge = challenges[index]
  if (!challenge) return challenges[0]
  return challenge
}
