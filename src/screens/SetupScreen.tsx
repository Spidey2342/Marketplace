import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Pill from "@/components/ui/Pill"
import { eventById } from "@/data/events"
import { productById } from "@/data/products"
import {
  cheapestOpenCost,
  lineRestockCost,
  PACK_MAX,
  PACK_MIN,
  priceVerdict,
  selectedStockCost,
} from "@/lib/economy"
import { useState } from "react"
import {
  categories,
  isUnlocked,
  productsIn,
  slotLimit,
  unlockLabel,
  type Category,
} from "@/data/products"
import { useGame } from "@/state/GameProvider"

export default function SetupScreen({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useGame()
  const [category, setCategory] = useState<Category>("drinks")
  const [blockNote, setBlockNote] = useState("")
  const limit = slotLimit(state.stageId)
  const selected = state.stall.filter((line) => line.selected)
  const shown = productsIn(category)
  const totalCost = selectedStockCost(state.stall)
  const pricey = selected.filter(
    (line) => priceVerdict(line.price, productById(line.productId)) === "Too high",
  )
  const shortBy = Math.max(0, totalCost - state.coins)
  const roundRunning = state.roundStatus === "running"
  const overLimit = selected.length > limit
  const freeStarter =
    state.roundsPlayed === 0 &&
    !state.freeStarterUsed &&
    state.coins < cheapestOpenCost(state.stall, state.stageId)
  const canOpen = !roundRunning && !overLimit && (freeStarter || (selected.length > 0 && shortBy === 0))
  const openReason = roundRunning
    ? "The market is already open."
    : overLimit
      ? `You can carry ${limit} items`
      : freeStarter
        ? "First round is on the house."
        : selected.length === 0
          ? "Pick at least 1 item"
          : shortBy > 0
            ? `You need ¢${shortBy} more for this stock`
            : ""

  return (
    <div aria-label="Stock your stall" className="stall-sheet" role="dialog">
      <div className="sheet-handle" />
      <div className="sheet-title">
        <h2>STOCK YOUR STALL</h2>
        <button aria-label="Close" onClick={onClose} type="button">
          <Icon name="x" />
        </button>
      </div>
      <div className="content-scroll setup-content">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TODAY&apos;S ROUND</span>
            <h1>What are we selling?</h1>
            {state.forecast && (
              <p className="forecast-banner">{eventById(state.forecast).forecast}</p>
            )}
          </div>
          <Pill>
            {selected.length} of {limit} picked
          </Pill>
        </div>

          <div className="category-tabs" role="tablist">
            {categories.map((tab) => (
              <button
                aria-pressed={category === tab.id}
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          {blockNote && <p className="slot-note">{blockNote}</p>}

          <div className="product-list">
            {shown.map((product) => {
              const line = state.stall.find(
                (item) => item.productId === product.id,
              )
              const isSelected = Boolean(line?.selected)
              const locked = !isUnlocked(product, state.stageId)
              const price = line?.price ?? product.price
              const packs = line?.packs ?? PACK_MIN
              const carried = line?.carried ?? 0
              const verdict = priceVerdict(price, product)
              const restock = line ? lineRestockCost(line) : product.cost
              return (
                <article
                  className={`product-card ${isSelected ? "is-selected" : ""} ${locked ? "is-locked" : ""}`}
                  key={product.id}
                >
                  <button
                    aria-label={
                      locked
                        ? `${product.name} unlocks at ${unlockLabel(product.unlockStage)}`
                        : `${isSelected ? "Remove" : "Add"} ${product.name}`
                    }
                    className={`product-check ${isSelected ? "checked" : ""}`}
                    onClick={() => {
                      if (locked) {
                        setBlockNote(
                          `${unlockLabel(product.unlockStage)} unlocks ${product.name}.`,
                        )
                        return
                      }
                      if (!isSelected && selected.length >= limit) {
                        setBlockNote(
                          `That's ${limit} of ${limit}. Drop one to add another.`,
                        )
                        return
                      }
                      setBlockNote("")
                      dispatch({ type: "toggleProduct", productId: product.id })
                    }}
                    disabled={roundRunning || locked}
                    type="button"
                  >
                    {locked ? (
                      <Icon name="lock" size={18} />
                    ) : isSelected ? (
                      <Icon name="check" size={18} />
                    ) : (
                      <Icon name="plus" size={18} />
                    )}
                  </button>
                  <div className="product-art" style={{ background: product.color }}>
                    <div className={`prop prop-${product.propType}`} />
                  </div>
                  <div className="product-info">
                    <div className="product-title">
                      <div>
                        <h2>{product.name}</h2>
                        <p>{product.detail}</p>
                        {locked && (
                          <p className="unlock-line">
                            Unlocks at {unlockLabel(product.unlockStage)}
                          </p>
                        )}
                      </div>
                      <span className="cost">Cost ¢{isSelected ? restock : product.cost}</span>
                    </div>
                    {isSelected && carried > 0 && (
                      <p className="leftover-line">{carried} left from last round</p>
                    )}
                    {isSelected && (
                      <div className="price-row pack-row">
                        <span>Packs</span>
                        <div className="stepper">
                          <button
                            aria-label={`Fewer ${product.name} packs`}
                            disabled={roundRunning || packs <= PACK_MIN}
                            onClick={() =>
                              dispatch({
                                type: "setPacks",
                                productId: product.id,
                                packs: packs - 1,
                              })
                            }
                            type="button"
                          >
                            <Icon name="minus" size={17} />
                          </button>
                          <strong>{packs}</strong>
                          <button
                            aria-label={`More ${product.name} packs`}
                            disabled={roundRunning || packs >= PACK_MAX}
                            onClick={() =>
                              dispatch({
                                type: "setPacks",
                                productId: product.id,
                                packs: packs + 1,
                              })
                            }
                            type="button"
                          >
                            <Icon name="plus" size={17} />
                          </button>
                        </div>
                      </div>
                    )}
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
        </div>

        <footer className="sticky-action">
          {openReason && <p className="open-reason">{openReason}</p>}
          <div className="open-row">
            <div className="stock-total">
              <span>Stock cost</span>
              <strong>¢{freeStarter ? 0 : totalCost}</strong>
            </div>
            <Button
              className={`button-primary ${canOpen ? "" : "button-disabled"}`}
              icon="arrow"
              onClick={() => {
                if (!canOpen) return
                dispatch({ type: "openStall", now: Date.now(), free: freeStarter })
                onClose()
              }}
            >
              OPEN STALL
            </Button>
          </div>
        </footer>
      </div>
  )
}
