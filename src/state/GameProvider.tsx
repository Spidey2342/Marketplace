import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react"
import { bodyTypes, hairs, outfits, shoes, skinTones } from "@/data/avatar"
import { groups } from "@/data/groups"
import { currentChallenge, NOTE_MAX, weekId } from "@/data/challenges"
import {
  BUY_COOLDOWN_MS,
  BUY_QTY_MAX,
  BUY_QTY_MIN,
  BUY_THANKS,
  DAILY_STALL_REP_CAP,
  dayKey,
  EXPLORER_BADGE,
  EXPLORER_COINS,
  EXPLORER_STALLS,
  FIRST_STALL_REPUTATION,
  freshNpcMarket,
  freshNpcStock,
  npcByStall,
  type NpcLine,
} from "@/data/visits"
import { isUnlocked, productById, products, slotLimit } from "@/data/products"
import {
  arrivalRate,
  bulkCost,
  choiceDelayMs,
  CHOICE_TIMER_S,
  creditPayout,
  CREDIT_PAY_CHANCE,
  CREDIT_UNITS,
  eventForRound,
  isEventId,
  pickEvent,
  rollChoice,
  type ChoiceKind,
  type EventId,
} from "@/data/events"
import { AWNING_ID } from "@/data/upgrades"
import {
  isStageId,
  nextStage,
  quickUpgrades,
  upgradeLock,
  type StageId,
} from "@/data/upgrades"
import {
  clampPacks,
  clampPrice,
  contributionForProfit,
  customerTiming,
  emptyTypeCounts,
  fairPrice,
  cheapestUnlocked,
  freshStall,
  PACK_MIN,
  pushRegular,
  readShortRound,
  rollVisit,
  roundDurationMs,
  ROUND_DURATION_MS,
  selectedStockCost,
  settleStock,
  stockLeft,
  STARTING_COINS,
  summarizeRound,
  unitsOnTable,
  type Regular,
  type RoundResult,
  type StallLine,
  type TypeCounts,
} from "@/lib/economy"
import { sampleResult } from "@/lib/sample"
import type { Screen } from "@/lib/screen"
import { playerSpawn } from "@/data/townLayout"
import { randomTag } from "@/lib/handle"
import { isUuid } from "@/lib/sync"

export type ProofChoice = "none" | "photo" | "receipt" | "note" | "pending"

export type SaleToast = {
  id: number
  buyer: string
  productName: string
  line: string
  price: number
}

export type GameState = {
  coins: number
  avatarName: string
  avatarTag: number | null
  nicknameChangedAt: number | null
  hairId: string
  outfitId: string
  shoeId: string
  skinToneId: string
  bodyTypeId: string
  profileComplete: boolean
  groupId: string | null
  stall: StallLine[]
  roundStatus: "idle" | "running" | "ended"
  roundEndsAt: number | null
  lastCustomerAt: number | null
  customers: number
  roundRevenue: number
  roundStockCost: number
  soldOutEarly: boolean
  lastSale: SaleToast | null
  saleSeq: number
  lastResult: RoundResult | null
  roundsPlayed: number
  reputation: number
  proof: ProofChoice
  hasStocked: boolean
  roundProfits: number[]
  weekContribution: number
  challengesCompleted: number
  completedWeeks: number[]
  challengeNote: string
  passportSell: string
  passportBuyers: string
  passportStart: string
  itemUnits: number[]
  marginSum: number
  itemsSoldTotal: number
  buyerTotals: TypeCounts
  roundStockCosts: number[]
  stageId: StageId
  ownedUpgrades: string[]
  showResults: boolean
  shortRound: boolean
  joystick: { x: number; y: number }
  speech: string | null
  emote: string | null
  playerX: number
  playerZ: number
  saleRevealId: number
  regulars: Regular[]
  pendingRegulars: Regular[]
  regularsSeen: string[]
  typeCounts: TypeCounts
  roundEvent: EventId
  forecast: EventId | null
  choiceKind: ChoiceKind | null
  choiceAt: number | null
  choiceDeadline: number | null
  choiceOpen: boolean
  bulkUnits: number
  bulkProductId: number | null
  credit: {
    productId: number
    units: number
    unitPrice: number
    paid: boolean | null
    payout: number
  } | null
  friendsRoom: string | null
  syncNote: string | null
  npcStock: Record<string, NpcLine[]>
  scouted: { stallId: string; round: number; prices: { productId: number; price: number }[] }[]
  fairVotes: { stallId: string; productId: number; round: number; fair: boolean }[]
  fairPending: { stallId: string; productId: number; round: number } | null
  visitRepDay: string
  visitRepStalls: string[]
  visitRepCount: number
  explorerWeek: number
  explorerStalls: string[]
  explorerClaimed: boolean
  roundBoughtItems: number
  roundBoughtSpend: number
  badges: string[]
  lastBuyAt: number
  buyFlash: { stallId: string; productId: number; text: string } | null
  freeStarterUsed: boolean
  coachSeen: boolean
}

type Action =
  | { type: "toggleProduct"; productId: number }
  | { type: "setPrice"; productId: number; price: number }
  | { type: "openStall"; now: number; free?: boolean }
  | { type: "dismissCoach" }
  | { type: "tick"; now: number }
  | { type: "endRound"; now: number }
  | { type: "acknowledgeResults" }
  | { type: "setAvatarName"; name: string }
  | {
      type: "applyNickname"
      nickname: string
      tag: number
      nicknameChangedAt: number | null
    }
  | { type: "setHair"; id: string }
  | { type: "setOutfit"; id: string }
  | { type: "setShoes"; id: string }
  | { type: "setSkinTone"; id: string }
  | { type: "setBodyType"; id: string }
  | { type: "setGroup"; id: string }
  | { type: "setFriendsRoom"; code: string | null }
  | { type: "setSyncNote"; note: string | null }
  | { type: "applyServerScores"; coins: number; reputation: number }
  | {
      type: "hydrateProfile"
      nickname: string
      tag: number
      nicknameChangedAt: number | null
      hairId: string
      outfitId: string
      shoeId: string
      skinToneId: string
      bodyTypeId: string
      groupId: string | null
      coins: number
      reputation: number
      stage: string
    }
  | { type: "completeProfile" }
  | {
      type: "applyRemoteAccount"
      nickname: string
      tag: number
      nicknameChangedAt: number | null
      hairId: string
      outfitId: string
      shoeId: string
      skinToneId: string
      bodyTypeId: string
      groupId: string | null
      coins: number
      reputation: number
      stage: string
      stall: StallLine[]
      ownedUpgrades: string[]
      regulars: Regular[]
    }
  | { type: "beginFreshGuest" }
  | { type: "buyStage" }
  | { type: "buyUpgrade"; id: string }
  | { type: "applySample"; screen: Screen }
  | { type: "setProof"; proof: ProofChoice }
  | { type: "setChallengeNote"; note: string }
  | { type: "approveChallenge"; now: number }
  | {
      type: "setPassport"
      field: "passportSell" | "passportBuyers" | "passportStart"
      value: string
    }
  | { type: "setJoystick"; x: number; y: number }
  | { type: "setSpeech"; text: string }
  | { type: "setEmote"; label: string }
  | { type: "clearBubble" }
  | { type: "setPlayerPose"; x: number; z: number }
  | { type: "revealSale"; id: number }
  | {
      type: "scoutStall"
      stallId: string
      round: number
      prices: { productId: number; price: number }[]
    }
  | { type: "buyFromNpc"; stallId: string; productId: number; qty: number; now: number }
  | {
      type: "boughtRemote"
      stallId: string
      productId: number
      qty: number
      spend: number
      coins: number
      now: number
    }
  | { type: "holdBuy"; now: number }
  | { type: "rateStall"; fair: boolean }
  | {
      type: "notePlayerSale"
      id: string
      buyer: string
      price: number
      qty: number
      productName: string
    }
  | {
      type: "applyStallStock"
      items: { productId: number; price: number; stock: number }[]
    }
  | { type: "setPacks"; productId: number; packs: number }
  | { type: "setEvent"; id: EventId }
  | { type: "forceChoice"; kind: ChoiceKind }
  | { type: "resolveChoice"; take: boolean; now: number }

