import { Link, createFileRoute } from '@tanstack/react-router'
import { allLessons, lessonKey, type LessonKind } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/labs')({
  component: LabsPage,
})

const SECTIONS: { kind: LessonKind; title: string; desc: string }[] = [
  {
    kind: 'lab',
    title: '动手实验',
    desc: '需要一张 RTX 5090(或任意 ≥24GB 的卡),跟着步骤把训练真的跑起来。',
  },
  {
    kind: 'quest',
    title: '闯关',
    desc: '在模拟终端里接手一次出问题的训练,从日志和曲线里找出根因。',
  },
  {
    kind: 'planner',
    title: '计算器',
    desc: '改参数看结果:显存装不装得下、一次实验要跑多久。',
  },
]

function LabsPage() {
  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-10">
      <header className="mx-auto max-w-3xl pt-4 text-center">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-mono text-xs text-gray-500 shadow-hairline">
          LABS · {allLessons.filter(({ lesson }) => lesson.kind !== 'concept').length} 个动手环节
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tighter sm:text-4xl sm:tracking-[-0.035em]">
          实验与闯关。
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-500">
          RL 是一门只能靠跑才能学会的手艺 —— 公式看懂了,第一次跑起来照样会 OOM、会不收敛。
          这里把全部动手环节汇总在一起,你可以脱离课程顺序直接来练。
        </p>
      </header>

      {SECTIONS.map((section) => {
        const items = allLessons.filter(({ lesson }) => lesson.kind === section.kind)
        if (!items.length) return null

        return (
          <section key={section.kind}>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
              <span className="text-sm text-gray-400">{section.desc}</span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {items.map(({ track, lesson }) => {
                const done = doneSet.has(lessonKey(track.id, lesson.id))
                return (
                  <Link
                    key={`${track.id}/${lesson.id}`}
                    to="/learn/$trackId/$lessonId"
                    params={{ trackId: track.id, lessonId: lesson.id }}
                    className="flex flex-col rounded-xl bg-white px-5 py-4 shadow-stack-sm transition hover:shadow-stack-md"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="badge-mono">
                        {track.level} {track.title}
                      </span>
                      <span className="badge-mono">{lesson.minutes} 分钟</span>
                      {done && (
                        <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white">
                          已完成
                        </span>
                      )}
                      {lesson.status === 'planned' && <span className="badge-mono">仅大纲</span>}
                    </div>
                    <h3 className="mt-2.5 font-semibold">{lesson.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{lesson.summary}</p>
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
