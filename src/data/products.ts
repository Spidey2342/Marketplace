import { stageIndex, type StageId } from "@/data/upgrades"

export type Category = "drinks" | "snacks" | "meals" | "fashion"

export type PropType = "cup" | "bag" | "plate" | "pile"

export type UnlockStage = "stall" | "shop" | "brand"

export type LikeType = "student" | "worker" | "visitor"

export type Product = {
  id: number
  name: string
  category: Category
  pack: string
  packSize: number
  packCost: number
  neighborPrice: number
  perishable: boolean
  likedBy: LikeType[]
  propType: PropType
  unlockStage: UnlockStage
  color: string
  detail: string
  quantity: number
  cost: number
  unitCost: number
  price: number
  praise: string
  drink: boolean
  unitName: string
}

export const STALL_SLOTS = 3
export const SHOP_SLOTS = 6

export const categories: { id: Category; label: string }[] = [
  { id: "drinks", label: "Drinks" },
  { id: "snacks", label: "Snacks" },
  { id: "meals", label: "Meals" },
  { id: "fashion", label: "Fashion" },
]

const WARM_IDS = new Set([7, 10, 11, 12, 13])

type Draft = {
  id: number
  name: string
  category: Category
  pack: string
  packSize: number
  packCost: number
  neighborPrice: number
  likedBy: LikeType[]
  propType: PropType
  unlockStage: UnlockStage
  color: string
  unitName: string
  praise: string
}

function item(draft: Draft): Product {
  return {
    ...draft,
    perishable: draft.category !== "fashion",
    detail: draft.pack,
    quantity: draft.packSize,
    cost: draft.packCost,
    unitCost: draft.packCost / draft.packSize,
    price: draft.neighborPrice,
    drink: draft.category === "drinks",
  }
}

