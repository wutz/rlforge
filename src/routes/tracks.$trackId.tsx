import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, getTrack, lessonKey } from '#/lib/curriculum'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/tracks/$trackId')({
  component: TrackPage,
})

function TrackPage() {
  const { trackId } = Route.useParams()
  const track = getTrack(trackId)
  const progress = useProgress()

  if (!track) {
    return (
      <div className="rounded-xl bg-white px-6 py-10 text-center shadow-stack-sm">
        <p className="text-gray-500">没有这个阶段:{trackId}</p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          返回学习路径
        </Link>
      </div>
    )
  }

  const doneSet = new Set(progress.done)
  const doneCount = track.lessons.filter((lesson) =>
    doneSet.has(lessonKey(track.id, lesson.id)),
  ).length
  const totalMinutes = track.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)

  return (
    <div className="space-y-6">
      <nav className="font-mono text-xs text-gray-400">
        <Link to="/" className="hover:text-gray-700">
          学习路径
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-gray-600">
          {track.level} {track.title}
        </span>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge-mono px-2 py-1 text-xs">{track.level}</span>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{track.title}</h1>
          <span className="text-sm text-gray-400">{track.subtitle}</span>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-gray-500">{track.goal}</p>
        <div className="mt-3 flex flex-wrap gap-4 font-mono text-xs text-gray-400">
          <span>
            {track.lessons.length} 节课 · 约 {Math.round(totalMinutes / 60)} 小时
          </span>
          <span>
            已完成 {doneCount}/{track.lessons.length}
          </span>
        </div>
      </header>

      <ol className="space-y-3">
        {track.lessons.map((lesson, index) => {
          const done = doneSet.has(lessonKey(track.id, lesson.id))
          return (
            <li key={lesson.id}>
              <Link
                to="/learn/$trackId/$lessonId"
                params={{ trackId: track.id, lessonId: lesson.id }}
                className="block rounded-xl bg-white px-5 py-4 shadow-stack-sm transition hover:shadow-stack-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-medium ${
                      done ? 'bg-ink text-white' : 'bg-canvas-soft-2 text-gray-500'
                    }`}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <h2 className="font-semibold">{lesson.title}</h2>
                  {lesson.kind !== 'concept' && <span className="badge-mono">{KIND_LABEL[lesson.kind]}</span>}
                  <span className="font-mono text-xs text-gray-400">{lesson.minutes} 分钟</span>
                  {lesson.status === 'planned' && (
                    <span className="badge-mono">仅大纲</span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-gray-500">{lesson.summary}</p>

                <ul className="mt-3 space-y-1 text-xs text-gray-400">
                  {lesson.objectives.map((objective) => (
                    <li key={objective} className="flex gap-1.5">
                      <span className="text-gray-300">→</span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
