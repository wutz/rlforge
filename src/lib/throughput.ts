/**
 * 时间账 —— 用 L0 里实测的 tok/s 反推一次实验要跑多久。
 *
 * 这里刻意不内置任何"5090 的标准吞吐"：同一张卡在不同 max_model_len、
 * 不同并发、开不开 CUDA graph 下能差三倍。用户必须填自己测出来的数字，
 * 这也是 L0「first-inference」那一节存在的理由。
 */

export interface TimeInput {
  /** 训练步数（一步 = 采一批 + 更新一次） */
  steps: number
  /** 每步的 prompt 数 */
  promptsPerStep: number
  /** 每个 prompt 采几条（GRPO 的 G） */
  groupSize: number
  /** 平均回答长度（token），不是 max_tokens */
  avgCompletionTokens: number
  /** 实测的生成吞吐，整机聚合 tok/s */
  genTokPerSec: number
  /** 实测的训练吞吐，前向+反向合计 tok/s */
  trainTokPerSec: number
  /** 每步权重同步耗时，秒。单卡 colocate 一般 1~3 秒 */
  syncSeconds: number
  /** colocate 的切换开销（sleep/wake + 显存重分配），每步秒数 */
  switchSeconds: number
}

export interface TimeResult {
  /** 每步生成的 token 总数 */
  tokensPerStep: number
  genSeconds: number
  trainSeconds: number
  overheadSeconds: number
  stepSeconds: number
  totalSeconds: number
  genShare: number
  totalTokens: number
  /** 按性价比排序的省时建议 */
  advice: string[]
}

export function planTime(input: TimeInput): TimeResult {
  const seqPerStep = Math.max(1, input.promptsPerStep) * Math.max(1, input.groupSize)
  const tokensPerStep = seqPerStep * Math.max(1, input.avgCompletionTokens)

  const genSeconds = tokensPerStep / Math.max(1, input.genTokPerSec)
  const trainSeconds = tokensPerStep / Math.max(1, input.trainTokPerSec)
  const overheadSeconds = Math.max(0, input.syncSeconds) + Math.max(0, input.switchSeconds)

  const stepSeconds = genSeconds + trainSeconds + overheadSeconds
  const totalSeconds = stepSeconds * Math.max(1, input.steps)
  const genShare = stepSeconds > 0 ? genSeconds / stepSeconds : 0

  const advice: string[] = []
  if (genShare > 0.6) {
    advice.push(
      `采样占了 ${(genShare * 100).toFixed(0)}% 的时间。先降 max_completion_length —— 长度对总时间是线性的，而且过长的回答本来就多半是废话。`,
    )
    advice.push('其次是提高 rollout 并发：吞吐没打满时，加并发几乎是白捡的。')
  } else {
    advice.push(
      `训练侧占了 ${((trainSeconds / stepSeconds) * 100).toFixed(0)}%。开梯度检查点会让这一头更慢，先确认显存真的紧张再开。`,
    )
  }
  if (overheadSeconds / stepSeconds > 0.25) {
    advice.push(
      `每步固定开销 ${overheadSeconds.toFixed(1)} 秒，占了 ${((overheadSeconds / stepSeconds) * 100).toFixed(0)}%。把每步的 batch 调大，让固定开销摊薄。`,
    )
  }
  if (input.groupSize > 8) {
    advice.push(`G=${input.groupSize} 偏大。G 从 16 降到 8 直接省一半采样时间，通常只轻微增大优势估计的方差。`)
  }
  if (input.groupSize < 4) {
    advice.push(`G=${input.groupSize} 偏小：组内基线的估计会很不稳，容易出现整组优势归零。一般不低于 4。`)
  }
  if (totalSeconds > 12 * 3600) {
    advice.push('总时长超过 12 小时。先用十分之一的步数跑一遍冒烟测试，确认曲线方向对了再放长。')
  }

  return {
    tokensPerStep,
    genSeconds,
    trainSeconds,
    overheadSeconds,
    stepSeconds,
    totalSeconds,
    genShare,
    totalTokens: tokensPerStep * Math.max(1, input.steps),
    advice,
  }
}
