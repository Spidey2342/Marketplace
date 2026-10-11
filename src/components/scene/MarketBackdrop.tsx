export default function MarketBackdrop({ active = false }: { active?: boolean }) {
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
