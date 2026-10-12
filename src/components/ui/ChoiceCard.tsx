import { productById } from "@/data/products"
import { bulkCost, CREDIT_UNITS, type ChoiceKind } from "@/data/events"

export default function ChoiceCard({
  kind,
  productId,
  secondsLeft,
  coins,
  onTake,
  onSkip,
}: {
  kind: ChoiceKind
  productId: number
  secondsLeft: number
  coins: number
  onTake: () => void
  onSkip: () => void
}) {
  const product = productById(productId)
  const cost = bulkCost(product.cost)
  const short = kind === "bulk" && coins < cost
  const title = kind === "bulk" ? "Trotro bulk deal" : "Pay-later friend"
  const body =
    kind === "bulk"
      ? `Double your ${product.name} for ¢${cost}. Extra perishable stock is more likely to spoil.`
      : `Sell ${CREDIT_UNITS} ${product.unitName} of ${product.name} on credit. They might pay extra, or not at all.`

  return (
    <section className="choice-card">
      <div className="choice-top">
        <strong>{title}</strong>
        <span>{secondsLeft}s</span>
      </div>
      <p>{body}</p>
      {short && <p className="choice-short">You need ¢{cost - coins} more for this deal.</p>}
      <div className="choice-actions">
        <button disabled={short} onClick={onTake} type="button">
          {kind === "bulk" ? "Take deal" : "Sell on credit"}
        </button>
        <button onClick={onSkip} type="button">
          Skip
        </button>
      </div>
    </section>
  )
}
