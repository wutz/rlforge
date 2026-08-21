import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap' | 'gpu'

/*
 * 五种语气各占一个语义色槽，颜色只落在左边那道细线和标签上，正文一律走中性色 ——
 * 整块铺底色会把课文切得七零八落。
 *
 * gpu 是本站独有的一档（5090 单卡备注），借 plum；plum 另一处用在「计算器」徽标上，
 * 语境不同不会混。
 */
const TONE: Record<Tone, { label: string; rule: string; head: string; icon: string }> = {
  note: {
    label: '说明',
    rule: 'bg-line-strong',
    head: 'text-body',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    rule: 'bg-info',
    head: 'text-info-deep',
    icon: '✓',
  },
  warn: {
    label: '注意',
    rule: 'bg-warn',
    head: 'text-warn-deep',
    icon: '!',
  },
  trap: {
    label: '新手常踩的坑',
    rule: 'bg-danger',
    head: 'text-danger-deep',
    icon: '×',
  },
  gpu: {
    label: '5090 单卡备注',
    rule: 'bg-plum',
    head: 'text-plum-deep',
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
    <div className="my-6 flex overflow-hidden rounded-md bg-canvas text-sm shadow-card">
      <span className={`w-0.5 shrink-0 ${tone.rule}`} />
      <div className="min-w-0 flex-1 px-4 py-3.5">
        <div className={`mb-1.5 flex items-center gap-2 ${tone.head}`}>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-soft-2 font-mono text-[10px]">
            {tone.icon}
          </span>
          <span className="font-medium">{title ?? tone.label}</span>
        </div>
        <div className="text-body [&>*+*]:mt-2">{children}</div>
      </div>
    </div>
  )
}
