import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, getTrack, lessonKey } from '#/lib/curriculum'
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
      <div className="rounded-lg bg-canvas px-6 py-12 text-center shadow-card">
        <p className="text-body">没有这个阶段：{trackId}</p>
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
    <div className="space-y-8">
      <nav className="font-mono text-xs text-mute">
        <Link to="/" className="transition hover:text-ink">
          学习路径
        </Link>
        <span className="mx-1.5 text-line-strong">/</span>
        <span className="text-body">
          {track.level} {track.title}
        </span>
      </nav>

      <header>
        <div className="eyebrow">
          {track.level} · {track.subtitle}
        </div>
        <h1 className="display-xl mt-3">{track.title}</h1>
        <p className="mt-4 max-w-3xl text-[17px] leading-relaxed text-body">{track.goal}</p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-mute">
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
                className="block rounded-md bg-canvas px-5 py-4 shadow-card transition hover:shadow-float"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                      done ? 'bg-brand-600 text-white' : 'bg-soft-2 text-mute'
                    }`}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <h2 className="display-sm">{lesson.title}</h2>
                  <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
                    {KIND_LABEL[lesson.kind]}
                  </span>
                  <span className="font-mono text-[11px] text-mute">{lesson.minutes}m</span>
                  {lesson.status === 'planned' && (
                    <span className="rounded-xs bg-soft-2 px-1.5 py-0.5 text-[11px] text-mute">
                      仅大纲
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-body">{lesson.summary}</p>

                <ul className="mt-3 space-y-1.5">
                  {lesson.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2 text-[13px] leading-relaxed text-body">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
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