let boundDispatch: Dispatch<Action> | null = null

export function bindDispatch(dispatch: Dispatch<Action> | null) {
  boundDispatch = dispatch
}

export function sendAction(action: Action) {
  boundDispatch?.(action)
}

const STORAGE_KEY = "market-street"

function freshState(): GameState {
  return {
    coins: STARTING_COINS,
    avatarName: "",
    avatarTag: null,
    nicknameChangedAt: null,
    hairId: hairs[0].id,
    outfitId: outfits[0].id,
    shoeId: shoes[0].id,
    skinToneId: skinTones[3].id,
    bodyTypeId: bodyTypes[1].id,
    profileComplete: false,
    groupId: null,
    stall: freshStall(),
    roundStatus: "idle",
    roundEndsAt: null,
    lastCustomerAt: null,
    customers: 0,
    roundRevenue: 0,
    roundStockCost: 0,
    soldOutEarly: false,
    lastSale: null,
    saleSeq: 0,
    lastResult: null,
    roundsPlayed: 0,
    reputation: 0,
    proof: "none",
    hasStocked: false,
    roundProfits: [],
    weekContribution: 0,
    challengesCompleted: 0,
    completedWeeks: [],
    challengeNote: "",
    passportSell: "",
    passportBuyers: "",
    passportStart: "",
    itemUnits: products.map(() => 0),
    marginSum: 0,
    itemsSoldTotal: 0,
    buyerTotals: emptyTypeCounts(),
    roundStockCosts: [],
    stageId: "stall",
    ownedUpgrades: [],
    showResults: false,
    shortRound: readShortRound(),
    joystick: { x: 0, y: 0 },
    speech: null,
    emote: null,
    playerX: playerSpawn().x,
    playerZ: playerSpawn().z,
    saleRevealId: 0,
    regulars: [],
    pendingRegulars: [],
    regularsSeen: [],
    typeCounts: emptyTypeCounts(),
    roundEvent: "calm",
    forecast: null,
    choiceKind: null,
    choiceAt: null,
    choiceDeadline: null,
    choiceOpen: false,
    bulkUnits: 0,
    bulkProductId: null,
    credit: null,
    friendsRoom: null,
    syncNote: null,
    npcStock: freshNpcMarket(0),
    scouted: [],
    fairVotes: [],
    fairPending: null,
    visitRepDay: "",
    visitRepStalls: [],
    visitRepCount: 0,
    explorerWeek: weekId(Date.now()),
    explorerStalls: [],
    explorerClaimed: false,
    roundBoughtItems: 0,
    roundBoughtSpend: 0,
    badges: [],
    lastBuyAt: 0,
    buyFlash: null,
    freeStarterUsed: false,
    coachSeen: false,
  }
}

const GROUP_CODE = /^code:[A-Z0-9]{4,8}$/

function knownGroup(id: string): boolean {
  return groups.some((group) => group.id === id) || isUuid(id) || GROUP_CODE.test(id)
}

function mergeStall(saved: StallLine[] | undefined, stageId: StageId): StallLine[] {
  const base = freshStall()
  const merged = !Array.isArray(saved)
    ? base
    : base.map((line) => {
        const match = saved.find((item) => item.productId === line.productId)
        if (!match) return line
        return {
          productId: line.productId,
          price: clampPrice(Number(match.price) || line.price),
          selected: Boolean(match.selected),
          sold: Math.max(0, Number(match.sold) || 0),
          packs: clampPacks(Number(match.packs) || PACK_MIN),
          carried: Math.max(0, Number(match.carried) || 0),
          opened: Math.max(0, Number(match.opened) || 0),
        }
      })
  return clampSelection(merged, stageId)
}

function clampSelection(stall: StallLine[], stageId: StageId): StallLine[] {
  const limit = slotLimit(stageId)
  const open = stall.map((line) => {
    const product = productById(line.productId)
    if (line.selected && !isUnlocked(product, stageId)) return { ...line, selected: false }
    return line
  })
  const keep = new Set(
    open
      .filter((line) => line.selected)
      .sort((a, b) => a.productId - b.productId)
      .slice(0, limit)
      .map((line) => line.productId),
  )
  return open.map((line) =>
    line.selected && !keep.has(line.productId) ? { ...line, selected: false } : line,
  )
}

function readRegulars(value: unknown): Regular[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is Regular =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as Regular).name === "string" &&
        typeof (item as Regular).productId === "number",
    )
    .slice(-3)
}

function readCredit(value: unknown): GameState["credit"] {
  if (!value || typeof value !== "object") return null
  const credit = value as GameState["credit"]
  if (!credit || typeof credit.productId !== "number") return null
  return {
    productId: credit.productId,
    units: Math.max(0, Number(credit.units) || 0),
    unitPrice: Math.max(0, Number(credit.unitPrice) || 0),
    paid: typeof credit.paid === "boolean" ? credit.paid : null,
    payout: Math.max(0, Number(credit.payout) || 0),
  }
}

function readUnits(value: unknown): number[] {
  const units = products.map(() => 0)
  if (!Array.isArray(value)) return units
  return units.map((fallback, index) => Math.max(0, Number(value[index]) || fallback))
}

