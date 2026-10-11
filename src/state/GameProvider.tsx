import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react"
import { weeklyChallenge } from "@/data/challenges"
import { productById } from "@/data/products"
import {
  clampPrice,
  contributionForProfit,
  customerTiming,
  freshStall,
  readShortRound,
  rollCustomer,
  roundDurationMs,
  selectedStockCost,
  STARTING_COINS,
  summarizeRound,
  type RoundResult,
  type StallLine,
} from "@/lib/economy"

export type ProofChoice = "none" | "photo" | "receipt" | "pending"

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
  showResults: boolean
  shortRound: boolean
}

type Action =
  | { type: "toggleProduct"; productId: number }
  | { type: "setPrice"; productId: number; price: number }
  | { type: "openStall"; now: number }
  | { type: "tick"; now: number }
  | { type: "endRound"; now: number }
  | { type: "acknowledgeResults" }
  | { type: "setProof"; proof: ProofChoice }

const STORAGE_KEY = "market-street"

function freshState(): GameState {
  return {
    coins: STARTING_COINS,
    avatarName: "Kofi",
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
    showResults: false,
    shortRound: readShortRound(),
  }
}

function mergeStall(saved: StallLine[] | undefined): StallLine[] {
  const base = freshStall()
  if (!Array.isArray(saved)) return base
  return base.map((line) => {
    const match = saved.find((item) => item.productId === line.productId)
    if (!match) return line
    return {
      productId: line.productId,
      price: clampPrice(Number(match.price) || line.price),
      selected: Boolean(match.selected),
      sold: Math.max(0, Number(match.sold) || 0),
    }
  })
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
        typeof parsed.avatarName === "string" && parsed.avatarName.trim()
          ? parsed.avatarName
          : blank.avatarName,
      groupId: typeof parsed.groupId === "string" ? parsed.groupId : null,
      stall: mergeStall(parsed.stall),
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
        parsed.proof === "pending"
          ? parsed.proof
          : "none",
      hasStocked: Boolean(parsed.hasStocked),
      roundProfits: Array.isArray(parsed.roundProfits)
        ? parsed.roundProfits.filter((value) => typeof value === "number")
        : [],
      weekContribution: Math.max(0, Number(parsed.weekContribution) || 0),
      challengesCompleted: Math.max(0, Number(parsed.challengesCompleted) || 0),
      shortRound: Boolean(parsed.shortRound),
      showResults: false,
      lastSale: null,
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
    const { showResults, lastSale, ...rest } = state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    // Storage can be blocked. The round still plays in memory.
  }
}

function finishRound(state: GameState): GameState {
  if (state.roundStatus === "ended" && state.lastResult) {
    return { ...state, showResults: true }
  }
  const result = summarizeRound({
    stall: state.stall,
    customers: state.customers,
    revenue: state.roundRevenue,
    stockCost: state.roundStockCost,
    soldOutEarly: state.soldOutEarly,
    roundsPlayed: state.roundsPlayed,
    avatarName: state.avatarName,
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
    stall: state.stall.map((line) => ({ ...line, sold: 0 })),
  }
}

function applyCustomer(state: GameState, now: number): GameState {
  const visit = rollCustomer(state.stall)
  if (visit.kind === "quiet") return state
  if (visit.kind === "sold-out") {
    return { ...state, soldOutEarly: true, lastCustomerAt: now }
  }
  const next: GameState = {
    ...state,
    customers: state.customers + 1,
    lastCustomerAt: now,
  }
  if (!visit.bought) return next
  const stall = next.stall.map((line) =>
    line.productId === visit.productId
      ? { ...line, sold: line.sold + 1 }
      : line,
  )
  const stillStocked = stall.some((line) => {
    if (!line.selected) return false
    return line.sold < productById(line.productId).quantity
  })
  return {
    ...next,
    coins: next.coins + visit.price,
    roundRevenue: next.roundRevenue + visit.price,
    saleSeq: next.saleSeq + 1,
    lastSale: {
      id: next.saleSeq + 1,
      buyer: visit.buyer,
      productName: visit.productName,
      line: visit.line,
      price: visit.price,
    },
    stall,
    soldOutEarly: next.soldOutEarly || !stillStocked,
  }
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "toggleProduct": {
      if (state.roundStatus === "running") return state
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
      const cost = selectedStockCost(state.stall)
      const selected = state.stall.some((line) => line.selected)
      if (!selected || cost > state.coins) return state
      return {
        ...state,
        coins: state.coins - cost,
        stall: state.stall.map((line) => ({ ...line, sold: 0 })),
        roundStatus: "running",
        roundEndsAt: action.now + roundDurationMs(state.shortRound),
        lastCustomerAt: action.now,
        customers: 0,
        roundRevenue: 0,
        roundStockCost: cost,
        soldOutEarly: false,
        lastSale: null,
        showResults: false,
        hasStocked: true,
        shortRound: state.shortRound || readShortRound(),
      }
    }
    case "tick": {
      if (state.roundStatus !== "running" || state.roundEndsAt === null) {
        return state
      }
      if (action.now >= state.roundEndsAt) return finishRound(state)
      if (state.soldOutEarly) return state
      const timing = customerTiming(state.shortRound)
      const wait =
        state.customers === 0 ? timing.firstDelay : timing.interval
      const since = state.lastCustomerAt ?? action.now
      if (action.now - since < wait) return state
      return applyCustomer(state, action.now)
    }
    case "endRound":
      if (state.roundStatus !== "running") return state
      return finishRound(state)
    case "acknowledgeResults":
      return { ...state, showResults: false }
    case "setProof":
      return { ...state, proof: action.proof }
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
  return weeklyChallenge.steps.map((label, index) => ({
    label,
    done: index < 2 ? stocked : state.proof === "pending",
  }))
}

export default function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

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
