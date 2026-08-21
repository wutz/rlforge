import { useState } from 'react'
import type { ReactNode } from 'react'
import { type TimeInput, planTime } from '#/lib/throughput'
import { formatCompact, formatDuration } from '#/lib/units'

const DEFAULTS: TimeInput = {
  steps: 200,
  promptsPerStep: 8,
  groupSize: 8,
  avgCompletionTokens: 400,
  genTokPerSec: 3000,
  trainTokPerSec: 9000,
  syncSeconds: 2,
  switchSeconds: 3,
}

const inputCls =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition focus:border-brand-500'

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gray-500">{hint}</span>}
    </label>
  )
}

function num(value: string, min: number) {
  return Math.max(min, Number(value) || min)
}

export function TimeBudget() {
  const [input, setInput] = useState<TimeInput>(DEFAULTS)
  const result = planTime(input)

  const set = <K extends keyof TimeInput>(key: K, value: TimeInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  /* 三段时间的颜色是有含义的（哪一段最费），沿用显存账本那三色里的两色 + 中性 */
  const parts = [
    { label: '采样', seconds: result.genSeconds, color: 'bg-violet-500' },
    { label: '训练', seconds: result.trainSeconds, color: 'bg-brand-600' },
    { label: '同步与切换', seconds: result.overheadSeconds, color: 'bg-gray-400' },
  ]

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e2">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            计算器
          </span>
          <span className="truncate text-sm font-medium text-gray-800">一次实验要跑多久</span>
        </div>
        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="shrink-0 text-xs text-gray-500 transition hover:text-gray-900"
        >
          重置
        </button>
      </header>

      <div className="grid gap-5 px-4 py-4 md:grid-cols-2">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="训练步数">
              <input
                type="number"
                min={1}
                value={input.steps}
                onChange={(e) => set('steps', num(e.target.value, 1))}
                className={inputCls}
              />
            </Field>
            <Field label="每步 prompt 数">
              <input
                type="number"
                min={1}
                value={input.promptsPerStep}
                onChange={(e) => set('promptsPerStep', num(e.target.value, 1))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="组大小 G" hint="每个 prompt 采几条">
              <input
                type="number"
                min={1}
                max={64}
                value={input.groupSize}
                onChange={(e) => set('groupSize', num(e.target.value, 1))}
                className={inputCls}
              />
            </Field>
            <Field label="平均回答长度" hint="不是 max_tokens，是实测均值">
              <input
                type="number"
                min={1}
                value={input.avgCompletionTokens}
                onChange={(e) => set('avgCompletionTokens', num(e.target.value, 1))}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="text-[11px] font-medium text-amber-900">
              下面两个数必须用你自己机器上测出来的
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Field label="生成吞吐 tok/s">
                <input
                  type="number"
                  min={1}
                  value={input.genTokPerSec}
                  onChange={(e) => set('genTokPerSec', num(e.target.value, 1))}
                  className={inputCls}
                />
              </Field>
              <Field label="训练吞吐 tok/s">
                <input
                  type="number"
                  min={1}
                  value={input.trainTokPerSec}
                  onChange={(e) => set('trainTokPerSec', num(e.target.value, 1))}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="mt-2 text-[11px] leading-relaxed text-amber-900/80">
              默认值是 Qwen3-0.6B 在单卡 5090 上的一个量级参考，不同 max_model_len、
              并发和 CUDA graph 设置能差三倍。L0「第一次推理」那一节就是去测这个数。
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="每步权重同步（秒）">
              <input
                type="number"
                min={0}
                step={0.5}
                value={input.syncSeconds}
                onChange={(e) => set('syncSeconds', num(e.target.value, 0))}
                className={inputCls}
              />
            </Field>
            <Field label="colocate 切换（秒）" hint="sleep/wake 与显存重分配">
              <input
                type="number"
                min={0}
                step={0.5}
                value={input.switchSeconds}
                onChange={(e) => set('switchSeconds', num(e.target.value, 0))}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          {/* 这个数字没有「好 / 坏」语义，所以走中性底 —— 语义色留给显存那个装不装得下 */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-center">
            <div className="text-xs font-medium text-gray-600">预计墙钟时间</div>
            <div className="mt-1 font-mono text-2xl font-medium tracking-tight text-gray-900">
              {formatDuration(result.totalSeconds)}
            </div>
            <div className="mt-1 text-[11px] leading-snug text-gray-500">
              每步 {result.stepSeconds.toFixed(1)} 秒 · 共生成 {formatCompact(result.totalTokens)}{' '}
              token
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium text-gray-700">单步时间构成</div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
              {parts.map((part) => (
                <div
                  key={part.label}
                  className={part.color}
                  style={{ width: `${(part.seconds / result.stepSeconds) * 100}%` }}
                  title={`${part.label} ${part.seconds.toFixed(1)}s`}
                />
              ))}
            </div>
            <div className="mt-2 space-y-1">
              {parts.map((part) => (
                <div key={part.label} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <span className={`h-2 w-2 rounded-full ${part.color}`} />
                    {part.label}
                  </span>
                  <span className="font-mono tabular-nums text-gray-900">
                    {part.seconds.toFixed(1)}s ·{' '}
                    {((part.seconds / result.stepSeconds) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200 px-3 text-sm">
            {[
              ['每步序列数', `${input.promptsPerStep * input.groupSize} 条`],
              ['每步 token 数', formatCompact(result.tokensPerStep)],
              ['采样占比', `${(result.genShare * 100).toFixed(0)}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2">
                <dt className="text-gray-600">{label}</dt>
                <dd className="font-mono text-xs tabular-nums text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>

          {result.advice.length > 0 && (
            <ul className="space-y-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
              {result.advice.map((a) => (
                <li key={a} className="flex gap-1.5">
                  <span className="shrink-0">→</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