function readCounts(value: unknown): TypeCounts {
  const blank = emptyTypeCounts()
  if (!value || typeof value !== "object") return blank
  const source = value as Partial<TypeCounts>
  return {
    student: Math.max(0, Number(source.student) || 0),
    worker: Math.max(0, Number(source.worker) || 0),
    visitor: Math.max(0, Number(source.visitor) || 0),
    regular: Math.max(0, Number(source.regular) || 0),
    player: Math.max(0, Number(source.player) || 0),
  }
}

function readNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string").slice(0, 24)
}

function readNpcStock(value: unknown): Record<string, NpcLine[]> {
  if (!value || typeof value !== "object") return freshNpcMarket(0)
  const market: Record<string, NpcLine[]> = {}
  for (const [stallId, lines] of Object.entries(value)) {
    if (!Array.isArray(lines)) continue
    const parsed = lines
      .map((line) => {
        if (!line || typeof line !== "object") return null
        const row = line as Partial<NpcLine>
        const productId = Number(row.productId)
        if (!Number.isFinite(productId)) return null
        return {
          productId,
          price: Math.max(0, Number(row.price) || 0),
          units: Math.max(0, Number(row.units) || 0),
        }
      })
      .filter((line): line is NpcLine => line !== null)
    if (parsed.length > 0) market[stallId] = parsed
  }
  return Object.keys(market).length > 0 ? market : freshNpcMarket(0)
}

function readScouted(value: unknown): GameState["scouted"] {
  if (!Array.isArray(value)) return []
  return value
    .map((note) => {
      if (!note || typeof note !== "object") return null
      const row = note as GameState["scouted"][number]
      if (typeof row.stallId !== "string" || !Array.isArray(row.prices)) return null
      return {
        stallId: row.stallId,
        round: Math.max(0, Number(row.round) || 0),
        prices: row.prices
          .filter((price) => price && typeof price.productId === "number")
          .map((price) => ({
            productId: price.productId,
            price: Math.max(0, Number(price.price) || 0),
          })),
      }
    })
    .filter((note): note is GameState["scouted"][number] => note !== null)
    .slice(-48)
}

function readFairVotes(value: unknown): GameState["fairVotes"] {
  if (!Array.isArray(value)) return []
  return value
    .map((vote) => {
      if (!vote || typeof vote !== "object") return null
      const row = vote as GameState["fairVotes"][number]
      if (typeof row.stallId !== "string") return null
      return {
        stallId: row.stallId,
        productId: Number(row.productId) || 0,
        round: Math.max(0, Number(row.round) || 0),
        fair: Boolean(row.fair),
      }
    })
    .filter((vote): vote is GameState["fairVotes"][number] => vote !== null)
    .slice(-80)
}

function readFairPending(value: unknown): GameState["fairPending"] {
  if (!value || typeof value !== "object") return null
  const row = value as NonNullable<GameState["fairPending"]>
  if (typeof row.stallId !== "string") return null
  return {
    stallId: row.stallId,
    productId: Number(row.productId) || 0,
    round: Math.max(0, Number(row.round) || 0),
  }
}

