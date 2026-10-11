import { useEffect, useMemo, useState, type ReactNode } from "react"

type Screen = "home" | "setup" | "town" | "results" | "challenge"
type IconName = "arrow" | "camera" | "chat" | "check" | "chevron" | "clock" | "coin" | "group" | "home" | "lock" | "map" | "market" | "minus" | "plus" | "receipt" | "shield" | "spark" | "star" | "user" | "x"

const products = [
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

function Icon({ name, size = 20 }: { name: IconName size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="m9 18 6-6-6-6" />,
    camera: (
      <>
        <path d="M14.5 5 13 3H7L5.5 5H3v13h18V5h-6.5Z" />
        <circle cx="12" cy="11.5" r="4" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v11H9l-5 4V5Z" />
        <path d="M8 10h8M8 13h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 7" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    coin: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15 8.5c-.7-.6-1.7-1-3-1-1.7 0-3 .8-3 2s1.1 1.7 3 2c1.9.3 3 1 3 2.4 0 1.3-1.3 2.2-3 2.2-1.3 0-2.6-.5-3.4-1.3M12 5.5v13" />
      </>
    ),
    group: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3.5 18c.4-3 2.2-4.7 5.5-4.7s5.1 1.7 5.5 4.7M14 14c3.5-.6 5.7.8 6 3.5" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-7 9 7" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    market: (
      <>
        <path d="M4 10v10h16V10M3 10l2-6h14l2 6" />
        <path d="M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0M9 20v-6h6v6" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    plus: <path d="M12 5v14M5 12h14" />,
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    spark: (
      <path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
    ),
    star: (
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21c.4-4.5 2.9-7 7.5-7s7.1 2.5 7.5 7" />
      </>
    ),
    x: <path d="m6 6 12 12M18 6 6 18" />,
  }

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name]}
    </svg>
  )
}

function Button({
  children,
  className = "",
  icon,
  onClick,
  type = "button",
}: {
  children: ReactNode
  className?: string
  icon?: IconName
  onClick?: () => void
  type?: "button" | "submit"
}) {
  return (
    <button className={`button ${className}`} onClick={onClick} type={type}>
      <span>{children}</span>
      {icon && <Icon name={icon} size={22} />}
    </button>
  )
}

function Pill({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`pill ${className}`}>{children}</div>
}

function MarketBackdrop({ active = false }: { active?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`market-scene ${active ? "is-active" : ""}`}
    >
      <div className="sun" />
      <div className="cloud cloud-one" />
      <div className="cloud cloud-two" />
      <div className="hills hill-one" />
      <div className="hills hill-two" />
      <div className="shop-row shop-row-back">
        <div className="shop shop-indigo">
          <span>AMA&apos;S</span>
        </div>
        <div className="shop shop-green">
          <span>CHOP BAR</span>
        </div>
        <div className="shop shop-red">
          <span>REPAIRS</span>
        </div>
      </div>
      <div className="road">
        <i />
        <i />
        <i />
      </div>
      <div className="umbrella umbrella-left" />
      <div className="stall stall-left">
        <span />
      </div>
      <div className="umbrella umbrella-right" />
      <div className="stall stall-right">
        <span />
      </div>
      <div className="person person-one">
        <b />
        <i />
      </div>
      <div className="person person-two">
        <b />
        <i />
      </div>
      <div className="plantain-basket" />
    </div>
  )
}

function AppFrame({
  activeScene,
  children,
  className = "",
}: {
  activeScene?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <main className={`app-frame ${className}`}>
      <MarketBackdrop active={activeScene} />
      <div className="grain" />
      {children}
    </main>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-sign">
        <span className="brand-kicker">WELCOME TO</span>
        <span className="brand-name">MARKET</span>
        <span className="brand-name brand-name-bottom">STREET</span>
        <div className="brand-awning">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <p>Build your hustle. Grow your name.</p>
    </div>
  )
}

