import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, KIND_STYLE, lessonKey, stats, tracks } from '#/lib/curriculum'
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
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white px-5 py-7 shadow-soft sm:px-8 sm:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-60 w-60 rounded-full bg-brand-200/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            单卡 32GB · RL 后训练锻造场
          </div>

          <h1 className="mt-4 max-w-2xl text-2xl font-bold leading-tight tracking-tight sm:text-[2rem]">
            在一张{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
              RTX 5090
            </span>{' '}
            上把 RL 跑通
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600 sm:text-base">
            {stats.lessonCount} 节课，终点是同一个：你自己手写一份 GRPO，在单卡 32GB 上把 Qwen3-0.6B
            的数学题正确率训上去，然后换成 TRL 框架再跑一遍做对照。先挑一条和你现在情况最接近的路线 ——
            三条线共用同一份进度，随时可以切。
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              [String(stats.lessonCount), '节课'],
              [String(stats.labCount), '个动手 / 闯关'],
              [`约 ${Math.round(stats.totalMinutes / 60)} 小时`, '完整主线'],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-lg border border-brand-100 bg-white/70 px-3 py-1.5"
              >
                <span className="text-sm font-semibold text-gray-900">{value}</span>
                <span className="ml-1.5 text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {roles.map((role) => {
              const active = role.id === path.role.id
              return (
                <Link
                  key={role.id}
                  to="/"
                  search={{ role: role.id }}
                  className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-left transition ${
                    active
                      ? 'border-brand-500 bg-white shadow-card ring-1 ring-brand-200'
                      : 'border-gray-200 bg-white/60 hover:border-brand-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${active ? 'text-brand-700' : 'text-gray-700'}`}
                    >
                      {role.title}
                    </span>
                    {active && (
                      <span className="rounded-full bg-brand-600 px-1 text-[10px] font-medium text-white">
                        当前
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-500">{role.alias}</div>
                </Link>
              )
            })}
          </div>
        </div>

        <PathSummary path={path} doneSet={doneSet} />

        {path.role.layout === 'catalog' ? (
          <CatalogView doneSet={doneSet} />
        ) : (
          <StagesView path={path} doneSet={doneSet} />
        )}
      </section>
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
    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200/70 bg-white px-5 py-4 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{role.tagline}</span>
        <span className="text-xs text-gray-500">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{role.desc}</p>
      <ul className="mt-3 space-y-1">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2 text-xs leading-relaxed text-gray-600">
            <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] text-emerald-700">
              ✓
            </span>
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-gray-500">{percent}%</span>
      </div>
      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-brand-700 hover:shadow-card"
        >
          {doneCount > 0 ? '继续这条路线' : '沿这条路线开始'}
          <span className="font-normal text-brand-100">· 第 {nextUp.index} 节 {nextUp.lesson.title}</span>
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  )
}

/** 裁剪过的路线：按段列课，序号是整条路线的连续序号 */
function StagesView({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  return (
    <>
      <div className="mt-4 space-y-4">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-semibold text-gray-900">{stage.title}</h3>
              <span className="text-[11px] text-gray-400">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{stage.hint}</p>
            <ol className="mt-2 space-y-1">
              {items.map((item) => (
                <li key={item.key}>
                  <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500">
        这条线是挑着学的，没排进来的课不会消失 —— 切到「完整主线」就是按 L0–L4 通读的全部{' '}
        {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <div className="mt-4 space-y-3">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article
            key={track.id}
            className={`overflow-hidden rounded-xl border bg-white shadow-soft ${track.accent.border}`}
          >
            <header className={`flex items-start gap-3 px-4 py-3 ${track.accent.bg}`}>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold shadow-sm ${track.accent.text}`}
              >
                {track.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: track.id }}
                    className="font-bold hover:underline"
                  >
                    {track.title}
                  </Link>
                  <span className="text-[11px] text-gray-500">{track.subtitle}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{track.goal}</p>
              </div>
              <div className={`shrink-0 text-sm font-bold ${track.accent.text}`}>
                {trackDone}/{track.lessons.length}
              </div>
            </header>

            <ol className="divide-y divide-gray-100">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                const done = doneSet.has(key)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: 'full' }}
                      className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-gray-50"
                    >
                      <Marker done={done}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-gray-800">{lesson.title}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {lesson.summary}
                        </span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="shrink-0 text-[11px] text-gray-400">{lesson.minutes} 分</span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </article>
        )
      })}
    </div>
  )
}

function LessonRow({ item, roleId, done }: { item: PathItem; roleId: string; done: boolean }) {
  const { track, lesson } = item
  return (
    <Link
      to="/learn/$trackId/$lessonId"
      params={{ trackId: track.id, lessonId: lesson.id }}
      search={{ role: roleId }}
      className="group flex items-center gap-2.5 rounded-lg bg-white/80 px-3 py-2 shadow-soft transition hover:-translate-y-0.5 hover:bg-white hover:shadow-card"
    >
      <Marker done={done}>{item.index}</Marker>
      <span
        className={`shrink-0 rounded px-1 py-0.5 text-[10px] ${track.accent.bg} ${track.accent.text}`}
      >
        {track.level}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-800 transition group-hover:text-brand-700">
        {lesson.title}
      </span>
      <KindBadge kind={lesson.kind} />
      <span className="shrink-0 text-[11px] text-gray-400">{lesson.minutes} 分</span>
    </Link>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
        done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
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
      className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] sm:inline ${KIND_STYLE[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
}