function loadState(): GameState {
  const blank = freshState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return blank
    const parsed = JSON.parse(raw) as Partial<GameState>
    if (typeof parsed.coins !== "number" || !Array.isArray(parsed.stall)) {
      return blank
    }
    const loaded: GameState = {
      ...blank,
      coins: Math.max(0, parsed.coins),
      avatarName:
        typeof parsed.avatarName === "string"
          ? parsed.avatarName.slice(0, 16)
          : blank.avatarName,
      avatarTag:
        typeof parsed.avatarTag === "number" &&
        parsed.avatarTag >= 1000 &&
        parsed.avatarTag <= 9999
          ? Math.trunc(parsed.avatarTag)
          : blank.avatarTag,
      nicknameChangedAt:
        typeof parsed.nicknameChangedAt === "number"
          ? parsed.nicknameChangedAt
          : blank.nicknameChangedAt,
      hairId: hairs.some((item) => item.id === parsed.hairId)
        ? String(parsed.hairId)
        : blank.hairId,
      outfitId: outfits.some((item) => item.id === parsed.outfitId)
        ? String(parsed.outfitId)
        : blank.outfitId,
      shoeId: shoes.some((item) => item.id === parsed.shoeId)
        ? String(parsed.shoeId)
        : blank.shoeId,
      skinToneId: skinTones.some((item) => item.id === parsed.skinToneId)
        ? String(parsed.skinToneId)
        : blank.skinToneId,
      bodyTypeId: bodyTypes.some((item) => item.id === parsed.bodyTypeId)
        ? String(parsed.bodyTypeId)
        : blank.bodyTypeId,
      profileComplete: Boolean(parsed.profileComplete),
      groupId:
        typeof parsed.groupId === "string" && knownGroup(parsed.groupId)
          ? parsed.groupId
          : null,
      friendsRoom:
        typeof parsed.friendsRoom === "string" && /^[A-Z0-9]{6}$/.test(parsed.friendsRoom)
          ? parsed.friendsRoom
          : null,
      stall: mergeStall(parsed.stall, isStageId(parsed.stageId) ? parsed.stageId : "stall"),
      roundStatus:
        parsed.roundStatus === "running" || parsed.roundStatus === "ended"
          ? parsed.roundStatus
          : "idle",
      roundEndsAt:
        typeof parsed.roundEndsAt === "number" ? parsed.roundEndsAt : null,
      lastCustomerAt:
        typeof parsed.lastCustomerAt === "number" ? parsed.lastCustomerAt : null,
      customers: Math.max(0, Number(parsed.customers) || 0),
      roundRevenue: Math.max(0, Number(parsed.roundRevenue) || 0),
      roundStockCost: Math.max(0, Number(parsed.roundStockCost) || 0),
      soldOutEarly: Boolean(parsed.soldOutEarly),
      saleSeq: Math.max(0, Number(parsed.saleSeq) || 0),
      lastResult: parsed.lastResult ?? null,
      roundsPlayed: Math.max(0, Number(parsed.roundsPlayed) || 0),
      reputation: Math.max(0, Number(parsed.reputation) || 0),
      proof:
        parsed.proof === "photo" ||
        parsed.proof === "receipt" ||
        parsed.proof === "note" ||
        parsed.proof === "pending"
          ? parsed.proof
          : "none",
      hasStocked: Boolean(parsed.hasStocked),
      freeStarterUsed: Boolean(parsed.freeStarterUsed),
      coachSeen: Boolean(parsed.coachSeen),
      roundProfits: Array.isArray(parsed.roundProfits)
        ? parsed.roundProfits.filter((value) => typeof value === "number")
        : [],
      weekContribution: Math.max(0, Number(parsed.weekContribution) || 0),
      challengesCompleted: Math.max(0, Number(parsed.challengesCompleted) || 0),
      completedWeeks: Array.isArray(parsed.completedWeeks)
        ? parsed.completedWeeks.filter((value): value is number => typeof value === "number")
        : [],
      challengeNote: typeof parsed.challengeNote === "string" ? parsed.challengeNote.slice(0, NOTE_MAX) : "",
      passportSell: typeof parsed.passportSell === "string" ? parsed.passportSell.slice(0, NOTE_MAX) : "",
      passportBuyers:
        typeof parsed.passportBuyers === "string" ? parsed.passportBuyers.slice(0, NOTE_MAX) : "",
      passportStart:
        typeof parsed.passportStart === "string" ? parsed.passportStart.slice(0, NOTE_MAX) : "",
      itemUnits: readUnits(parsed.itemUnits),
      marginSum: Math.max(0, Number(parsed.marginSum) || 0),
      itemsSoldTotal: Math.max(0, Number(parsed.itemsSoldTotal) || 0),
      buyerTotals: readCounts(parsed.buyerTotals),
      roundStockCosts: Array.isArray(parsed.roundStockCosts)
        ? parsed.roundStockCosts.filter((value): value is number => typeof value === "number")
        : [],
      stageId: isStageId(parsed.stageId) ? parsed.stageId : "stall",
      ownedUpgrades: Array.isArray(parsed.ownedUpgrades)
        ? parsed.ownedUpgrades.filter(
            (id): id is string =>
              typeof id === "string" &&
              quickUpgrades.some((item) => item.id === id),
          )
        : [],
      shortRound: Boolean(parsed.shortRound),
      showResults: false,
      lastSale: null,
      regulars: readRegulars(parsed.regulars),
      pendingRegulars: readRegulars(parsed.pendingRegulars),
      regularsSeen: Array.isArray(parsed.regularsSeen)
        ? parsed.regularsSeen.filter((name): name is string => typeof name === "string")
        : [],
      typeCounts: readCounts(parsed.typeCounts),
      roundEvent: isEventId(parsed.roundEvent) ? parsed.roundEvent : "calm",
      forecast: isEventId(parsed.forecast) ? parsed.forecast : null,
      choiceKind:
        parsed.choiceKind === "bulk" || parsed.choiceKind === "credit"
          ? parsed.choiceKind
          : null,
      choiceAt: typeof parsed.choiceAt === "number" ? parsed.choiceAt : null,
      choiceDeadline:
        typeof parsed.choiceDeadline === "number" ? parsed.choiceDeadline : null,
      choiceOpen: Boolean(parsed.choiceOpen),
      bulkUnits: Math.max(0, Number(parsed.bulkUnits) || 0),
      bulkProductId:
        typeof parsed.bulkProductId === "number" ? parsed.bulkProductId : null,
      credit: readCredit(parsed.credit),
      npcStock: readNpcStock(parsed.npcStock),
      scouted: readScouted(parsed.scouted),
      fairVotes: readFairVotes(parsed.fairVotes),
      fairPending: readFairPending(parsed.fairPending),
      visitRepDay: typeof parsed.visitRepDay === "string" ? parsed.visitRepDay : "",
      visitRepStalls: readNames(parsed.visitRepStalls),
      visitRepCount: Math.max(0, Number(parsed.visitRepCount) || 0),
      explorerWeek: Math.max(0, Number(parsed.explorerWeek) || weekId(Date.now())),
      explorerStalls: readNames(parsed.explorerStalls),
      explorerClaimed: Boolean(parsed.explorerClaimed),
      roundBoughtItems: Math.max(0, Number(parsed.roundBoughtItems) || 0),
      roundBoughtSpend: Math.max(0, Number(parsed.roundBoughtSpend) || 0),
      badges: readNames(parsed.badges),
    }
    if (
      loaded.roundStatus === "running" &&
      loaded.roundEndsAt !== null &&
      loaded.roundEndsAt <= Date.now()
    ) {
      return finishRound(loaded)
    }
    if (loaded.roundStatus !== "running") {
      loaded.shortRound = readShortRound()
    }
    return loaded
  } catch {
    return blank
  }
}

function saveState(state: GameState) {
  try {
    const {
      showResults,
      lastSale,
      joystick,
      speech,
      emote,
      playerX,
      playerZ,
      saleRevealId,
      syncNote,
      lastBuyAt,
      buyFlash,
      ...rest
    } = state
    void syncNote
    void lastBuyAt
    void buyFlash
    void playerX
    void playerZ
    void saleRevealId
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    // Storage can be blocked. The round still plays in memory.
  }
}

function finishRound(state: GameState): GameState {
  if (state.roundStatus === "ended" && state.lastResult) {
    return { ...state, showResults: true }
  }
  const paidCredit = settleCredit(state)
  const settled = settleStock(paidCredit.stall)
  const result = summarizeRound({
    stall: paidCredit.stall,
    customers: state.customers,
    revenue: paidCredit.revenue,
    stockCost: state.roundStockCost,
    soldOutEarly: state.soldOutEarly,
    roundsPlayed: state.roundsPlayed,
    avatarName: state.avatarName,
    buyers: state.typeCounts,
    spoiled: settled.spoiled,
    event: state.roundEvent,
    awning: state.ownedUpgrades.includes(AWNING_ID),
    creditLine: paidCredit.creditLine,
    boughtItems: state.roundBoughtItems,
    boughtSpend: state.roundBoughtSpend,
  })
  return {
    ...state,
    roundStatus: "ended",
    roundEndsAt: null,
    lastResult: result,
    roundsPlayed: state.roundsPlayed + 1,
    reputation: state.reputation + result.reputationChange,
    roundProfits: [...state.roundProfits, result.profit],
    weekContribution:
      state.weekContribution + contributionForProfit(result.profit),
    showResults: true,
    lastSale: null,
    itemUnits: addUnits(state.itemUnits, paidCredit.stall),
    marginSum: state.marginSum + marginOf(paidCredit.stall),
    itemsSoldTotal:
      state.itemsSoldTotal + paidCredit.stall.reduce((sum, line) => sum + line.sold, 0),
    buyerTotals: {
      student: state.buyerTotals.student + state.typeCounts.student,
      worker: state.buyerTotals.worker + state.typeCounts.worker,
      visitor: state.buyerTotals.visitor + state.typeCounts.visitor,
      regular: state.buyerTotals.regular + state.typeCounts.regular,
      player: state.buyerTotals.player + state.typeCounts.player,
    },
    roundStockCosts: [...state.roundStockCosts, state.roundStockCost],
    coins: paidCredit.coins,
    stall: settled.stall,
    credit: paidCredit.credit,
    choiceOpen: false,
    choiceKind: null,
    choiceDeadline: null,
    regulars: state.pendingRegulars,
    pendingRegulars: [],
    regularsSeen: [],
    typeCounts: emptyTypeCounts(),
    roundBoughtItems: 0,
    roundBoughtSpend: 0,
  }
}

