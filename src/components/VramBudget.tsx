import { useState } from 'react'
import {
  LORA_RANKS,
  MODELS,
  TRAIN_MODE_LABEL,
  type TrainMode,
  type VramInput,
  planVram,
} from '#/lib/vram'
import { formatCompact, formatGiB } from '#/lib/units'
import { Field, NoteList, Panel, Stat, inputCls } from './ui'

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

/*
 * 三块占用的颜色是有含义的（训练 / 参考 / 推理各吃多少），所以保留三色：
 * 主题色给主角「训练」，另两块借 info 与 plum 两个语义槽。
 */
const GROUP_COLOR = {
  train: 'bg-brand-500',
  ref: 'bg-info',
  infer: 'bg-plum',
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
    <Panel eyebrow="Planner" title="RL 训练显存账本" onReset={() => setInput(DEFAULTS)}>
      <div className="grid gap-5 px-4 py-4 sm:px-5 md:grid-cols-2">
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

          <div className="space-y-2 rounded-md bg-soft-2 px-3.5 py-3">
            <label className="flex items-center gap-2.5 text-sm text-body">
              <input
                type="checkbox"
                checked={input.gradCheckpoint}
                onChange={(e) => set('gradCheckpoint', e.target.checked)}
                className="h-4 w-4 shrink-0 accent-brand-600"
              />
              开梯度检查点
            </label>
            <label className="flex items-center gap-2.5 text-sm text-body">
              <input
                type="checkbox"
                checked={input.refModel}
                onChange={(e) => set('refModel', e.target.checked)}
                className="h-4 w-4 shrink-0 accent-brand-600"
              />
              常驻参考模型（算 KL 用）
            </label>
            <label className="flex items-center gap-2.5 text-sm text-body">
              <input
                type="checkbox"
                checked={input.colocate}
                onChange={(e) => set('colocate', e.target.checked)}
                className="h-4 w-4 shrink-0 accent-brand-600"
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
          <Stat
            label={result.fits ? '装得下' : '装不下，会 OOM'}
            value={formatGiB(result.totalGiB)}
            tone={result.fits ? 'ok' : 'bad'}
            note={`总共 ${input.totalGiB} GiB · ${
              result.freeGiB >= 0
                ? `余量 ${formatGiB(result.freeGiB)}`
                : `超出 ${formatGiB(Math.abs(result.freeGiB))}`
            }`}
          />

          {/* 占用条 */}
          <div className="flex h-2.5 overflow-hidden rounded-full bg-soft-2">
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
              className="bg-line-strong"
              style={{ width: `${(result.reserveGiB / input.totalGiB) * 100}%` }}
              title={`预留 ${formatGiB(result.reserveGiB)}`}
            />
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-mute">
            {(['train', 'ref', 'infer'] as const).map((group) => (
              <span key={group} className="flex items-center gap-1">
                <span className={`h-2 w-2 rounded-full ${GROUP_COLOR[group]}`} />
                {GROUP_LABEL[group]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-line-strong" />
              context 与碎片预留
            </span>
          </div>

          {/* 明细 */}
          <ul className="space-y-2.5 rounded-md bg-soft-2 px-3.5 py-3.5">
            {result.lines.map((line) => (
              <li key={line.label}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="text-body">{line.label}</span>
                  <span className="font-mono text-xs tabular-nums text-ink">
                    {formatGiB(line.giB, 2)}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-canvas">
                  <div
                    className={`h-full rounded-full ${GROUP_COLOR[line.group]}`}
                    style={{ width: `${(line.giB / maxLine) * 100}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] leading-snug text-mute">{line.note}</div>
              </li>
            ))}
          </ul>

          {result.warnings.length > 0 && <NoteList items={result.warnings} tone="warn" />}

          {result.suggestions.length > 0 && <NoteList items={result.suggestions} />}
        </div>
      </div>
    </Panel>
  )
}
