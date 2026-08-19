/** 显示格式化，全站统一口径 */

export function formatGiB(value: number, digits = 1) {
  return `${value.toFixed(digits)} GiB`
}

export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US')
}

/** 大数字压成 1.2B / 340M / 7.5K */
export function formatCompact(value: number) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(value >= 1e10 ? 0 : 1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(value >= 1e7 ? 0 : 1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(value >= 1e4 ? 0 : 1)}K`
  return String(Math.round(value))
}

/** 秒 → 「1 小时 23 分」 */
export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  if (seconds < 90) return `${Math.round(seconds)} 秒`
  const minutes = seconds / 60
  if (minutes < 90) return `${minutes.toFixed(0)} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  if (hours < 24) return rest > 0 ? `${hours} 小时 ${rest} 分` : `${hours} 小时`
  const days = Math.floor(hours / 24)
  return `${days} 天 ${hours % 24} 小时`
}