function addUnits(units: number[], stall: StallLine[]): number[] {
  return units.map((count, index) => {
    const line = stall.find((item) => item.productId === index + 1)
    return count + (line?.sold ?? 0)
  })
}

function marginOf(stall: StallLine[]): number {
  return stall.reduce((sum, line) => {
    const product = productById(line.productId)
    return sum + (line.price - product.unitCost) * line.sold
  }, 0)
}

function settleCredit(state: GameState): {
  stall: StallLine[]
  coins: number
  revenue: number
  credit: GameState["credit"]
  creditLine: string | null
} {
  const credit = state.credit
  if (!credit || credit.paid !== null) {
    return {
      stall: state.stall,
      coins: state.coins,
      revenue: state.roundRevenue,
      credit,
      creditLine: null,
    }
  }
  const paid = Math.random() < CREDIT_PAY_CHANCE
  const payout = paid ? creditPayout(credit.units, credit.unitPrice) : 0
  const product = productById(credit.productId)
  const name = product.name.toLowerCase()
  return {
    stall: state.stall,
    coins: state.coins + payout,
    revenue: state.roundRevenue + payout,
    credit: { ...credit, paid, payout },
    creditLine: paid
      ? `Your friend paid ¢${payout} for the ${name}, with a little extra.`
      : `Your friend never paid for the ${name}.`,
  }
}

function stockedLine(stall: StallLine[], minimum: number): StallLine | null {
  const ready = stall.filter((line) => line.selected && stockLeft(line) >= minimum)
  if (ready.length === 0) return null
  return ready.reduce((best, line) => (stockLeft(line) > stockLeft(best) ? line : best))
}

function openChoice(state: GameState, now: number): GameState {
  if (!state.choiceKind || state.choiceOpen) return state
  const minimum = state.choiceKind === "credit" ? CREDIT_UNITS : 1
  const line = stockedLine(state.stall, minimum)
  if (!line) {
    return { ...state, choiceKind: null, choiceAt: null }
  }
  return {
    ...state,
    choiceOpen: true,
    choiceDeadline: now + CHOICE_TIMER_S * 1000,
    bulkProductId: line.productId,
  }
}

function takeChoice(state: GameState): GameState {
  const productId = state.bulkProductId
  const product = productId ? products.find((item) => item.id === productId) : undefined
  const line = state.stall.find((item) => item.productId === productId)
  if (!state.choiceKind || !product || !line) {
    return { ...state, choiceOpen: false, choiceKind: null, choiceDeadline: null }
  }
  if (state.choiceKind === "bulk") {
    const cost = bulkCost(product.cost)
    const adding = stockLeft(line)
    if (adding <= 0 || state.coins < cost) return state
    return {
      ...state,
      coins: state.coins - cost,
      roundStockCost: state.roundStockCost + cost,
      stall: state.stall.map((item) =>
        item.productId === product.id
          ? { ...item, opened: item.opened + adding }
          : item,
      ),
      bulkUnits: adding,
      bulkProductId: product.id,
      choiceOpen: false,
      choiceKind: null,
      choiceDeadline: null,
    }
  }
  if (stockLeft(line) < CREDIT_UNITS) return state
  return {
    ...state,
    stall: state.stall.map((item) =>
      item.productId === product.id ? { ...item, sold: item.sold + CREDIT_UNITS } : item,
    ),
    credit: {
      productId: product.id,
      units: CREDIT_UNITS,
      unitPrice: line.price,
      paid: null,
      payout: 0,
    },
    choiceOpen: false,
    choiceKind: null,
    choiceDeadline: null,
  }
}

function roundProgress(state: GameState, now: number): number {
  if (state.roundEndsAt === null) return 0
  const duration = roundDurationMs(state.shortRound)
  const start = state.roundEndsAt - duration
  if (duration <= 0) return 1
  return Math.min(1, Math.max(0, (now - start) / duration))
}

function applyCustomer(state: GameState, now: number): GameState {
  const visit = rollVisit(
    state.stall,
    roundProgress(state, now),
    state.regulars,
    state.regularsSeen,
    Math.random,
    state.roundEvent,
    state.ownedUpgrades.includes(AWNING_ID),
  )
  if (visit.kind === "sold-out") {
    return { ...state, soldOutEarly: true, lastCustomerAt: now }
  }
  if (visit.kind !== "visit") return { ...state, lastCustomerAt: now }
  const boughtPeople =
    visit.type === "visitor" ? (visit.purchases.length > 0 ? 1 : 0) : visit.purchases.length
  const typeCounts = {
    ...state.typeCounts,
    [visit.type]: state.typeCounts[visit.type] + boughtPeople,
  }
  let stall = state.stall.map((line) => ({ ...line }))
  let coins = state.coins
  let revenue = state.roundRevenue
  let saleSeq = state.saleSeq
  let lastSale = state.lastSale
  let pending = state.pendingRegulars
  for (const purchase of visit.purchases) {
    stall = stall.map((line) =>
      line.productId === purchase.productId
        ? { ...line, sold: line.sold + 1 }
        : line,
    )
    coins += purchase.price
    revenue += purchase.price
    saleSeq += 1
    lastSale = {
      id: saleSeq,
      buyer: purchase.buyer,
      productName: purchase.productName,
      line: purchase.line,
      price: purchase.price,
    }
    const product = productById(purchase.productId)
    if (fairPrice(purchase.price, product.neighborPrice)) {
      pending = pushRegular(pending, {
        name: purchase.buyer,
        productId: purchase.productId,
      })
    }
  }
  const stillStocked = stall.some((line) => line.selected && stockLeft(line) > 0)
  const seen =
    visit.type === "regular" && !state.regularsSeen.includes(visit.buyer)
      ? [...state.regularsSeen, visit.buyer]
      : state.regularsSeen
  return {
    ...state,
    customers: state.customers + visit.people,
    lastCustomerAt: now,
    typeCounts,
    stall,
    coins,
    roundRevenue: revenue,
    saleSeq,
    lastSale: visit.purchases.length > 0 ? lastSale : state.lastSale,
    pendingRegulars: pending,
    regularsSeen: seen,
    soldOutEarly: state.soldOutEarly || !stillStocked,
  }
}

