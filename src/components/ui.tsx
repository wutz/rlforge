import type { ReactNode } from 'react'

/** 表单控件基准：6px 圆角 + hairline 描边，聚焦时才亮出品牌色 */
export const inputCls =
  'w-full rounded-sm border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-body">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] leading-relaxed text-mute">{hint}</span>}
    </label>
  )
}

/** 课文里嵌的交互面板统一外壳：白卡 + hairline 分隔的标题条 */
export function Panel({
  eyebrow,
  title,
  aside,
  onReset,
  children,
}: {
  eyebrow: string
  title: string
  /** 右上角的附加信息，给不需要「重置」的演示面板用 */
  aside?: ReactNode
  onReset?: () => void
  children: ReactNode
}) {
  return (
    <section className="my-6 overflow-hidden rounded-md bg-canvas shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="eyebrow">{eyebrow}</span>
          <span className="text-sm font-medium text-ink">{title}</span>
        </div>
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 font-mono text-[11px] text-mute transition hover:text-ink"
          >
            重置
          </button>
        ) : (
          aside && <span className="shrink-0 font-mono text-[11px] text-mute">{aside}</span>
        )}
      </header>
      {children}
    </section>
  )
}

/** 数字结论块：一个大数 + 一行注解，全站只有这里允许出现超大字号 */
export function Stat({
  label,
  value,
  note,
  size = 'lg',
  tone = 'neutral',
}: {
  label: string
  value: string
  note?: ReactNode
  size?: 'lg' | 'md'
  /** 结论本身带「行 / 不行」语义时才上色，纯数字一律中性 */
  tone?: 'neutral' | 'ok' | 'bad'
}) {
  const box =
    tone === 'ok'
      ? 'bg-info-soft/50'
      : tone === 'bad'
        ? 'bg-danger-soft/50'
        : 'bg-soft-2'
  const num =
    tone === 'ok' ? 'text-info-deep' : tone === 'bad' ? 'text-danger-deep' : 'text-ink'

  return (
    <div className={`rounded-md px-4 py-4 ${box}`}>
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-1.5 font-semibold tracking-[-0.04em] ${num} ${
          size === 'lg' ? 'text-3xl' : 'text-2xl'
        }`}
      >
        {value}
      </div>
      {note && <div className="mt-1.5 text-[11px] leading-relaxed text-body">{note}</div>}
    </div>
  )
}

/** 提示清单：算出来的警告、口径说明都走这里 */
export function NoteList({ items, tone = 'note' }: { items: string[]; tone?: 'note' | 'warn' }) {
  return (
    <ul
      className={`space-y-1.5 rounded-md px-3.5 py-3 text-xs leading-relaxed ${
        tone === 'warn' ? 'bg-warn-soft text-warn-deep' : 'bg-soft-2 text-body'
      }`}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="shrink-0 font-mono">{tone === 'warn' ? '!' : '·'}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}
