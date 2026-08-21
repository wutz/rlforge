import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap' | 'gpu'

/*
 * 五种语气。色相只在 DESIGN.md 的品牌色板里挑（蓝 / 青 / 琥珀 / 红），
 * 不新增强调色；边框一律 1px，不用 4px 左边框那种贴纸感的重装饰。
 *
 * 「5090 单卡备注」用极性翻转的深色块 —— 这是全站最需要被看见的一类提示，
 * 而在这套语言里，翻黑就是最强的强调手段。
 */
const TONE: Record<
  Tone,
  { label: string; box: string; head: string; chip: string; body: string; icon: string }
> = {
  note: {
    label: '说明',
    box: 'border-blue-200 bg-blue-50',
    head: 'text-blue-900',
    chip: 'bg-blue-100 text-blue-700',
    body: 'text-blue-950/75',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    box: 'border-teal-200 bg-teal-50',
    head: 'text-teal-900',
    chip: 'bg-teal-100 text-teal-700',
    body: 'text-teal-950/75',
    icon: '✓',
  },
  warn: {
    label: '注意',
    box: 'border-amber-200 bg-amber-50',
    head: 'text-amber-900',
    chip: 'bg-amber-100 text-amber-800',
    body: 'text-amber-950/75',
    icon: '!',
  },
  trap: {
    label: '新手常踩的坑',
    box: 'border-red-200 bg-red-50',
    head: 'text-red-900',
    chip: 'bg-red-100 text-red-700',
    body: 'text-red-950/75',
    icon: '×',
  },
  gpu: {
    label: '5090 单卡备注',
    box: 'border-ink bg-ink',
    head: 'text-white',
    chip: 'bg-white/15 text-white',
    body: 'text-white/70',
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
    <div
      className={`my-6 rounded-lg border px-4 py-3.5 text-sm ${tone.box} ${
        // 深色块里的链接 / 行内代码要反白，规则写在 styles.css
        type === 'gpu' ? 'callout-invert' : ''
      }`}
    >
      <div className={`flex items-center gap-2 font-medium tracking-tight ${tone.head}`}>
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${tone.chip}`}
        >
          {tone.icon}
        </span>
        {title ?? tone.label}
      </div>
      <div className={`mt-1.5 leading-relaxed ${tone.body} [&>*+*]:mt-2`}>{children}</div>
    </div>
  )
}