function applySample(state: GameState, screen: Screen): GameState {
  const next: GameState = {
    ...state,
    avatarName: state.avatarName.trim() ? state.avatarName : "Ama",
    groupId: state.groupId ?? "block-a",
    stall: (state.stall.some((line) => line.selected) ? state.stall : freshStall()).map(
      (line) => ({
        ...line,
        opened: line.selected ? Math.max(line.opened, unitsOnTable(line)) : line.opened,
      }),
    ),
    lastResult: state.lastResult ?? sampleResult,
  }
  if (screen === "town" && next.roundStatus !== "running") {
    const now = Date.now()
    return {
      ...next,
      profileComplete: true,
      hasStocked: true,
      roundStatus: "running",
      roundEndsAt: now + ROUND_DURATION_MS,
      lastCustomerAt: now,
      customers: 0,
      roundRevenue: 0,
      roundStockCost: selectedStockCost(next.stall),
    }
  }
  if (screen === "setup") {
    return {
      ...next,
      profileComplete: true,
      roundStatus: "idle",
      roundEndsAt: null,
      showResults: false,
    }
  }
  if (screen === "results") {
    return {
      ...next,
      profileComplete: true,
      roundStatus: "ended",
      roundEndsAt: null,
      showResults: false,
    }
  }
  if (screen !== "home" && screen !== "avatar") {
    return { ...next, profileComplete: true }
  }
  return next
}

function grantVisit(
  state: GameState,
  action: {
    stallId: string
    productId: number
    qty: number
    spend: number
    now: number
    coins: number
  },
): GameState {
  const day = dayKey(action.now)
  const sameDay = state.visitRepDay === day
  let visitRepStalls = sameDay ? state.visitRepStalls : []
  let visitRepCount = sameDay ? state.visitRepCount : 0
  let reputation = state.reputation
  if (!visitRepStalls.includes(action.stallId) && visitRepCount < DAILY_STALL_REP_CAP) {
    visitRepStalls = [...visitRepStalls, action.stallId]
    visitRepCount += 1
    reputation += FIRST_STALL_REPUTATION
  }

  const week = weekId(action.now)
  const sameWeek = state.explorerWeek === week
  let explorerStalls = sameWeek ? [...state.explorerStalls] : []
  let explorerClaimed = sameWeek ? state.explorerClaimed : false
  if (!explorerStalls.includes(action.stallId)) explorerStalls = [...explorerStalls, action.stallId]
  let coins = action.coins
  let badges = state.badges
  let challengesCompleted = state.challengesCompleted
  if (!explorerClaimed && explorerStalls.length >= EXPLORER_STALLS) {
    explorerClaimed = true
    coins += EXPLORER_COINS
    challengesCompleted += 1
    if (!badges.includes(EXPLORER_BADGE)) badges = [...badges, EXPLORER_BADGE]
  }

  return {
    ...state,
    coins,
    reputation,
    lastBuyAt: action.now,
    roundBoughtItems: state.roundBoughtItems + action.qty,
    roundBoughtSpend: state.roundBoughtSpend + action.spend,
    visitRepDay: day,
    visitRepStalls,
    visitRepCount,
    explorerWeek: week,
    explorerStalls,
    explorerClaimed,
    badges,
    challengesCompleted,
    buyFlash: { stallId: action.stallId, productId: action.productId, text: BUY_THANKS },
    fairPending: { stallId: action.stallId, productId: action.productId, round: state.roundsPlayed },
    emote: productById(action.productId).praise,
    speech: null,
  }
}

function buyFromNpc(
  state: GameState,
  action: { stallId: string; productId: number; qty: number; now: number },
): GameState {
  if (!npcByStall(action.stallId)) return state
  if (action.qty < BUY_QTY_MIN || action.qty > BUY_QTY_MAX) return state
  if (action.now - state.lastBuyAt < BUY_COOLDOWN_MS) return state
  const stock = state.npcStock[action.stallId] ?? freshNpcStock(action.stallId, state.roundsPlayed)
  const line = stock.find((item) => item.productId === action.productId)
  if (!line || line.units < action.qty) return state
  const spend = line.price * action.qty
  if (spend > state.coins) return state
  const next = grantVisit(state, {
    ...action,
    spend,
    coins: state.coins - spend,
  })
  return {
    ...next,
    npcStock: {
      ...state.npcStock,
      [action.stallId]: stock.map((item) =>
        item.productId === line.productId ? { ...item, units: item.units - action.qty } : item,
      ),
    },
  }
}

