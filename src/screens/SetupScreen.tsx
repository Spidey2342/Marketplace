import { useState } from "react"
import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import TopBar from "@/components/ui/TopBar"
import { products } from "@/data/products"
import type { Go } from "@/lib/screen"

export default function SetupScreen({ go }: { go: Go }) {
  const [selected, setSelected] = useState<number[]>([1, 2, 3])
  const [prices, setPrices] = useState<Record<number, number>>({
    1: 5,
    2: 4,
    3: 8,
  })

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((productId) => productId !== id)
        : [...current, id],
    )
  }

  const totalCost = products
    .filter((product) => selected.includes(product.id))
    .reduce((sum, product) => sum + product.cost, 0)
  const hasWarning = selected.some((id) => prices[id] > 8)

  return (
    <AppFrame className="setup-screen">
      <div className="screen-layer">
        <TopBar
          coins={100}
          onBack={() => go("home")}
          title="STOCK YOUR STALL"
        />
        <div className="content-scroll setup-content">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TODAY&apos;S ROUND</span>
              <h1>What are we selling?</h1>
            </div>
            <Pill>{selected.length}/3 picked</Pill>
          </div>

          <div className="product-list">
            {products.map((product) => {
              const isSelected = selected.includes(product.id)
              const price = prices[product.id]
              const tooHigh = price > 8
              return (
                <article
                  className={`product-card ${isSelected ? "is-selected" : ""}`}
                  key={product.id}
                >
                  <button
                    aria-label={`${
                      isSelected ? "Remove" : "Add"
                    } ${product.name}`}
                    className={`product-check ${isSelected ? "checked" : ""}`}
                    onClick={() => toggle(product.id)}
                    type="button"
                  >
                    {isSelected ? (
                      <Icon name="check" size={18} />
                    ) : (
                      <Icon name="plus" size={18} />
                    )}
                  </button>
                  <div className={`product-art ${product.color}`}>
                    <div className={`food food-${product.id}`} />
                  </div>
                  <div className="product-info">
                    <div className="product-title">
                      <div>
                        <h2>{product.name}</h2>
                        <p>{product.detail}</p>
                      </div>
                      <span className="cost">Cost ¢{product.cost}</span>
                    </div>
                    {isSelected && (
                      <div className="price-row">
                        <span>Your price</span>
                        <div className="stepper">
                          <button
                            aria-label={`Lower ${product.name} price`}
                            onClick={() =>
                              setPrices((current) => ({
                                ...current,
                                [product.id]: Math.max(2, price - 1),
                              }))
                            }
                            type="button"
                          >
                            <Icon name="minus" size={17} />
                          </button>
                          <strong>¢{price}</strong>
                          <button
                            aria-label={`Raise ${product.name} price`}
                            onClick={() =>
                              setPrices((current) => ({
                                ...current,
                                [product.id]: Math.min(12, price + 1),
                              }))
                            }
                            type="button"
                          >
                            <Icon name="plus" size={17} />
                          </button>
                        </div>
                        <span className={tooHigh ? "price-high" : "price-good"}>
                          {tooHigh ? "Too high" : "Good price"}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          {selected.length === 0 && (
            <div className="empty-callout">
              <Icon name="market" size={24} />
              <div>
                <strong>Your stall is empty</strong>
                <p>Pick at least one item to open.</p>
              </div>
            </div>
          )}

          {hasWarning && selected.length > 0 && (
            <div className="warning-callout">
              <Icon name="spark" size={22} />
              <p>
                <strong>Ei, that&apos;s pricey!</strong> Neighbours sell similar
                items for ¢6–¢8.
              </p>
            </div>
          )}
        </div>

        <footer className="sticky-action">
          <div className="stock-total">
            <span>Stock cost</span>
            <strong>¢{totalCost}</strong>
          </div>
          <Button
            className={`button-primary ${
              selected.length === 0 ? "button-disabled" : ""
            }`}
            icon="arrow"
            onClick={() => selected.length > 0 && go("town")}
          >
            OPEN STALL
          </Button>
        </footer>
      </div>
    </AppFrame>
  )
}
