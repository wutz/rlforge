import { useState } from 'react'
import { type TimeInput, planTime } from '#/lib/throughput'
import { formatCompact, formatDuration } from '#/lib/units'
import { Field, NoteList, Panel, Stat, inputCls } from './ui'

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

function num(value: string, min: number) {
  return Math.max(min, Number(value) || min)
}

export function TimeBudget() {
  const [input, setInput] = useState<TimeInput>(DEFAULTS)
  const result = planTime(input)

  const set = <K extends keyof TimeInput>(key: K, value: TimeInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  /* 三段时间的颜色是有含义的（哪一段最费），配色沿用显存账本那三档 */
  const parts = [
    { label: '采样', seconds: result.genSeconds, color: 'bg-plum' },
    { label: '训练', seconds: result.trainSeconds, color: 'bg-brand-500' },
    { label: '同步与切换', seconds: result.overheadSeconds, color: 'bg-line-strong' },
  ]

  return (
    <Panel eyebrow="Planner" title="一次实验要跑多久" onReset={() => setInput(DEFAULTS)}>
      <div className="grid gap-5 px-4 py-4 sm:px-5 md:grid-cols-2">
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

          <div className="rounded-md bg-warn-soft px-3.5 py-3">
            <div className="text-[11px] font-medium text-warn-deep">
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
            <div className="mt-2 text-[11px] leading-relaxed text-warn-deep/80">
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
          <Stat
            label="预计墙钟时间"
            value={formatDuration(result.totalSeconds)}
            note={`每步 ${result.stepSeconds.toFixed(1)} 秒 · 共生成 ${formatCompact(
              result.totalTokens,
            )} token`}
          />

          <div>
            <div className="mb-2 text-xs font-medium text-body">单步时间构成</div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-soft-2">
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
                  <span className="flex items-center gap-1.5 text-body">
                    <span className={`h-2 w-2 rounded-full ${part.color}`} />
                    {part.label}
                  </span>
                  <span className="font-mono tabular-nums text-ink">
                    {part.seconds.toFixed(1)}s ·{' '}
                    {((part.seconds / result.stepSeconds) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <dl className="divide-y divide-line rounded-md bg-soft-2 px-3.5 text-sm">
            {[
              ['每步序列数', `${input.promptsPerStep * input.groupSize} 条`],
              ['每步 token 数', formatCompact(result.tokensPerStep)],
              ['采样占比', `${(result.genShare * 100).toFixed(0)}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2">
                <dt className="text-body">{label}</dt>
                <dd className="font-mono text-xs tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          {result.advice.length > 0 && <NoteList items={result.advice} />}
        </div>
      </div>
    </Panel>
  )
}