const drafts: Draft[] = [
  {
    id: 1,
    name: "Sobolo",
    category: "drinks",
    pack: "6 chilled cups",
    packSize: 6,
    packCost: 18,
    neighborPrice: 5,
    likedBy: ["worker"],
    propType: "cup",
    unlockStage: "stall",
    color: "#c23b4a",
    unitName: "cups",
    praise: "Chale, refreshing!",
  },
  {
    id: 2,
    name: "Bofrot",
    category: "snacks",
    pack: "8 fresh pieces",
    packSize: 8,
    packCost: 16,
    neighborPrice: 4,
    likedBy: [],
    propType: "pile",
    unlockStage: "stall",
    color: "#e39b2b",
    unitName: "pieces",
    praise: "Ei, this is sweet!",
  },
  {
    id: 3,
    name: "Plantain chips",
    category: "snacks",
    pack: "5 crunchy bags",
    packSize: 5,
    packCost: 20,
    neighborPrice: 8,
    likedBy: ["visitor"],
    propType: "bag",
    unlockStage: "stall",
    color: "#d4a017",
    unitName: "bags",
    praise: "Crunchy, nice one!",
  },
  {
    id: 4,
    name: "Pure water",
    category: "drinks",
    pack: "10 iced sachets",
    packSize: 10,
    packCost: 10,
    neighborPrice: 2,
    likedBy: ["student"],
    propType: "bag",
    unlockStage: "stall",
    color: "#7ec8e3",
    unitName: "sachets",
    praise: "Cold one, Chale!",
  },
  {
    id: 5,
    name: "Lamugin",
    category: "drinks",
    pack: "6 ginger cups",
    packSize: 6,
    packCost: 12,
    neighborPrice: 5,
    likedBy: [],
    propType: "cup",
    unlockStage: "shop",
    color: "#e07a3d",
    unitName: "cups",
    praise: "Ei, the ginger!",
  },
  {
    id: 6,
    name: "Fresh coconut water",
    category: "drinks",
    pack: "4 fresh cups",
    packSize: 4,
    packCost: 12,
    neighborPrice: 6,
    likedBy: [],
    propType: "cup",
    unlockStage: "shop",
    color: "#8fbf7a",
    unitName: "cups",
    praise: "Sweet and cold!",
  },
  {
    id: 7,
    name: "Kelewele",
    category: "snacks",
    pack: "6 spicy cups",
    packSize: 6,
    packCost: 12,
    neighborPrice: 5,
    likedBy: ["student"],
    propType: "plate",
    unlockStage: "stall",
    color: "#e07b1a",
    unitName: "cups",
    praise: "Spicy, nice one!",
  },
  {
    id: 8,
    name: "Roasted groundnuts",
    category: "snacks",
    pack: "6 roasted bags",
    packSize: 6,
    packCost: 12,
    neighborPrice: 4,
    likedBy: [],
    propType: "bag",
    unlockStage: "stall",
    color: "#c4a574",
    unitName: "bags",
    praise: "Crunchy, Chale!",
  },
  {
    id: 9,
    name: "Koose",
    category: "snacks",
    pack: "6 bean cakes",
    packSize: 6,
    packCost: 12,
    neighborPrice: 4,
    likedBy: ["student"],
    propType: "pile",
    unlockStage: "stall",
    color: "#c47a3a",
    unitName: "pieces",
    praise: "Hot and filling!",
  },
  {
    id: 10,
    name: "Roasted plantain with groundnuts",
    category: "snacks",
    pack: "4 plantain plates",
    packSize: 4,
    packCost: 16,
    neighborPrice: 7,
    likedBy: [],
    propType: "plate",
    unlockStage: "shop",
    color: "#d4893a",
    unitName: "plates",
    praise: "A full plate, Ei!",
  },
  {
    id: 11,
    name: "Waakye plate",
    category: "meals",
    pack: "3 waakye plates",
    packSize: 3,
    packCost: 21,
    neighborPrice: 12,
    likedBy: ["worker"],
    propType: "plate",
    unlockStage: "shop",
    color: "#8b3a2f",
    unitName: "plates",
    praise: "Proper food, Chale!",
  },
  {
    id: 12,
    name: "Jollof plate",
    category: "meals",
    pack: "2 jollof plates",
    packSize: 2,
    packCost: 18,
    neighborPrice: 15,
    likedBy: ["worker"],
    propType: "plate",
    unlockStage: "shop",
    color: "#e24b2a",
    unitName: "plates",
    praise: "The jollof is on!",
  },
  {
    id: 13,
    name: "Fried yam with pepper",
    category: "meals",
    pack: "3 yam plates",
    packSize: 3,
    packCost: 18,
    neighborPrice: 10,
    likedBy: ["worker"],
    propType: "plate",
    unlockStage: "shop",
    color: "#f0c14a",
    unitName: "plates",
    praise: "Pepper on top!",
  },
  {
    id: 14,
    name: "Banku with tilapia",
    category: "meals",
    pack: "2 tilapia plates",
    packSize: 2,
    packCost: 30,
    neighborPrice: 25,
    likedBy: ["visitor"],
    propType: "plate",
    unlockStage: "brand",
    color: "#f5e6c8",
    unitName: "plates",
    praise: "Big plate, Chale!",
  },
  {
    id: 15,
    name: "Thrift tees",
    category: "fashion",
    pack: "3 thrift tees",
    packSize: 3,
    packCost: 18,
    neighborPrice: 15,
    likedBy: ["student"],
    propType: "pile",
    unlockStage: "brand",
    color: "#3d6b8a",
    unitName: "pieces",
    praise: "Clean fit!",
  },
  {
    id: 16,
    name: "Slippers",
    category: "fashion",
    pack: "2 pairs",
    packSize: 2,
    packCost: 16,
    neighborPrice: 20,
    likedBy: [],
    propType: "pile",
    unlockStage: "brand",
    color: "#e8d5a3",
    unitName: "pairs",
    praise: "Soft step!",
  },
  {
    id: 17,
    name: "Kente-print pouch",
    category: "fashion",
    pack: "2 kente pouches",
    packSize: 2,
    packCost: 20,
    neighborPrice: 25,
    likedBy: ["visitor"],
    propType: "bag",
    unlockStage: "brand",
    color: "#c45c26",
    unitName: "pieces",
    praise: "Sharp cloth!",
  },
  {
    id: 18,
    name: "Beaded bracelets",
    category: "fashion",
    pack: "3 bracelets",
    packSize: 3,
    packCost: 18,
    neighborPrice: 18,
    likedBy: ["visitor"],
    propType: "pile",
    unlockStage: "brand",
    color: "#f2c14e",
    unitName: "pieces",
    praise: "Pretty beads!",
  },
  {
    id: 19,
    name: "Caps",
    category: "fashion",
    pack: "2 caps",
    packSize: 2,
    packCost: 28,
    neighborPrice: 35,
    likedBy: [],
    propType: "pile",
    unlockStage: "brand",
    color: "#1f4d3a",
    unitName: "pieces",
    praise: "Cap on, let's go!",
  },
]

export const products: Product[] = drafts.map(item).sort((a, b) => a.id - b.id)

export function productById(id: number): Product {
  const product = products.find((entry) => entry.id === id)
  if (!product) throw new Error(`Unknown product ${id}`)
  return product
}

export function productsIn(category: Category): Product[] {
  return products.filter((product) => product.category === category)
}

export function isWarmFood(product: Product): boolean {
  return WARM_IDS.has(product.id)
}

export function isUnlocked(product: Product, stage: StageId): boolean {
  return stageIndex(stage) >= stageIndex(product.unlockStage)
}

export function slotLimit(stage: StageId): number {
  return stageIndex(stage) >= stageIndex("shop") ? SHOP_SLOTS : STALL_SLOTS
}

export function unlockLabel(stage: UnlockStage): string {
  if (stage === "shop") return "Shop"
  if (stage === "brand") return "Brand"
  return "Stall"
}
