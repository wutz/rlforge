import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_STYLE, allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          实验与<span className="text-brand-600">闯关</span>
        </h1>
        <p className="mt-2 max-w-3xl leading-relaxed text-gray-600">
          RL 是一门只能靠跑才能学会的手艺 —— 公式看懂了，第一次跑起来照样会 OOM、会不收敛。
          这里把全部动手环节汇总在一起，你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${KIND_STYLE[section.kind]}`}>
                {items.length}
              </span>
              <h2 className="text-lg font-bold tracking-tight">{section.title}</h2>
              <span className="text-sm text-gray-500">{section.desc}</span>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="group flex flex-col rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-card"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded px-1.5 py-0.5 ${track.accent.bg} ${track.accent.text}`}
                      >
                        {track.level} {track.title}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 ${KIND_STYLE[lesson.kind]}`}>
                        {lesson.minutes} 分钟
                      </span>
                      {done && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-400">
                          仅大纲
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold text-gray-900 transition group-hover:text-brand-700">
                      {lesson.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{lesson.summary}</p>
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
