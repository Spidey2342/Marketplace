export type Product = {
  id: number
  name: string
  detail: string
  cost: number
  color: "red" | "yellow" | "green"
  price: number
}

export const products: Product[] = [
  {
    id: 1,
    name: "Sobolo",
    detail: "6 chilled cups",
    cost: 18,
    color: "red",
    price: 5,
  },
  {
    id: 2,
    name: "Bofrot",
    detail: "8 fresh pieces",
    cost: 16,
    color: "yellow",
    price: 4,
  },
  {
    id: 3,
    name: "Plantain chips",
    detail: "5 crunchy bags",
    cost: 25,
    color: "green",
    price: 8,
  },
]
