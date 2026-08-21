import { useState } from 'react'
import { clippedObjective, groupAdvantages } from '#/lib/grpo'

/** 预置几组典型形态，比自己拖滑块更快看出规律 */
const PRESETS: { label: string; hint: string; rewards: number[] }[] = [
  { label: '有对有错', hint: '最理想的一组：优势有正有负，梯度方向明确', rewards: [1, 1, 0, 0, 1, 0, 0, 0] },
  { label: '只有一条对', hint: '稀疏成功：那一条会被赋予很大的正优势', rewards: [0, 0, 0, 1, 0, 0, 0, 0] },
  { label: '全对', hint: 'std = 0，整组优势归零 —— 这一批采样完全白费', rewards: [1, 1, 1, 1, 1, 1, 1, 1] },
  { label: '全错', hint: '同样 std = 0。题目太难时会大面积出现', rewards: [0, 0, 0, 0, 0, 0, 0, 0] },
  { label: '带格式分', hint: '复合 reward：格式分让分数连续，避免整组归零', rewards: [1.2, 0.2, 0.2, 1.2, 0.2, 0, 0.2, 1.2] },
]

const inputCls =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500'

export function GrpoAdvantage() {
  const [rewards, setRewards] = useState<number[]>(PRESETS[0].rewards)
  const [presetHint, setPresetHint] = useState(PRESETS[0].hint)
  const [ratio, setRatio] = useState(1)
  const [eps, setEps] = useState(0.2)

  const result = groupAdvantages(rewards)
  const maxAbs = Math.max(...result.advantages.map((a) => Math.abs(a)), 0.5)

  function setReward(index: number, value: number) {
    setRewards((prev) => prev.map((r, i) => (i === index ? value : r)))
    setPresetHint('自己改过的一组')
  }

  function resize(size: number) {
    setRewards((prev) => {
      if (size <= prev.length) return prev.slice(0, size)
      return [...prev, ...Array.from({ length: size - prev.length }, () => 0)]
    })
  }

  /** 用组里第一条的优势演示 clip：正优势时看上界，负优势时看下界 */
  const demoAdvantage = result.advantages[0] ?? 0
  const clip = clippedObjective(ratio, demoAdvantage, eps, eps)

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e2">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            演示
          </span>
          <span className="truncate text-sm font-medium text-gray-800">GRPO 优势与 clip</span>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-gray-500">G = {rewards.length}</span>
      </header>

      <div className="px-4 py-4">
        {/* 预设 */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setRewards(preset.rewards)
                setPresetHint(preset.hint)
              }}
              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
          <select
            value={rewards.length}
            onChange={(e) => resize(Number(e.target.value))}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700"
          >
            {[4, 6, 8, 12, 16].map((n) => (
              <option key={n} value={n}>
                G = {n}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2.5 text-xs leading-relaxed text-gray-500">{presetHint}</p>

        {/* 组内明细 */}
        <div className="mt-4 space-y-1.5">
          {rewards.map((reward, i) => {
            const advantage = result.advantages[i] ?? 0
            const pct = (Math.abs(advantage) / maxAbs) * 50
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-12 shrink-0 font-mono text-[11px] text-gray-500">#{i + 1}</span>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.1}
                  value={reward}
                  onChange={(e) => setReward(i, Number(e.target.value))}
                  className="w-24 shrink-0 accent-brand-600"
                />
                <span className="w-10 shrink-0 font-mono text-[11px] text-gray-700">
                  {reward.toFixed(1)}
                </span>
                {/* 优势条：以中线为零点，向右为正 */}
                <div className="relative h-4 min-w-0 flex-1 rounded bg-gray-50">
                  <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300" />
                  <div
                    className={`absolute top-0.5 h-3 rounded ${
                      advantage >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={
                      advantage >= 0
                        ? { left: '50%', width: `${pct}%` }
                        : { right: '50%', width: `${pct}%` }
                    }
                  />
                </div>
                <span
                  className={`w-14 shrink-0 text-right font-mono text-[11px] ${
                    advantage > 0
                      ? 'text-emerald-700'
                      : advantage < 0
                        ? 'text-rose-700'
                        : 'text-gray-500'
                  }`}
                >
                  {advantage >= 0 ? '+' : ''}
                  {advantage.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-xs text-gray-700">
          <span>mean = {result.mean.toFixed(3)}</span>
          <span>std = {result.std.toFixed(3)}</span>
          <span>
            Σadv = {result.advantages.reduce((s, a) => s + a, 0).toFixed(3)}
            <span className="ml-1 font-sans text-[10px] text-gray-500">（恒为 0）</span>
          </span>
        </div>

        {result.degenerate && (
          <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-relaxed text-rose-900">
            <strong className="font-medium">std = 0，整组优势归零。</strong>
            这一批采样对参数更新没有任何贡献，等于白跑一次 rollout。
            这是 GRPO 最主要的效率损失来源：题目太简单（全对）或太难（全错）都会触发。
            对策是筛掉这类 prompt（DAPO 的动态采样）或加入连续的格式分让分数不再只有 0 和 1。
          </div>
        )}

        {/* clip 演示 */}
        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="text-xs font-medium text-gray-900">
            拿 #1 这条（优势 {demoAdvantage >= 0 ? '+' : ''}
            {demoAdvantage.toFixed(2)}）看 clip 在做什么
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-gray-700">
                ratio = exp(new − old) ：{ratio.toFixed(2)}
              </span>
              <input
                type="range"
                min={0.5}
                max={1.8}
                step={0.02}
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
              <span className="mt-1.5 block text-[11px] leading-snug text-gray-500">
                训练刚开始时恒等于 1；同一批数据反复更新几次后才会偏离
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-gray-700">clip 阈值 ε：{eps.toFixed(2)}</span>
              <select
                value={eps}
                onChange={(e) => setEps(Number(e.target.value))}
                className={inputCls}
              >
                {[0.1, 0.2, 0.28, 0.5].map((v) => (
                  <option key={v} value={v}>
                    ε = {v}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <dl className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 px-3 text-sm">
            {[
              ['未截断项 ratio × A', clip.unclippedTerm.toFixed(3)],
              [`截断后 clip(ratio) = ${clip.clipped.toFixed(2)}`, clip.clippedTerm.toFixed(3)],
              ['取 min 之后的目标', clip.objective.toFixed(3)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2">
                <dt className="text-gray-600">{label}</dt>
                <dd className="font-mono text-xs tabular-nums text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div
            className={`mt-2.5 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${
              clip.active
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-gray-200 bg-gray-50 text-gray-700'
            }`}
          >
            {clip.active ? (
              <>
                <strong className="font-medium">clip 生效了。</strong>
                取 min 之后目标被压住，这一步在这个 token 上的梯度是 0 —— 也就是说
                「这条已经改得够多了，这一批别再往这个方向推」。日志里的 clip 比例就是统计这个。
              </>
            ) : (
              <>
                <strong className="font-medium">clip 未生效。</strong>
                更新幅度还在信任区间内，梯度按 ratio × A 正常传。训练健康时大部分 token 都在这个状态。
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
