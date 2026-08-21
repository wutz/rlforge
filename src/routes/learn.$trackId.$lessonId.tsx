import { MDXProvider } from '@mdx-js/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  KIND_LABEL,
  KIND_STYLE,
  LEVEL_CHIP,
  getFlatNeighbors,
  getLesson,
  lessonKey,
} from '#/lib/curriculum'
import { getLessonContent } from '#/lib/content'
import { getRole, roleNav } from '#/lib/roles'
import { setLessonDone, useProgress } from '#/lib/progress'
import { LessonKeyContext } from '#/components/lesson-context'
import { mdxComponents } from '#/components/mdx-components'

export const Route = createFileRoute('/learn/$trackId/$lessonId')({
  validateSearch: (search: Record<string, unknown>): { role?: string } => {
    const role = typeof search.role === 'string' ? search.role : undefined
    return getRole(role) ? { role } : {}
  },
  component: LessonPage,
})

function LessonPage() {
  const { trackId, lessonId } = Route.useParams()
  const { role: roleId } = Route.useSearch()
  const found = getLesson(trackId, lessonId)
  const progress = useProgress()

  if (!found) {
    return (
      <div className="rounded-lg bg-canvas px-6 py-12 text-center shadow-card">
        <p className="text-body">
          没有这节课：{trackId}/{lessonId}
        </p>
        <Link to="/" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
          返回学习路径
        </Link>
      </div>
    )
  }

  const { track, lesson } = found
  const key = lessonKey(track.id, lesson.id)
  const Content = getLessonContent(track.id, lesson.id)
  const done = progress.done.includes(key)
  const passedCheckpoints = progress.quiz.filter((q) => q.startsWith(`${key}#`)).length

  /* 带 ?role= 进来就是"路线模式"：前后课按路线顺序走，而不是按 L0→L4 的全局顺序 */
  const nav = roleNav(roleId, key)
  const inPath = nav?.current !== undefined
  const search = inPath ? { role: roleId } : {}
  const flat = getFlatNeighbors(track.id, lesson.id)
  const prev = inPath ? nav?.prev : flat.prev
  const next = inPath ? nav?.next : flat.next

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-10">
      {/*
        正文列封顶 48rem —— 再宽一行就能排到四十几个汉字，眼睛回行时容易串行。
        阅读宽度是这一页最该管住的东西。
      */}
      <article className="min-w-0 max-w-[48rem]">
        <nav className="font-mono text-xs text-mute">
          <Link to="/" className="transition hover:text-ink">
            学习路径
          </Link>
          <span className="mx-1.5 text-line-strong">/</span>
          <Link
            to="/tracks/$trackId"
            params={{ trackId: track.id }}
            className="transition hover:text-ink"
          >
            {track.level} {track.title}
          </Link>
        </nav>

        <RoleBanner nav={nav} track={track} lesson={lesson} />

        <header className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-xs px-1.5 py-0.5 text-[11px] ${KIND_STYLE[lesson.kind]}`}>
              {KIND_LABEL[lesson.kind]}
            </span>
            <span className="font-mono text-[11px] text-mute">预计 {lesson.minutes} 分钟</span>
            {passedCheckpoints > 0 && (
              <span className="rounded-xs bg-info-soft px-1.5 py-0.5 text-[11px] text-info-deep">
                检查点 {passedCheckpoints} ✓
              </span>
            )}
          </div>
          <h1 className="display-xl mt-3">{lesson.title}</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-body">{lesson.summary}</p>
        </header>

        <section className="mt-6 rounded-md bg-canvas px-5 py-4 shadow-card">
          <h2 className="eyebrow">学完这节你能做到</h2>
          <ul className="mt-2.5 space-y-2 text-sm leading-relaxed text-body">
            {lesson.objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                {objective}
              </li>
            ))}
          </ul>
        </section>

        <LessonKeyContext.Provider value={key}>
          <div className="lesson-body mt-10">
            {Content ? (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            ) : (
              <OutlinePlaceholder outline={lesson.outline} />
            )}
          </div>
        </LessonKeyContext.Provider>

        {lesson.refs && lesson.refs.length > 0 && (
          <section className="mt-10 rounded-md bg-canvas px-5 py-4 shadow-card">
            <h2 className="eyebrow">延伸资料</h2>
            <ul className="mt-2.5 space-y-2 text-sm">
              {lesson.refs.map((ref) => (
                <li key={ref.label + (ref.path ?? ref.href ?? '')} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                  {ref.href ? (
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      {ref.label} ↗
                    </a>
                  ) : (
                    <span className="text-body">
                      {ref.label}
                      {ref.path && (
                        <code className="ml-1.5 rounded-xs bg-soft-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                          {ref.path}
                        </code>
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLessonDone(key, !done)}
            className={`rounded-sm px-4 py-2.5 text-sm font-medium transition ${
              done
                ? 'bg-soft-2 text-body shadow-hair hover:text-ink'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {done ? '✓ 已标记完成（点击取消）' : '标记为已完成'}
          </button>
          {next ? (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: next.track.id, lessonId: next.lesson.id }}
              search={search}
              className="rounded-sm bg-canvas px-4 py-2.5 text-sm font-medium text-ink shadow-card transition hover:shadow-float"
            >
              下一课：{next.lesson.title} →
            </Link>
          ) : (
            inPath && (
              <span className="text-sm text-mute">
                这是「{nav?.path.role.title}」路线的最后一节 🎉
              </span>
            )
          )}
        </div>

        {prev && (
          <nav className="mt-5">
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: prev.track.id, lessonId: prev.lesson.id }}
              search={search}
              className="text-sm text-mute transition hover:text-ink"
            >
              ← {prev.lesson.title}
            </Link>
          </nav>
        )}
      </article>

      <aside className="mt-12 lg:mt-0">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md bg-canvas px-3 py-4 shadow-card">
          {nav && inPath ? (
            <>
              <div className="px-2">
                <div className="eyebrow">{nav.path.role.title}</div>
                <div className="mt-1 font-mono text-[11px] text-mute">
                  第 {nav.current?.index} / {nav.path.lessonCount} 节
                </div>
              </div>
              <ol className="mt-3 space-y-3 text-sm">
                {nav.path.stages.map(({ stage, items }) => (
                  <li key={stage.title}>
                    <div className="px-2 text-[11px] font-medium text-mute">{stage.title}</div>
                    <ol className="mt-1 space-y-0.5">
                      {items.map((item) => (
                        <li key={item.key}>
                          <SidebarLink
                            trackId={item.track.id}
                            lessonId={item.lesson.id}
                            title={item.lesson.title}
                            level={item.track.level}
                            search={search}
                            active={item.key === key}
                            done={progress.done.includes(item.key)}
                          />
                        </li>
                      ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <div className="px-2">
                <div className="eyebrow">
                  {track.level} · {track.title}
                </div>
              </div>
              <ol className="mt-3 space-y-0.5 text-sm">
                {track.lessons.map((item) => (
                  <li key={item.id}>
                    <SidebarLink
                      trackId={track.id}
                      lessonId={item.id}
                      title={item.title}
                      search={{}}
                      active={item.id === lesson.id}
                      done={progress.done.includes(lessonKey(track.id, item.id))}
                    />
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

/** 路线模式的提示条：这是第几节、属于哪一段，以及退出路线的出口 */
function RoleBanner({
  nav,
  track,
  lesson,
}: {
  nav: ReturnType<typeof roleNav>
  track: { id: string }
  lesson: { id: string }
}) {
  if (!nav) return null

  // 带了 ?role= 但这节课不在那条路线里：说清楚，并给一条回去的路
  if (!nav.current) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm bg-warn-soft px-3.5 py-2.5 text-xs">
        <span className="text-warn-deep">这一节没排进「{nav.path.role.title}」路线</span>
        <Link
          to="/"
          search={{ role: nav.path.role.id }}
          className="ml-auto font-medium text-warn-deep underline hover:no-underline"
        >
          回到路线 →
        </Link>
      </div>
    )
  }

  const percent = Math.round((nav.current.index / nav.path.lessonCount) * 100)

  return (
    <div className="mt-4 rounded-sm bg-canvas px-3.5 py-2.5 shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-ink">{nav.path.role.title} 路线</span>
        <span className="font-mono text-mute">
          {nav.current.index} / {nav.path.lessonCount}
          {nav.stage && <span className="font-sans"> · {nav.stage.title}</span>}
        </span>
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: track.id, lessonId: lesson.id }}
          search={{}}
          className="ml-auto text-mute transition hover:text-ink"
        >
          退出路线
        </Link>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-soft-2">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function SidebarLink({
  trackId,
  lessonId,
  title,
  level,
  search,
  active,
  done,
}: {
  trackId: string
  lessonId: string
  title: string
  level?: string
  search: { role?: string }
  active: boolean
  done: boolean
}) {
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId, lessonId }}
      search={search}
      className={`flex gap-1.5 rounded-sm px-2 py-1.5 text-[13px] leading-snug transition ${
        active ? 'bg-soft-2 font-medium text-ink' : 'text-body hover:bg-soft'
      }`}
    >
      <span
        className={`shrink-0 font-mono text-[11px] ${done ? 'text-brand-600' : 'text-line-strong'}`}
      >
        {done ? '✓' : '○'}
      </span>
      <span className="min-w-0">
        {level && <span className={`mr-1 ${LEVEL_CHIP}`}>{level}</span>}
        {title}
      </span>
    </Link>
  )
}

function OutlinePlaceholder({ outline }: { outline: string[] }) {
  return (
    <div className="rounded-md border border-dashed border-line-strong/50 bg-canvas px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-xs bg-soft-2 px-2 py-0.5 text-xs text-body">正文待编写</span>
        <span className="text-xs text-mute">以下是本节已定稿的小节大纲</span>
      </div>
      <ol className="mt-4 space-y-2">
        {outline.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-body">
            <span className="w-5 shrink-0 text-right font-mono text-xs text-mute">{index + 1}</span>
            {item}
          </li>
        ))}
      </ol>
    </div>
  )
}
