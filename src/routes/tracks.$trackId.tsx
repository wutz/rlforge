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
      <div className="rounded-xl border border-hairline bg-canvas px-6 py-14 text-center shadow-soft">
        <p className="text-body">没有这个阶段：{trackId}</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-body"
        >
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
  const percent =
    track.lessons.length > 0 ? Math.round((doneCount / track.lessons.length) * 100) : 0

  return (
    <div className="space-y-10">
      <nav className="font-mono text-xs text-mute">
        <Link to="/" className="transition-colors hover:text-ink">
          学习路径
        </Link>
        <span className="mx-2 text-hairline-strong">/</span>
        <span className="text-body">
          {track.level} {track.title}
        </span>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-ui px-2 py-1 font-mono text-xs font-medium ${track.accent.bg} ${track.accent.text}`}
          >
            {track.level}
          </span>
          <h1 className="text-display-lg text-ink">{track.title}</h1>
          <span className="text-sm text-mute">{track.subtitle}</span>
        </div>
        <p className="mt-4 max-w-3xl leading-relaxed text-body">{track.goal}</p>

        <div className="mt-8 flex max-w-xl items-center gap-4 border-t border-hairline pt-5">
          <span className="font-mono text-xs whitespace-nowrap text-mute">
            {track.lessons.length} 节 · 约 {Math.round(totalMinutes / 60)} 小时
          </span>
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas-soft-2">
            <div
              className="h-full rounded-full bg-ink transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs tabular-nums text-mute">
            {doneCount}/{track.lessons.length}
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
                className="group block rounded-lg border border-hairline bg-canvas px-5 py-5 shadow-soft transition hover:border-hairline-strong hover:shadow-card"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] ${
                      done ? 'bg-ink text-white' : 'bg-canvas-soft-2 text-mute'
                    }`}
                  >
                    {done ? '✓' : index + 1}
                  </span>
                  <h2 className="text-display-sm text-ink">{lesson.title}</h2>
                  <span className={`rounded px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
                    {KIND_LABEL[lesson.kind]}
                  </span>
                  <span className="font-mono text-[11px] text-mute">{lesson.minutes}m</span>
                  {lesson.status === 'planned' && (
                    <span className="rounded bg-canvas-soft-2 px-1.5 py-0.5 text-[11px] text-mute">
                      仅大纲
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-body">{lesson.summary}</p>

                <ul className="mt-3.5 space-y-1.5">
                  {lesson.objectives.map((objective) => (
                    <li key={objective} className="flex gap-2.5 text-xs leading-relaxed text-body">
                      <span className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${track.accent.dot}`} />
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
