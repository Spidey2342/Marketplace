import AppFrame from "@/components/scene/AppFrame"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import TopBar from "@/components/ui/TopBar"
import { productById, products } from "@/data/products"
import {
  priceVerdict,
  selectedStockCost,
} from "@/lib/economy"
import type { Go } from "@/lib/screen"
import { useGame } from "@/state/GameProvider"

export default function SetupScreen({ go }: { go: Go }) {
  const { state, dispatch } = useGame()
  const selected = state.stall.filter((line) => line.selected)
  const totalCost = selectedStockCost(state.stall)
  const pricey = selected.filter(
    (line) => priceVerdict(line.price, productById(line.productId)) === "Too high",
  )
  const shortBy = Math.max(0, totalCost - state.coins)
  const roundRunning = state.roundStatus === "running"
  const canOpen = selected.length > 0 && shortBy === 0 && !roundRunning

  return (
    <AppFrame className="setup-screen">
      <div className="screen-layer">
        <TopBar
          coins={state.coins}
          onBack={() => go("home")}
          title="STOCK YOUR STALL"
        />
        <div className="content-scroll setup-content">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TODAY&apos;S ROUND</span>
              <h1>What are we selling?</h1>
            </div>
            <Pill>
              {selected.length}/{products.length} picked
            </Pill>
          </div>

          <div className="product-list">
            {products.map((product) => {
              const line = state.stall.find(
                (item) => item.productId === product.id,
              )
              const isSelected = Boolean(line?.selected)
              const price = line?.price ?? product.price
              const verdict = priceVerdict(price, product)
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
                    onClick={() =>
                      dispatch({ type: "toggleProduct", productId: product.id })
                    }
                    disabled={roundRunning}
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
                              dispatch({
                                type: "setPrice",
                                productId: product.id,
                                price: price - 1,
                              })
                            }
                            disabled={roundRunning}
                            type="button"
                          >
                            <Icon name="minus" size={17} />
                          </button>
                          <strong>¢{price}</strong>
                          <button
                            aria-label={`Raise ${product.name} price`}
                            onClick={() =>
                              dispatch({
                                type: "setPrice",
                                productId: product.id,
                                price: price + 1,
                              })
                            }
                            disabled={roundRunning}
                            type="button"
                          >
                            <Icon name="plus" size={17} />
                          </button>
                        </div>
                        <span
                          className={
                            verdict === "Good price" ? "price-good" : "price-high"
                          }
                        >
                          {verdict}
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

          {pricey.length > 0 && (
            <div className="warning-callout">
              <Icon name="spark" size={22} />
              <p>
                <strong>Ei, that&apos;s pricey!</strong>{" "}
                {`${pricey
                  .map((line) => {
                    const product = productById(line.productId)
                    return `Neighbours sell ${product.name} for ¢${product.neighborPrice}`
                  })
                  .join(". ")}.`}
              </p>
            </div>
          )}

          {shortBy > 0 && selected.length > 0 && (
            <div className="empty-callout">
              <Icon name="coin" size={24} />
              <div>
                <strong>Coins are a bit short</strong>
                <p>You need ¢{shortBy} more to stock this.</p>
              </div>
            </div>
          )}
        </div>

        <footer className="sticky-action">
          <div className="stock-total">
            <span>Stock cost</span>
            <strong>¢{totalCost}</strong>
          </div>
          <Button
            className={`button-primary ${canOpen ? "" : "button-disabled"}`}
            icon="arrow"
            onClick={() => {
              if (!canOpen) return
              dispatch({ type: "openStall", now: Date.now() })
              go("town")
            }}
          >
            OPEN STALL
          </Button>
        </footer>
      </div>
    </AppFrame>
  )
}