function notePlayerSale(
  state: GameState,
  action: { id: string; buyer: string; price: number; qty: number; productName: string },
): GameState {
  const saleSeq = state.saleSeq + 1
  return {
    ...state,
    coins: state.coins + action.price * action.qty,
    customers: state.customers + 1,
    saleSeq,
    typeCounts: { ...state.typeCounts, player: state.typeCounts.player + 1 },
    lastSale: {
      id: saleSeq,
      buyer: action.buyer,
      productName: action.productName,
      line: "Sharp, thanks!",
      price: action.price * action.qty,
    },
  }
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "toggleProduct": {
      if (state.roundStatus === "running") return state
      const product = products.find((item) => item.id === action.productId)
      if (!product || !isUnlocked(product, state.stageId)) return state
      const current = state.stall.find((line) => line.productId === action.productId)
      if (!current) return state
      if (!current.selected) {
        const picked = state.stall.filter((line) => line.selected).length
        if (picked >= slotLimit(state.stageId)) return state
      }
      return {
        ...state,
        stall: state.stall.map((line) =>
          line.productId === action.productId
            ? { ...line, selected: !line.selected }
            : line,
        ),
      }
    }
    case "setPrice": {
      if (state.roundStatus === "running") return state
      return {
        ...state,
        stall: state.stall.map((line) =>
          line.productId === action.productId
            ? { ...line, price: clampPrice(action.price) }
            : line,
        ),
      }
    }
    case "openStall": {
      if (state.roundStatus === "running") return state
      const free = Boolean(action.free)
      let stall = state.stall
      if (free) {
        const gift = cheapestUnlocked(state.stageId)
        if (!gift) return state
        stall = stall.map((line) => ({
          ...line,
          selected: line.productId === gift.id,
          packs: line.productId === gift.id ? PACK_MIN : line.packs,
        }))
      }
      const cost = free ? 0 : selectedStockCost(stall)
      const selected = stall.some((line) => line.selected)
      if (!selected || cost > state.coins) return state
      const shortRound = state.shortRound || readShortRound()
      const choiceKind = rollChoice(Math.random)
      const duration = roundDurationMs(shortRound)
      return {
        ...state,
        coins: state.coins - cost,
        freeStarterUsed: state.freeStarterUsed || free,
        stall: stall.map((line) => ({
          ...line,
          sold: 0,
          opened: line.selected ? unitsOnTable(line) : 0,
        })),
        roundStatus: "running",
        roundEndsAt: action.now + duration,
        lastCustomerAt: action.now,
        customers: 0,
        roundRevenue: 0,
        roundStockCost: cost,
        soldOutEarly: false,
        lastSale: null,
        showResults: false,
        hasStocked: true,
        shortRound,
        pendingRegulars: [],
        regularsSeen: [],
        typeCounts: emptyTypeCounts(),
        roundEvent: eventForRound(state.roundsPlayed, state.forecast),
        forecast: pickEvent(Math.random),
        choiceKind,
        choiceAt: choiceKind ? action.now + choiceDelayMs(duration, Math.random) : null,
        choiceDeadline: null,
        choiceOpen: false,
        bulkUnits: 0,
        bulkProductId: null,
        credit: null,
        npcStock: freshNpcMarket(state.roundsPlayed),
        roundBoughtItems: 0,
        roundBoughtSpend: 0,
        buyFlash: null,
      }
    }
    case "scoutStall": {
      const seen = state.scouted.some(
        (note) => note.stallId === action.stallId && note.round === action.round,
      )
      if (seen || action.prices.length === 0) return state
      const scouted = [
        ...state.scouted,
        { stallId: action.stallId, round: action.round, prices: action.prices },
      ]
      return { ...state, scouted: scouted.slice(-48) }
    }
    case "holdBuy":
      return { ...state, lastBuyAt: action.now }
    case "buyFromNpc":
      return buyFromNpc(state, action)
    case "boughtRemote":
      return grantVisit(state, {
        ...action,
        coins:
          state.roundStatus === "running"
            ? Math.max(0, state.coins - action.spend)
            : action.coins,
      })
    case "rateStall": {
      if (!state.fairPending) return state
      return {
        ...state,
        fairVotes: [...state.fairVotes, { ...state.fairPending, fair: action.fair }],
        fairPending: null,
      }
    }
    case "notePlayerSale":
      return notePlayerSale(state, action)
    case "applyStallStock":
      return {
        ...state,
        stall: state.stall.map((line) => {
          const remote = action.items.find((item) => item.productId === line.productId)
          if (!remote) return line
          return {
            ...line,
            price: remote.price > 0 ? remote.price : line.price,
            opened: line.sold + Math.max(0, remote.stock),
          }
        }),
      }
    case "setPacks": {
      if (state.roundStatus === "running") return state
      return {
        ...state,
        stall: state.stall.map((line) =>
          line.productId === action.productId
            ? { ...line, packs: clampPacks(action.packs) }
            : line,
        ),
      }
    }
    case "tick": {
      if (state.roundStatus !== "running" || state.roundEndsAt === null) {
        return state
      }
      let next = state
      if (
        next.choiceKind &&
        !next.choiceOpen &&
        next.choiceAt !== null &&
        action.now >= next.choiceAt
      ) {
        next = openChoice(next, action.now)
      }
      if (next.choiceOpen && next.choiceDeadline !== null && action.now >= next.choiceDeadline) {
        next = { ...next, choiceOpen: false, choiceKind: null, choiceDeadline: null }
      }
      if (action.now >= next.roundEndsAt!) return finishRound(next)
      if (next.soldOutEarly) return next
      const timing = customerTiming(next.shortRound)
      const secondsLeft = Math.max(0, Math.ceil((next.roundEndsAt! - action.now) / 1000))
      const rate = arrivalRate(
        next.roundEvent,
        next.ownedUpgrades.includes(AWNING_ID),
        secondsLeft,
      )
      const base = next.customers === 0 ? timing.firstDelay : timing.interval
      const wait = base / Math.max(rate, 0.1)
      const since = next.lastCustomerAt ?? action.now
      if (action.now - since < wait) return next
      return applyCustomer(next, action.now)
    }
    case "setEvent":
      if (state.roundStatus === "running") {
        return { ...state, roundEvent: action.id }
      }
      return { ...state, forecast: action.id }
    case "forceChoice": {
      if (state.roundStatus !== "running") return state
      return openChoice(
        { ...state, choiceKind: action.kind, choiceAt: action.kind ? Date.now() : null, choiceOpen: false },
        Date.now(),
      )
    }
    case "resolveChoice":
      if (!state.choiceOpen) return state
      if (!action.take) {
        return { ...state, choiceOpen: false, choiceKind: null, choiceDeadline: null }
      }
      return takeChoice(state)
    case "endRound":
      if (state.roundStatus !== "running") return state
      return finishRound(state)
    case "acknowledgeResults":
      return { ...state, showResults: false }
    case "dismissCoach":
      return { ...state, coachSeen: true }
    case "setProof":
      return { ...state, proof: action.proof }
    case "setChallengeNote":
      return { ...state, challengeNote: action.note.slice(0, NOTE_MAX) }
    case "approveChallenge": {
      const id = weekId(action.now)
      if (state.completedWeeks.includes(id)) return state
      const challenge = currentChallenge(action.now)
      return {
        ...state,
        completedWeeks: [...state.completedWeeks, id],
        challengesCompleted: state.challengesCompleted + 1,
        coins: state.coins + challenge.rewardCoins,
        proof: "pending",
      }
    }
    case "setPassport":
      return { ...state, [action.field]: action.value.slice(0, NOTE_MAX) }
    case "setAvatarName":
      return { ...state, avatarName: action.name.slice(0, 16) }
    case "applyNickname":
      return {
        ...state,
        avatarName: action.nickname.slice(0, 16),
        avatarTag: action.tag,
        nicknameChangedAt: action.nicknameChangedAt,
      }
    case "setHair":
      return hairs.some((item) => item.id === action.id)
        ? { ...state, hairId: action.id }
        : state
    case "setOutfit":
      return outfits.some((item) => item.id === action.id)
        ? { ...state, outfitId: action.id }
        : state
    case "setShoes":
      return shoes.some((item) => item.id === action.id)
        ? { ...state, shoeId: action.id }
        : state
    case "setSkinTone":
      return skinTones.some((item) => item.id === action.id)
        ? { ...state, skinToneId: action.id }
        : state
    case "setBodyType":
      return bodyTypes.some((item) => item.id === action.id)
        ? { ...state, bodyTypeId: action.id }
        : state
    case "setGroup":
      return knownGroup(action.id) ? { ...state, groupId: action.id } : state
    case "setFriendsRoom":
      return {
        ...state,
        friendsRoom:
          action.code && /^[A-Z0-9]{6}$/.test(action.code) ? action.code : null,
      }
    case "setSyncNote":
      return { ...state, syncNote: action.note }
    case "applyServerScores":
      return {
        ...state,
        coins: Math.max(0, action.coins),
        reputation: Math.max(0, action.reputation),
        syncNote: null,
      }
    case "hydrateProfile": {
      if (state.roundStatus === "running") return state
      return {
        ...state,
        avatarName: action.nickname.slice(0, 16),
        avatarTag: action.tag >= 1000 && action.tag <= 9999 ? action.tag : state.avatarTag,
        nicknameChangedAt: action.nicknameChangedAt,
        hairId: hairs.some((item) => item.id === action.hairId) ? action.hairId : state.hairId,
        outfitId: outfits.some((item) => item.id === action.outfitId)
          ? action.outfitId
          : state.outfitId,
        shoeId: shoes.some((item) => item.id === action.shoeId) ? action.shoeId : state.shoeId,
        skinToneId: skinTones.some((item) => item.id === action.skinToneId)
          ? action.skinToneId
          : state.skinToneId,
        bodyTypeId: bodyTypes.some((item) => item.id === action.bodyTypeId)
          ? action.bodyTypeId
          : state.bodyTypeId,
        groupId: action.groupId && knownGroup(action.groupId) ? action.groupId : state.groupId,
        stageId: isStageId(action.stage) ? action.stage : state.stageId,
        profileComplete: action.nickname.trim().length >= 2,
        coins: state.profileComplete ? state.coins : Math.max(0, action.coins),
        reputation: state.profileComplete ? state.reputation : Math.max(0, action.reputation),
      }
    }
    case "completeProfile":
      return {
        ...state,
        profileComplete: true,
        avatarTag:
          state.avatarTag != null && state.avatarTag >= 1000 && state.avatarTag <= 9999
            ? state.avatarTag
            : randomTag(),
      }
    case "applyRemoteAccount": {
      if (state.roundStatus === "running") return state
      const stageId = isStageId(action.stage) ? action.stage : state.stageId
      return {
        ...state,
        avatarName: action.nickname.slice(0, 16),
        avatarTag: action.tag >= 1000 && action.tag <= 9999 ? action.tag : state.avatarTag,
        nicknameChangedAt: action.nicknameChangedAt,
        hairId: hairs.some((item) => item.id === action.hairId) ? action.hairId : state.hairId,
        outfitId: outfits.some((item) => item.id === action.outfitId)
          ? action.outfitId
          : state.outfitId,
        shoeId: shoes.some((item) => item.id === action.shoeId) ? action.shoeId : state.shoeId,
        skinToneId: skinTones.some((item) => item.id === action.skinToneId)
          ? action.skinToneId
          : state.skinToneId,
        bodyTypeId: bodyTypes.some((item) => item.id === action.bodyTypeId)
          ? action.bodyTypeId
          : state.bodyTypeId,
        groupId: action.groupId && knownGroup(action.groupId) ? action.groupId : state.groupId,
        stageId,
        profileComplete: action.nickname.trim().length >= 2,
        coins: Math.max(0, action.coins),
        reputation: Math.max(0, action.reputation),
        stall: clampSelection(action.stall, stageId),
        ownedUpgrades: action.ownedUpgrades.filter((id) =>
          quickUpgrades.some((item) => item.id === id),
        ),
        regulars: action.regulars,
        syncNote: null,
      }
    }
    case "beginFreshGuest":
      return {
        ...freshState(),
        coachSeen: state.coachSeen,
      }
    case "buyStage": {
      const upcoming = nextStage(state.stageId)
      if (!upcoming || !upcoming.purchasable || state.coins < upcoming.cost) {
        return state
      }
      return {
        ...state,
        coins: state.coins - upcoming.cost,
        stageId: upcoming.id,
      }
    }
    case "buyUpgrade": {
      const item = quickUpgrades.find((upgrade) => upgrade.id === action.id)
      if (!item || state.ownedUpgrades.includes(item.id)) return state
      if (upgradeLock(item, state.stageId, state.reputation)) return state
      if (state.coins < item.cost) return state
      return {
        ...state,
        coins: state.coins - item.cost,
        ownedUpgrades: [...state.ownedUpgrades, item.id],
      }
    }
    case "applySample":
      return applySample(state, action.screen)
    case "setJoystick":
      return {
        ...state,
        joystick: {
          x: Math.max(-1, Math.min(1, action.x)),
          y: Math.max(-1, Math.min(1, action.y)),
        },
      }
    case "setSpeech":
      return { ...state, speech: action.text, emote: null }
    case "setEmote":
      return { ...state, emote: action.label, speech: null }
    case "clearBubble":
      return { ...state, speech: null, emote: null }
    case "setPlayerPose":
      return { ...state, playerX: action.x, playerZ: action.z }
    case "revealSale":
      return { ...state, saleRevealId: action.id }
    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: Dispatch<Action>
} | null>(null)

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error("useGame must be used inside GameProvider")
  return value
}

