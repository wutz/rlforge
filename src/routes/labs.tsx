import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/labs')({
  component: LabsPage,
})

const SECTIONS: { kind: LessonKind; title: string; desc: string }[] = [
  {
    kind: 'lab',
    title: '动手实验',
    desc: '需要一张 RTX 5090（或任意 ≥24GB 的卡），跟着步骤把训练真的跑起来。',
  },
  {
    kind: 'quest',
    title: '闯关',
    desc: '在模拟终端里接手一次出问题的训练，从日志和曲线里找出根因。',
  },
  {
    kind: 'planner',
    title: '计算器',
    desc: '改参数看结果：显存装不装得下、一次实验要跑多久。',
  },
]

function LabsPage() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-14">
      <header>
        <div className="eyebrow">动手环节</div>
        <h1 className="mt-2.5 text-display-lg text-ink">实验与闯关。</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-body">
          RL 是一门只能靠跑才能学会的手艺 —— 公式看懂了，第一次跑起来照样会 OOM、会不收敛。
          这里把全部动手环节汇总在一起，你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-hairline pb-3">
              <h2 className="text-display-sm text-ink">{section.title}</h2>
              <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] ${KIND_STYLE[section.kind]}`}>
                {items.length} {KIND_LABEL[section.kind]}
              </span>
              <span className="text-sm text-body">{section.desc}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="group flex flex-col rounded-lg border border-hairline bg-canvas px-5 py-4 shadow-soft transition hover:border-hairline-strong hover:shadow-card"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${track.accent.bg} ${track.accent.text}`}
                      >
                        {track.level} {track.title}
                      </span>
                      <span className="font-mono text-[11px] text-mute">{lesson.minutes}m</span>
                      {done && (
                        <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="rounded bg-canvas-soft-2 px-1.5 py-0.5 text-[10px] text-mute">
                          仅大纲
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2.5 font-medium tracking-tight text-ink">{lesson.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-body">{lesson.summary}</p>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
