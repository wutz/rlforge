/**
 * GRPO 优势计算 —— 与 L2 手写实现里的那几行完全同构，
 * 交互组件用它来演示「同一组 reward 会得到什么样的梯度方向」。
 */

export interface GroupResult {
  advantages: number[]
  mean: number
  std: number
  /** std 接近 0：这一组没有可比较的信息，全部优势归零 */
  degenerate: boolean
}

const EPS = 1e-4

/**
 * 组内归一化：A_i = (r_i - mean) / (std + eps)
 *
 * std 用总体标准差（除 G，不是 G-1），与主流实现一致。
 * 一组全对或全错时 std=0，此处显式归零而不是让它变成 NaN —— 这是
 * 手写实现里最常见的一个 bug。
 */
export function groupAdvantages(rewards: number[]): GroupResult {
  const n = rewards.length
  if (n === 0) return { advantages: [], mean: 0, std: 0, degenerate: true }

  const mean = rewards.reduce((s, r) => s + r, 0) / n
  const variance = rewards.reduce((s, r) => s + (r - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  const degenerate = std < EPS

  return {
    advantages: degenerate ? rewards.map(() => 0) : rewards.map((r) => (r - mean) / (std + EPS)),
    mean,
    std,
    degenerate,
  }
}

/**
 * 带 clip 的单 token 策略损失（未取负，正值代表"要提升的目标"）。
 *
 * ratio = exp(logp_new - logp_old)
 * obj   = min(ratio * A, clip(ratio, 1-eps, 1+eps) * A)
 */
export function clippedObjective(ratio: number, advantage: number, epsLow: number, epsHigh: number) {
  const clipped = Math.min(Math.max(ratio, 1 - epsLow), 1 + epsHigh)
  const unclippedTerm = ratio * advantage
  const clippedTerm = clipped * advantage
  const objective = Math.min(unclippedTerm, clippedTerm)
  return {
    ratio,
    clipped,
    unclippedTerm,
    clippedTerm,
    objective,
    /** clip 是否真的生效了：生效意味着这一步的梯度被截断 */
    active: Math.abs(objective - unclippedTerm) > 1e-9,
  }
}

/**
 * k3 低方差 KL 估计（Schulman）：
 *   kl ≈ exp(logp_ref - logp) - (logp_ref - logp) - 1
 * 恒非负，且方差远小于朴素的 (logp - logp_ref)。
 */
export function klEstimateK3(logpNew: number, logpRef: number) {
  const d = logpRef - logpNew
  return Math.exp(d) - d - 1
}

/** PPO 的 critic 基线 vs GRPO 的组内基线，用于概念对照 */
export interface BaselineCompare {
  label: string
  desc: string
  extraModels: number
  extraVramFactor: number
}

export const BASELINES: BaselineCompare[] = [
  {
    label: 'PPO：学一个 critic',
    desc: '再训一个同尺寸模型来预测「这条回答大概能拿多少分」，用预测值当基线。准，但要多一份权重加一份优化器状态。',
    extraModels: 1,
    extraVramFactor: 7,
  },
  {
    label: 'GRPO：同组求均值',
    desc: '同一个 prompt 采 G 条，直接用这 G 条的平均分当基线。一分显存都不用多花，代价是每个 prompt 必须多采几条。',
    extraModels: 0,
    extraVramFactor: 0,
  },
]