function HomeScreen({ go }: { go: (screen: Screen) => void }) {
  const [joining, setJoining] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState(false)

  function joinRoom() {
    if (code.trim().length < 4) {
      setError(true)
      return
    }
    go("setup")
  }

  return (
    <AppFrame className="home-screen">
      <div className="top-safe">
        <Pill className="online-pill">
          <span className="live-dot" />
          248 hustlers online
        </Pill>
      </div>
      <Brand />
      <section className="join-panel">
        {!joining ? (
          <>
            <Button
              className="button-primary button-play"
              icon="arrow"
              onClick={() => go("setup")}
            >
              PLAY NOW
            </Button>
            <Button className="button-light" onClick={() => setJoining(true)}>
              JOIN WITH CODE
            </Button>
            <button
              className="text-button"
              onClick={() => go("setup")}
              type="button"
            >
              Continue as guest
            </button>
          </>
        ) : (
          <form
            className="join-form"
            onSubmit={(event) => {
              event.preventDefault()
              joinRoom()
            }}
          >
            <label htmlFor="room-code">
              Enter your friend&apos;s room code
            </label>
            <div className={`code-field ${error ? "has-error" : ""}`}>
              <input
                autoFocus
                id="room-code"
                maxLength={6}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase())
                  setError(false)
                }}
                placeholder="E.G. ACCRA7"
                value={code}
              />
              <button
                aria-label="Close join form"
                onClick={() => setJoining(false)}
                type="button"
              >
                <Icon name="x" />
              </button>
            </div>
            {error && (
              <p className="field-error">
                That code looks too short. Try again.
              </p>
            )}
            <Button className="button-primary" icon="arrow" type="submit">
              JOIN ROOM
            </Button>
          </form>
        )}
        <div className="privacy-note">
          <Icon name="shield" size={17} />
          <span>Safe play · No exact location shared</span>
        </div>
      </section>
    </AppFrame>
  )
}

function TopBar({
  title,
  onBack,
  coins = 100,
}: {
  title: string
  onBack?: () => void
  coins?: number
}) {
  return (
    <header className="top-bar">
      {onBack ? (
        <button
          aria-label="Go back"
          className="icon-button"
          onClick={onBack}
          type="button"
        >
          <Icon name="chevron" />
        </button>
      ) : (
        <div className="avatar-chip">
          <span className="avatar-face" />
          <span>KM</span>
        </div>
      )}
      <strong>{title}</strong>
      <Pill className="coin-pill">
        <Icon name="coin" size={19} />
        {coins}
      </Pill>
    </header>
  )
}

