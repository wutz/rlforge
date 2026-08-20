import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { KIND_LABEL, lessonKey, stats, tracks } from '#/lib/curriculum'
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

  const nextUp = path.items.find((item) => !doneSet.has(item.key)) ?? path.items[0]

  return (
    <div>
      {/* hero:mono 徽标 + 负字距大标题 + 双胶囊 CTA,不加任何底色框 */}
      <section className="mx-auto max-w-3xl pt-4 text-center sm:pt-10">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1 font-mono text-xs text-gray-500 shadow-hairline">
          RTX 5090 · 32GB · 单卡基准
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tighter text-balance sm:text-5xl sm:tracking-[-0.045em]">
          在一张 5090 上把 RL 跑通。
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          {stats.lessonCount} 节课,终点是同一个:你自己手写一份 GRPO,在单卡 32GB 上把
          Qwen3-0.6B 的数学题正确率训上去,然后换成 TRL 框架再跑一遍做对照。
          先挑一条和你现在情况最接近的路线 —— 三条线共用同一份进度,随时可以切。
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {nextUp && (
            <Link
              to="/learn/$trackId/$lessonId"
              params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
              search={{ role: path.role.id }}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              {doneSet.size > 0 ? '继续学习' : '开始学习'} · 第 {nextUp.index} 节
            </Link>
          )}
          <Link
            to="/labs"
            className="rounded-full border border-hairline bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas-soft-2"
          >
            看看实验与闯关
          </Link>
        </div>
      </section>

      {/* 路线选择:ghost 胶囊行,选中态反色为 ink */}
      <section className="mt-12 sm:mt-16">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {roles.map((role) => {
            const active = role.id === path.role.id
            return (
              <Link
                key={role.id}
                to="/"
                search={{ role: role.id }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? 'bg-ink font-medium text-white'
                    : 'bg-white text-gray-500 shadow-hairline hover:text-ink'
                }`}
              >
                {role.title}
                <span className={`ml-1.5 font-mono text-xs ${active ? 'text-gray-400' : 'text-gray-400'}`}>
                  {role.alias}
                </span>
              </Link>
            )
          })}
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

/** 路线简介卡:诉求一句话 + 规模 + 裁剪说明 + 产出 + 进度 + 入口 */
function PathSummary({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  const { role, items, lessonCount, minutes } = path
  const doneCount = items.filter((item) => doneSet.has(item.key)).length
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0
  const nextUp = items.find((item) => !doneSet.has(item.key)) ?? items[0]

  return (
    <div className="mt-4 rounded-xl bg-white p-5 shadow-stack-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{role.tagline}</span>
        <span className="font-mono text-xs text-gray-400">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{role.desc}</p>
      <ul className="mt-3 space-y-1.5">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2 text-sm leading-relaxed text-gray-600">
            <span className="mt-0.5 shrink-0 font-mono text-xs text-brand-600">✓</span>
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-canvas-soft-2">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className="mt-4 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          {doneCount > 0 ? '继续这条路线' : '沿这条路线开始'} · 第 {nextUp.index} 节{' '}
          {nextUp.lesson.title}
        </Link>
      )}
    </div>
  )
}

/** 裁剪过的路线:按段列课,序号是整条路线的连续序号 */
function StagesView({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  return (
    <>
      <div className="mt-6 space-y-5">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h3 className="text-sm font-semibold">{stage.title}</h3>
              <span className="font-mono text-xs text-gray-400">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">{stage.hint}</p>
            <ol className="mt-2.5 space-y-1.5">
              {items.map((item) => (
                <li key={item.key}>
                  <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-gray-400">
        这条线是挑着学的,没排进来的课不会消失 —— 切到「完整主线」就是按 L0–L4 通读的全部{' '}
        {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </>
  )
}

/** 完整主线:按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <div className="mt-6 space-y-4">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article key={track.id} className="overflow-hidden rounded-xl bg-white shadow-stack-sm">
            <header className="flex items-start gap-3 px-4 py-4 sm:px-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hairline bg-canvas-soft font-mono text-xs font-medium text-gray-600">
                {track.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link to="/tracks/$trackId" params={{ trackId: track.id }} className="font-semibold hover:underline">
                    {track.title}
                  </Link>
                  <span className="text-xs text-gray-400">{track.subtitle}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{track.goal}</p>
              </div>
              <div className="shrink-0 font-mono text-sm text-gray-500">
                {trackDone}/{track.lessons.length}
              </div>
            </header>

            <ol className="divide-y divide-hairline border-t border-hairline">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                const done = doneSet.has(key)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: 'full' }}
                      className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-canvas-soft sm:px-5"
                    >
                      <Marker done={done}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-gray-800">{lesson.title}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {lesson.summary}
                        </span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="shrink-0 font-mono text-xs text-gray-400">
                        {lesson.minutes} 分
                      </span>
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
      className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2 shadow-hairline transition hover:bg-canvas-soft"
    >
      <Marker done={done}>{item.index}</Marker>
      <span className="badge-mono shrink-0">{track.level}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{lesson.title}</span>
      <KindBadge kind={lesson.kind} />
      <span className="shrink-0 font-mono text-xs text-gray-400">{lesson.minutes} 分</span>
    </Link>
  )
}

function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
        done ? 'bg-ink text-white' : 'bg-canvas-soft-2 text-gray-500'
      }`}
    >
      {done ? '✓' : children}
    </span>
  )
}

/** 「原理」是默认形态,只给动手环节挂徽标 */
function KindBadge({ kind }: { kind: keyof typeof KIND_LABEL }) {
  if (kind === 'concept') return null
  return (
    <span className="badge-mono hidden shrink-0 sm:inline-flex">{KIND_LABEL[kind]}</span>
  )
}
