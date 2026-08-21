import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  LORA_RANKS,
  MODELS,
  TRAIN_MODE_LABEL,
  type TrainMode,
  type VramInput,
  planVram,
} from '#/lib/vram'
import { formatCompact, formatGiB } from '#/lib/units'

const DEFAULTS: VramInput = {
  modelId: 'qwen3-0.6b',
  trainMode: 'full',
  loraRank: 16,
  microBatch: 2,
  seqLen: 1024,
  gradCheckpoint: true,
  refModel: true,
  colocate: true,
  rolloutConcurrency: 16,
  rolloutLen: 1024,
  totalGiB: 32,
}

/* 表单：6px 圆角 + 发丝描边，聚焦时才把主题色请出来 */
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

/*
 * 三块占用的颜色是有含义的（训练 / 参考 / 推理各吃多少），所以保留三色；
 * 主题色给主角「训练」，另两块借 emerald 与 violet —— 都不在阶段色里。
 */
const GROUP_COLOR = {
  train: 'bg-brand-600',
  ref: 'bg-emerald-500',
  infer: 'bg-violet-500',
} as const

const GROUP_LABEL = {
  train: '训练',
  ref: '参考',
  infer: '推理',
} as const

export function VramBudget() {
  const [input, setInput] = useState<VramInput>(DEFAULTS)
  const result = planVram(input)

  const set = <K extends keyof VramInput>(key: K, value: VramInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }))

  const maxLine = Math.max(...result.lines.map((l) => l.giB), 0.001)

  return (
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e2">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
            计算器
          </span>
          <span className="truncate text-sm font-medium text-gray-800">RL 训练显存账本</span>
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
        {/* ---------- 左：参数 ---------- */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="模型">
              <select
                value={input.modelId}
                onChange={(e) => set('modelId', e.target.value)}
                className={inputCls}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="卡的显存">
              <select
                value={input.totalGiB}
                onChange={(e) => set('totalGiB', Number(e.target.value))}
                className={inputCls}
              >
                <option value={32}>32 GiB（RTX 5090）</option>
                <option value={24}>24 GiB（RTX 4090 / 5080Ti）</option>
                <option value={16}>16 GiB</option>
                <option value={80}>80 GiB（H100 对照）</option>
              </select>
            </Field>
          </div>

          <Field label="训练方式" hint={`可训练参数 ${formatCompact(result.trainableParams)}`}>
            <select
              value={input.trainMode}
              onChange={(e) => set('trainMode', e.target.value as TrainMode)}
              className={inputCls}
            >
              {(Object.keys(TRAIN_MODE_LABEL) as TrainMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {TRAIN_MODE_LABEL[mode]}
                </option>
              ))}
            </select>
          </Field>

          {input.trainMode !== 'full' && (
            <Field label="LoRA rank">
              <select
                value={input.loraRank}
                onChange={(e) => set('loraRank', Number(e.target.value))}
                className={inputCls}
              >
                {LORA_RANKS.map((r) => (
                  <option key={r} value={r}>
                    r = {r}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="micro batch" hint="单次前向的序列条数">
              <input
                type="number"
                min={1}
                max={64}
                value={input.microBatch}
                onChange={(e) => set('microBatch', Math.max(1, Number(e.target.value) || 1))}
                className={inputCls}
              />
            </Field>
            <Field label="训练序列长度" hint="prompt + completion">
              <select
                value={input.seqLen}
                onChange={(e) => set('seqLen', Number(e.target.value))}
                className={inputCls}
              >
                {[512, 1024, 2048, 4096, 8192].map((n) => (
                  <option key={n} value={n}>
                    {n} token
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3">
            <label className="flex items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={input.gradCheckpoint}
                onChange={(e) => set('gradCheckpoint', e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-600"
              />
              开梯度检查点
            </label>
            <label className="flex items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={input.refModel}
                onChange={(e) => set('refModel', e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-600"
              />
              常驻参考模型（算 KL 用）
            </label>
            <label className="flex items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={input.colocate}
                onChange={(e) => set('colocate', e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 accent-brand-600"
              />
              训推同卡（vLLM colocate）
            </label>
          </div>

          {input.colocate && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="rollout 并发" hint="同时在生成的序列数">
                <input
                  type="number"
                  min={1}
                  max={512}
                  value={input.rolloutConcurrency}
                  onChange={(e) =>
                    set('rolloutConcurrency', Math.max(1, Number(e.target.value) || 1))
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="rollout 长度" hint={`${result.kvPerTokenKiB.toFixed(0)} KiB/token`}>
                <select
                  value={input.rolloutLen}
                  onChange={(e) => set('rolloutLen', Number(e.target.value))}
                  className={inputCls}
                >
                  {[512, 1024, 2048, 4096, 8192, 16384].map((n) => (
                    <option key={n} value={n}>
                      {n} token
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        {/* ---------- 右：结果 ---------- */}
        <div className="space-y-3">
          <div
            className={`rounded-lg border px-3 py-3 text-center ${
              result.fits
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <div className="text-xs font-medium">{result.fits ? '装得下' : '装不下，会 OOM'}</div>
            <div className="mt-1 font-mono text-2xl font-medium tracking-tight">
              {formatGiB(result.totalGiB)}
            </div>
            <div className="mt-1 text-[11px] leading-snug">
              总共 {input.totalGiB} GiB ·{' '}
              {result.freeGiB >= 0
                ? `余量 ${formatGiB(result.freeGiB)}`
                : `超出 ${formatGiB(Math.abs(result.freeGiB))}`}
            </div>
          </div>

          {/* 占用条 */}
          <div className="flex h-2.5 overflow-hidden rounded-full bg-gray-100">
            {(['train', 'ref', 'infer'] as const).map((group) => {
              const giB = result.lines
                .filter((l) => l.group === group)
                .reduce((s, l) => s + l.giB, 0)
              const pct = (giB / input.totalGiB) * 100
              if (pct <= 0) return null
              return (
                <div
                  key={group}
                  className={GROUP_COLOR[group]}
                  style={{ width: `${Math.min(100, pct)}%` }}
                  title={`${GROUP_LABEL[group]} ${formatGiB(giB)}`}
                />
              )
            })}
            <div
              className="bg-gray-400"
              style={{ width: `${(result.reserveGiB / input.totalGiB) * 100}%` }}
              title={`预留 ${formatGiB(result.reserveGiB)}`}
            />
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-gray-500">
            {(['train', 'ref', 'infer'] as const).map((group) => (
              <span key={group} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${GROUP_COLOR[group]}`} />
                {GROUP_LABEL[group]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              context 与碎片预留
            </span>
          </div>

          {/* 明细 */}
          <ul className="space-y-2.5 rounded-lg border border-gray-200 px-3.5 py-3.5">
            {result.lines.map((line) => (
              <li key={line.label}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-gray-600">{line.label}</span>
                  <span className="font-mono text-xs tabular-nums text-gray-900">
                    {formatGiB(line.giB, 2)}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${GROUP_COLOR[line.group]}`}
                    style={{ width: `${(line.giB / maxLine) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] leading-snug text-gray-500">{line.note}</div>
              </li>
            ))}
          </ul>

          {result.warnings.length > 0 && (
            <ul className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
              {result.warnings.map((w) => (
                <li key={w} className="flex gap-1.5">
                  <span className="shrink-0">⚠</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}

          {result.suggestions.length > 0 && (
            <ul className="space-y-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
              {result.suggestions.map((s) => (
                <li key={s} className="flex gap-1.5">
                  <span className="shrink-0">→</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
