export type Product = {
  id: number
  name: string
  detail: string
  quantity: number
  cost: number
  unitCost: number
  neighborPrice: number
  color: "red" | "yellow" | "green"
  price: number
  praise: string
}

export const products: Product[] = [
  {
    id: 1,
    name: "Sobolo",
    detail: "6 chilled cups",
    quantity: 6,
    cost: 18,
    unitCost: 3,
    neighborPrice: 5,
    color: "red",
    price: 5,
    praise: "Chale, refreshing!",
  },
  {
    id: 2,
    name: "Bofrot",
    detail: "8 fresh pieces",
    quantity: 8,
    cost: 16,
    unitCost: 2,
    neighborPrice: 4,
    color: "yellow",
    price: 4,
    praise: "Ei, this is sweet!",
  },
  {
    id: 3,
    name: "Plantain chips",
    detail: "5 crunchy bags",
    quantity: 5,
    cost: 25,
    unitCost: 5,
    neighborPrice: 8,
    color: "green",
    price: 8,
    praise: "Crunchy, nice one!",
  },
]

export function productById(id: number): Product {
  const product = products.find((item) => item.id === id)
  if (!product) throw new Error(`Unknown product ${id}`)
  return product
}
