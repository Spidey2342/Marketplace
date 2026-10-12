import type { ReactNode } from "react"

export type IconName =
  | "arrow"
  | "camera"
  | "chat"
  | "check"
  | "chevron"
  | "clock"
  | "coin"
  | "group"
  | "home"
  | "lock"
  | "map"
  | "market"
  | "minus"
  | "plus"
  | "receipt"
  | "shield"
  | "spark"
  | "star"
  | "thumb"
  | "thumbDown"
  | "user"
  | "x"

export default function Icon({
  name,
  size = 20,
}: {
  name: IconName
  size?: number
}) {
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
    thumb: (
      <path d="M8 11v9H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 3.2-6.2A2 2 0 0 1 15 6.4V11h4.1a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18.1 21H8" />
    ),
    thumbDown: (
      <path d="M16 13V4h3a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-3Zm0 0-3.2 6.2A2 2 0 0 1 9 17.6V13H4.9a2 2 0 0 1-2-2.3l1-6A2 2 0 0 1 5.9 3H16" />
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
