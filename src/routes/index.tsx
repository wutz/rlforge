import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, LEVEL_CHIP, lessonKey, stats, tracks } from '#/lib/curriculum'
import { type PathItem, type RolePath, getRole, rolePath, roles } from '#/lib/roles'
import { useProgress } from '#/lib/progress'

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): { role?: string } => {
    const role = typeof search.role === 'string' ? search.role : undefined
    return getRole(role) ? { role } : {}
  },
  component: Home,
})

function Home() {
  const { role: roleParam } = Route.useSearch()
  const path = rolePath(roleParam) ?? rolePath(roles[0].id)!

  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div className="space-y-10">
      <section>
        <div className="eyebrow">
          {stats.lessonCount} lessons · {stats.trackCount} levels · {roles.length} tracks
        </div>
        <h1 className="display-2xl mt-3">选一条路线。</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-body">
          {stats.lessonCount} 节课不必都学。终点是同一个：你自己手写一份 GRPO，在单卡 32GB 上把
          Qwen3-0.6B 的数学题正确率训上去，再换成 TRL 框架跑一遍做对照。
          想看全貌就切到「完整主线」，那条是不做裁剪的全部 {stats.lessonCount} 节。
        </p>
      </section>

      <section>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((role) => {
            const active = role.id === path.role.id
            return (
              <Link
                key={role.id}
                to="/"
                search={{ role: role.id }}
                /* 选中态用左侧一道品牌色竖条挑明，光靠白底和阴影在窄屏上分不出来 */
                className={`rounded-md border-l-2 px-4 py-3 text-left transition ${
                  active
                    ? 'border-brand-600 bg-canvas shadow-soft'
                    : 'border-transparent bg-soft-2 text-body hover:bg-canvas hover:shadow-card'
                }`}
              >
                <div className={`text-sm font-medium ${active ? 'text-ink' : 'text-body'}`}>
                  {role.title}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-mute">{role.alias}</div>
              </Link>
            )
          })}
        </div>

        <PathSummary path={path} doneSet={doneSet} />
      </section>

      {path.role.layout === 'catalog' ? (
        <CatalogView doneSet={doneSet} />
      ) : (
        <StagesView path={path} doneSet={doneSet} />
      )}
    </div>
  )
}

/** 路线简介卡：诉求一句话 + 规模 + 裁剪说明 + 产出 + 进度 + 入口 */
function PathSummary({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  const { role, items, lessonCount, minutes } = path
  const doneCount = items.filter((item) => doneSet.has(item.key)).length
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0
  const nextUp = items.find((item) => !doneSet.has(item.key)) ?? items[0]

  return (
    <div className="mt-3 rounded-lg bg-canvas px-5 py-5 shadow-soft sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="display-md">{role.tagline}</h2>
        <span className="font-mono text-xs text-mute">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-body">{role.desc}</p>

      <ul className="mt-4 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2 text-sm leading-relaxed text-body">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-soft-2">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-mute">{percent}%</span>
      </div>

      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className="mt-5 inline-flex items-center rounded-sm bg-brand-500 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-brand-600 hover:text-white"
        >
          {doneCount > 0 ? '继续这条路线' : '沿这条路线开始'} · 第 {nextUp.index} 节{' '}
          {nextUp.lesson.title}
        </Link>
      )}
    </div>
  )
}

/** 裁剪过的路线：按段列课，序号是整条路线的连续序号 */
function StagesView({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  return (
    <section className="space-y-8">
      {path.stages.map(({ stage, items, minutes }, index) => (
        <div key={stage.title}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="eyebrow">Stage {index + 1}</span>
            <h3 className="display-sm">{stage.title}</h3>
            <span className="font-mono text-[11px] text-mute">
              {items.length} 节 · {minutes} 分钟
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-body">{stage.hint}</p>
          <ol className="mt-3 divide-y divide-line overflow-hidden rounded-md bg-canvas shadow-card">
            {items.map((item) => (
              <li key={item.key}>
                <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
              </li>
            ))}
          </ol>
        </div>
      ))}
      <p className="text-sm leading-relaxed text-mute">
        这条线是挑着学的，没排进来的课不会消失 —— 切到「完整主线」就是按 L0–L4 通读的全部{' '}
        {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </section>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <section className="space-y-4">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article key={track.id} className="overflow-hidden rounded-md bg-canvas shadow-card">
            <header className="flex items-start gap-3 border-b border-line bg-soft px-4 py-3.5 sm:px-5">
              <span className="mt-0.5 shrink-0 rounded-xs bg-canvas px-2 py-1 font-mono text-xs text-ink shadow-hair">
                {track.level}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: track.id }}
                    className="text-[15px] font-semibold tracking-[-0.02em] hover:underline"
                  >
                    {track.title}
                  </Link>
                  <span className="font-mono text-[11px] text-mute">{track.subtitle}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-body">{track.goal}</p>
              </div>
              <span className="shrink-0 font-mono text-xs text-mute">
                {trackDone}/{track.lessons.length}
              </span>
            </header>

            <ol className="divide-y divide-line">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                const done = doneSet.has(key)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: 'full' }}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-soft sm:px-5"
                    >
                      <Marker done={done}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{lesson.title}</span>
                        <span className="block truncate text-xs text-mute">{lesson.summary}</span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="shrink-0 font-mono text-[11px] text-mute">
                        {lesson.minutes}m
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </article>
        )
      })}
    </section>
  )
}

function LessonRow({ item, roleId, done }: { item: PathItem; roleId: string; done: boolean }) {
  const { track, lesson } = item
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId: track.id, lessonId: lesson.id }}
      search={{ role: roleId }}
      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-soft sm:px-5"
    >
      <Marker done={done}>{item.index}</Marker>
      <span className={LEVEL_CHIP}>{track.level}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{lesson.title}</span>
      <KindBadge kind={lesson.kind} />
      <span className="shrink-0 font-mono text-[11px] text-mute">{lesson.minutes}m</span>
    </Link>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${
        done ? 'bg-brand-500 text-ink' : 'bg-soft-2 text-mute'
      }`}
    >
      {done ? '✓' : children}
    </span>
  )
}

/** 「原理」是默认形态，只给动手环节挂徽标 */
function KindBadge({ kind }: { kind: keyof typeof KIND_LABEL }) {
  if (kind === 'concept') return null
  return (
    <span
      className={`hidden shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] sm:inline ${KIND_STYLE[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
}