function SetupScreen({ go }: { go: (screen: Screen) => void }) {
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

function MiniMap() {
  return (
    <div className="mini-map">
      <div className="map-road map-road-one" />
      <div className="map-road map-road-two" />
      <i className="map-shop shop-a" />
      <i className="map-shop shop-b" />
      <i className="map-shop shop-c" />
      <span className="map-player" />
      <div className="map-label">YOU</div>
    </div>
  )
}

function TownScreen({ go }: { go: (screen: Screen) => void }) {
  const [seconds, setSeconds] = useState(294)
  const [chatOpen, setChatOpen] = useState(false)
  const [emotesOpen, setEmotesOpen] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((current) => (current > 0 ? current - 1 : 294))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  return (
    <AppFrame activeScene className="town-screen">
      <div className="town-top">
        <div className="player-status">
          <div className="mini-avatar">
            <span />
          </div>
          <div>
            <span>KOFI&apos;S STALL</span>
            <strong>Open · 3 items</strong>
          </div>
        </div>
        <Pill className="coin-pill town-coins">
          <Icon name="coin" size={20} />
          116
          <span className="coin-gain">+16</span>
        </Pill>
      </div>

      <div className={`timer-card ${seconds < 30 ? "urgent" : ""}`}>
        <Icon name="clock" size={19} />
        <div>
          <span>MARKET CLOSES IN</span>
          <strong>{time}</strong>
        </div>
      </div>

      <MiniMap />

      <div className="sale-toast">
        <div className="toast-face" />
        <p>
          <strong>Akos bought Sobolo!</strong>
          <span>“Chale, refreshing!”</span>
        </p>
        <b>+¢5</b>
      </div>

      {chatOpen && (
        <div className="chat-sheet">
          <div className="sheet-handle" />
          <div className="sheet-title">
            <h2>QUICK CHAT</h2>
            <button
              aria-label="Close chat"
              onClick={() => setChatOpen(false)}
              type="button"
            >
              <Icon name="x" />
            </button>
          </div>
          <div className="phrase-grid">
            {[
              "Fresh stock here!",
              "Good price!",
              "Come to my stall",
              "Nice one!",
            ].map((phrase) => (
              <button
                key={phrase}
                onClick={() => setChatOpen(false)}
                type="button"
              >
                {phrase}
              </button>
            ))}
          </div>
          <div className="safety-line">
            <Icon name="shield" size={17} />
            Preset chat keeps the market safe.
          </div>
        </div>
      )}

      {emotesOpen && (
        <div className="emote-wheel">
          {["AY", "ƆY", "10", "OK"].map((emote) => (
            <button
              key={emote}
              onClick={() => setEmotesOpen(false)}
              type="button"
            >
              {emote}
            </button>
          ))}
        </div>
      )}

      <button
        aria-label="Move avatar"
        className="virtual-joystick"
        type="button"
      >
        <span className="joystick-direction joystick-up" />
        <span className="joystick-direction joystick-right" />
        <span className="joystick-direction joystick-down" />
        <span className="joystick-direction joystick-left" />
        <span className="joystick-knob" />
      </button>

      <div className="town-controls">
        <button
          className="control-button"
          onClick={() => setChatOpen(true)}
          type="button"
        >
          <Icon name="chat" size={24} />
          <span>Chat</span>
        </button>
        <button
          className="control-button emote-button"
          onClick={() => setEmotesOpen((current) => !current)}
          type="button"
        >
          <Icon name="star" size={27} />
          <span>Emote</span>
        </button>
        <button
          className="control-button"
          onClick={() => go("setup")}
          type="button"
        >
          <Icon name="market" size={24} />
          <span>My stall</span>
        </button>
      </div>

      <div className="town-quests">
        <button onClick={() => go("challenge")} type="button">
          <Icon name="spark" size={20} />
          <span>Weekly challenge</span>
          <Icon name="arrow" size={18} />
        </button>
        <button
          className="finish-demo"
          onClick={() => go("results")}
          type="button"
        >
          Finish round
        </button>
      </div>
    </AppFrame>
  )
}

function ResultsScreen({ go }: { go: (screen: Screen) => void }) {
  return (
    <AppFrame className="results-screen">
      <div className="confetti confetti-one" />
      <div className="confetti confetti-two" />
      <div className="confetti confetti-three" />
      <div className="results-layer">
        <div className="round-complete">
          <span className="eyebrow">MARKET CLOSED</span>
          <h1>Solid hustle, Kofi!</h1>
          <p>Your first sale is in the books.</p>
        </div>

        <section className="results-card">
          <div className="results-ribbon">ROUND RESULT</div>
          <div className="profit-mark">
            <div className="coin-stack">
              <Icon name="coin" size={34} />
            </div>
            <span>PROFIT</span>
            <strong>+¢38</strong>
          </div>
          <div className="results-stats">
            <div>
              <span>Items sold</span>
              <strong>11</strong>
            </div>
            <div>
              <span>Customers</span>
              <strong>8</strong>
            </div>
            <div>
              <span>Reputation</span>
              <strong>+12</strong>
            </div>
          </div>
          <div className="best-seller">
            <div className="best-art">
              <div className="food food-1" />
            </div>
            <div>
              <span>BEST SELLER</span>
              <strong>Sobolo · 6 sold</strong>
            </div>
            <Pill>
              <Icon name="star" size={15} /> MVP
            </Pill>
          </div>
          <div className="insight-card">
            <div className="insight-icon">
              <Icon name="spark" size={22} />
            </div>
            <p>
              <strong>Why you won</strong>
              Your Sobolo was ¢1 cheaper than your neighbours&apos;. More people
              stopped by.
            </p>
          </div>
        </section>

        <div className="results-actions">
          <Button
            className="button-primary"
            icon="arrow"
            onClick={() => go("setup")}
          >
            REINVEST ¢38
          </Button>
          <Button className="button-light" onClick={() => go("town")}>
            PLAY AGAIN
          </Button>
          <button
            className="text-button dark"
            onClick={() => go("challenge")}
            type="button"
          >
            View weekly challenge
          </button>
        </div>
      </div>
    </AppFrame>
  )
}

function ChallengeScreen({ go }: { go: (screen: Screen) => void }) {
  const [proof, setProof] = useState<"none" | "photo" | "receipt" | "pending">(
    "none",
  )
  const steps = useMemo(
    () => [
      { done: true, label: "Choose one thing to sell" },
      { done: true, label: "Agree a fair price" },
      { done: proof === "pending", label: "Make the sale & add proof" },
    ],
    [proof],
  )

  return (
    <AppFrame className="challenge-screen">
      <div className="screen-layer">
        <TopBar
          coins={138}
          onBack={() => go("town")}
          title="WEEKLY CHALLENGE"
        />
        <div className="content-scroll challenge-content">
          <div className="week-strip">
            <span>WEEK 3</span>
            <strong>First sale energy</strong>
            <Pill>
              <Icon name="clock" size={15} />
              2d 14h left
            </Pill>
          </div>

          <section className="challenge-hero">
            <div className="kente-strip">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="challenge-illustration">
              <div className="hand hand-left" />
              <div className="challenge-coin">
                <Icon name="coin" size={38} />
              </div>
              <div className="hand hand-right" />
            </div>
            <span className="eyebrow">REAL-LIFE CHALLENGE</span>
            <h1>Make your first real sale</h1>
            <p>
              Sell one simple thing to someone you know. Start small — the win
              is starting.
            </p>
            <div className="reward-pill">
              <Icon name="star" size={20} />
              <span>REWARD</span>
              <strong>200 coins + First Sale badge</strong>
            </div>
          </section>

          <section className="steps-card">
            <div className="card-heading">
              <h2>YOUR STEPS</h2>
              <span>2 of 3</span>
            </div>
            {steps.map((step, index) => (
              <div
                className={`challenge-step ${step.done ? "done" : ""}`}
                key={step.label}
              >
                <span>
                  {step.done ? <Icon name="check" size={17} /> : index + 1}
                </span>
                <p>{step.label}</p>
              </div>
            ))}
          </section>

          <section
            className={`proof-card ${
              proof === "pending" ? "proof-pending" : ""
            }`}
          >
            <div className="card-heading">
              <div>
                <span className="eyebrow">FINAL STEP</span>
                <h2>Add your proof</h2>
              </div>
              {proof === "pending" && <Pill>Pending review</Pill>}
            </div>
            {proof === "pending" ? (
              <div className="pending-state">
                <div className="pending-check">
                  <Icon name="check" size={28} />
                </div>
                <div>
                  <strong>Proof sent!</strong>
                  <p>
                    We&apos;ll review it before Sunday. Your photo stays
                    private.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="proof-helper">
                  Pick one. We only use it to verify your challenge.
                </p>
                <div className="proof-options">
                  <button
                    className={proof === "photo" ? "selected" : ""}
                    onClick={() => setProof("photo")}
                    type="button"
                  >
                    <Icon name="camera" size={25} />
                    <span>Photo</span>
                    <small>Product or sale</small>
                  </button>
                  <button
                    className={proof === "receipt" ? "selected" : ""}
                    onClick={() => setProof("receipt")}
                    type="button"
                  >
                    <Icon name="receipt" size={25} />
                    <span>MoMo receipt</span>
                    <small>Hide private info</small>
                  </button>
                </div>
                {proof !== "none" && (
                  <Button
                    className="button-primary submit-proof"
                    onClick={() => setProof("pending")}
                  >
                    SUBMIT PROOF
                  </Button>
                )}
              </>
            )}
          </section>

          <div className="privacy-card">
            <Icon name="shield" size={22} />
            <p>
              <strong>Your safety matters.</strong> Proof is moderated and never
              shown publicly without your permission.
            </p>
          </div>
        </div>
      </div>
    </AppFrame>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home")

  function go(next: Screen) {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (screen === "setup") return <SetupScreen go={go} />
  if (screen === "town") return <TownScreen go={go} />
  if (screen === "results") return <ResultsScreen go={go} />
  if (screen === "challenge") return <ChallengeScreen go={go} />
  return <HomeScreen go={go} />
}
