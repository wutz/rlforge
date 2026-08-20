import type { ReactNode } from 'react'

type Tone = 'note' | 'tip' | 'warn' | 'trap' | 'gpu'

/*
 * 语气色直接取自 DESIGN.md 的语义令牌:
 * note→link 蓝软底、tip→青绿、warn→琥珀、trap→红、gpu→紫(品牌近亲)。
 * 软底 + 深字 + 同色系 25% 发丝边,彩色只允许出现在这一处。
 */
const TONE: Record<Tone, { label: string; box: string; head: string; icon: string }> = {
  note: {
    label: '说明',
    box: 'border-note-soft bg-note-soft/30',
    head: 'text-note-deep',
    icon: 'i',
  },
  tip: {
    label: '实践建议',
    box: 'border-tip-soft bg-tip-soft/40',
    head: 'text-tip-deep',
    icon: '✓',
  },
  warn: {
    label: '注意',
    box: 'border-warn-soft bg-warn-soft/40',
    head: 'text-warn-deep',
    icon: '!',
  },
  trap: {
    label: '新手常踩的坑',
    box: 'border-trap-soft bg-trap-soft/40',
    head: 'text-trap-deep',
    icon: '×',
  },
  gpu: {
    label: '5090 单卡备注',
    box: 'border-gpu-soft bg-gpu-soft/40',
    head: 'text-gpu-deep',
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
    <div className={`my-5 rounded-lg border px-4 py-3 text-sm ${tone.box}`}>
      <div className={`mb-1 flex items-center gap-2 text-sm font-medium ${tone.head}`}>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 font-mono text-xs">
          {tone.icon}
        </span>
        {title ?? tone.label}
      </div>
      <div className="text-gray-700 [&>*+*]:mt-2">{children}</div>
    </div>
  )
}