export function challengeProgress(state: GameState): {
  label: string
  done: boolean
}[] {
  const stocked = state.hasStocked || state.roundsPlayed > 0
  return currentChallenge(Date.now()).steps.map((label, index) => ({
    label,
    done: index < 2 ? stocked : state.proof === "pending",
  }))
}

export default function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useLayoutEffect(() => {
    bindDispatch(dispatch)
    if (import.meta.env.DEV) {
      const host = window as Window & { __dispatch?: Dispatch<Action> }
      host.__dispatch = dispatch
    }
    return () => bindDispatch(null)
  }, [dispatch])

  useEffect(() => {
    saveState(state)
  }, [
    state.coins,
    state.avatarName,
    state.hairId,
    state.outfitId,
    state.shoeId,
    state.skinToneId,
    state.bodyTypeId,
    state.profileComplete,
    state.groupId,
    state.friendsRoom,
    state.stall,
    state.roundStatus,
    state.roundEndsAt,
    state.lastCustomerAt,
    state.customers,
    state.roundRevenue,
    state.roundStockCost,
    state.soldOutEarly,
    state.saleSeq,
    state.lastResult,
    state.roundsPlayed,
    state.reputation,
    state.proof,
    state.hasStocked,
    state.freeStarterUsed,
    state.coachSeen,
    state.roundProfits,
    state.weekContribution,
    state.challengesCompleted,
    state.completedWeeks,
    state.challengeNote,
    state.passportSell,
    state.passportBuyers,
    state.passportStart,
    state.itemUnits,
    state.marginSum,
    state.itemsSoldTotal,
    state.buyerTotals,
    state.roundStockCosts,
    state.stageId,
    state.ownedUpgrades,
    state.shortRound,
    state.regulars,
    state.pendingRegulars,
    state.regularsSeen,
    state.typeCounts,
    state.roundEvent,
    state.forecast,
    state.choiceKind,
    state.choiceAt,
    state.choiceDeadline,
    state.choiceOpen,
    state.bulkUnits,
    state.bulkProductId,
    state.credit,
    state.npcStock,
    state.scouted,
    state.fairVotes,
    state.fairPending,
    state.visitRepDay,
    state.visitRepStalls,
    state.visitRepCount,
    state.explorerWeek,
    state.explorerStalls,
    state.explorerClaimed,
    state.roundBoughtItems,
    state.roundBoughtSpend,
    state.badges,
  ])

  useEffect(() => {
    if (state.roundStatus !== "running") return
    const timer = window.setInterval(() => {
      dispatch({ type: "tick", now: Date.now() })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [state.roundStatus])

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}
