export const SHOP_COST = 150
export const BRAND_COST = 400
export const TEAM_COST = 800
export const BRANCHES_COST = 1500
export const SIGN_COST = 60
export const AWNING_ID = "awning"
export const AWNING_COST = 90
export const COOL_BOX_COST = 70
export const COOL_BOX_REPUTATION = 10
export const TEAM_SHARE_PERCENT = 10

export type StageId = "stall" | "shop" | "brand" | "team" | "branches"

export type Stage = {
  id: StageId
  label: string
  cost: number
  unlocks: string
  purchasable: boolean
}

export const stages: Stage[] = [
  {
    id: "stall",
    label: "Stall",
    cost: 0,
    unlocks: "Your first spot on the street.",
    purchasable: true,
  },
  {
    id: "shop",
    label: "Shop",
    cost: SHOP_COST,
    unlocks: "6 item slots and a customer queue.",
    purchasable: true,
  },
  {
    id: "brand",
    label: "Brand",
    cost: BRAND_COST,
    unlocks: "A stall name, a logo, and extra reputation per sale.",
    purchasable: true,
  },
  {
    id: "team",
    label: "Team",
    cost: TEAM_COST,
    unlocks: `Hire a friend who earns ${TEAM_SHARE_PERCENT}% of sales.`,
    purchasable: true,
  },
  {
    id: "branches",
    label: "Branches",
    cost: BRANCHES_COST,
    unlocks: "Opens with the campus zone.",
    purchasable: false,
  },
]

export type QuickUpgrade = {
  id: string
  name: string
  detail: string
  cost: number
  needsStage?: StageId
  needsReputation?: number
}

export const quickUpgrades: QuickUpgrade[] = [
  {
    id: "sign",
    name: "Painted sign",
    detail: "Customers spot you from down the lane.",
    cost: SIGN_COST,
  },
  {
    id: AWNING_ID,
    name: "Kente awning",
    detail: "Shade, and a little style.",
    cost: AWNING_COST,
    needsStage: "shop",
  },
  {
    id: "cool-box",
    name: "Cool box",
    detail: "Carries more stock.",
    cost: COOL_BOX_COST,
    needsReputation: COOL_BOX_REPUTATION,
  },
]

export function stageIndex(id: StageId): number {
  return stages.findIndex((stage) => stage.id === id)
}

export function nextStage(id: StageId): Stage | null {
  const index = stageIndex(id)
  if (index < 0 || index >= stages.length - 1) return null
  return stages[index + 1]
}

export function isStageId(value: unknown): value is StageId {
  return stages.some((stage) => stage.id === value)
}

export function upgradeLock(
  item: QuickUpgrade,
  stageId: StageId,
  reputation: number,
): string | null {
  if (item.needsStage && stageIndex(stageId) < stageIndex(item.needsStage)) {
    const needed = stages.find((stage) => stage.id === item.needsStage)
    return `Needs a ${needed?.label ?? "later stage"}.`
  }
  if (item.needsReputation && reputation < item.needsReputation) {
    return `Needs reputation ${item.needsReputation}.`
  }
  return null
}
