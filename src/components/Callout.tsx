import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap' | 'gpu'

/*
 * 五种语气各自一色 —— 这里的颜色是有含义的（建议 / 注意 / 坑），不是装饰，所以保留。
 * 「说明」直接用主题色：它是最中性的一档，而主题色在这套语言里就代表「信息」。
 * 「5090 单卡备注」是本站独有的一档，用 violet —— 阶段色没占这个位，不会撞。
 */
const TONE: Record<Tone, { label: string; box: string; head: string; icon: string }> = {
  note: {
    label: '说明',
    box: 'border-brand-200 bg-brand-50',
    head: 'text-brand-800',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    box: 'border-emerald-200 bg-emerald-50',
    head: 'text-emerald-800',
    icon: '✓',
  },
  warn: {
    label: '注意',
    box: 'border-amber-200 bg-amber-50',
    head: 'text-amber-900',
    icon: '!',
  },
  trap: {
    label: '新手常踩的坑',
    box: 'border-rose-200 bg-rose-50',
    head: 'text-rose-800',
    icon: '×',
  },
  gpu: {
    label: '5090 单卡备注',
    box: 'border-violet-200 bg-violet-50',
    head: 'text-violet-800',
    icon: '▣',
  },
}

export function Callout({
  type = 'note',
  title,
  children,
}: {
  type?: Tone
  title?: string
  children: ReactNode
}) {
  const tone = TONE[type]
  return (
    <div className={`my-6 rounded-lg border px-4 py-3.5 text-sm ${tone.box}`}>
      <div className={`mb-1.5 flex items-center gap-2 font-medium ${tone.head}`}>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 font-mono text-[11px]">
          {tone.icon}
        </span>
        {title ?? tone.label}
      </div>
      <div className="text-gray-700 [&>*+*]:mt-2">{children}</div>
    </div>
  )
}
