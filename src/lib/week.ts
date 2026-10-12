/** ISO week ending Sunday, such as 2026-W42. Matches Postgres IYYY + IW. */
export function isoWeekId(now: number): string {
  const target = new Date(now)
  const utc = new Date(Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}
