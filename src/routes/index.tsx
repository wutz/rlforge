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

/** 墨黑主按钮 —— DESIGN.md 里「动作」只有这一个颜色 */
const ctaClass =
  'mt-4 inline-flex flex-wrap items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white shadow-e1 transition hover:bg-gray-800'

const cardClass = 'rounded-xl border border-gray-200 bg-white shadow-e2'

/** 细进度条。轨道中性灰，填充走主题色 —— 站内所有进度都用这一个形状 */
function Progress({ percent }: { percent: number }) {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full rounded-full bg-brand-600 transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

/** 阶段角标：站内唯一保留阶段配色的地方，等宽字，面积很小 */
function LevelChip({ level, accent }: { level: string; accent: { bg: string; text: string } }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${accent.bg} ${accent.text}`}
    >
      {level}
    </span>
  )
}

/** 完成标记：完成走 emerald，未完成是中性描边圈 —— 和 netpath 同一个形状 */
function Marker({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-medium ${
        done ? 'bg-emerald-600 text-white' : 'border border-gray-200 bg-gray-50 text-gray-500'
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
      className={`hidden shrink-0 rounded border px-1.5 py-0.5 text-[10px] sm:inline ${KIND_STYLE[kind]}`}
    >
      {KIND_LABEL[kind]}
    </span>
  )
}

/**
 * 首页不再有那张带渐变的标题卡 —— 它只是把站点名和定位又说了一遍，
 * 却占掉手机上大半屏。现在页面自己就是容器，留白负责分区，
 * 卡片只留给真正需要边界的内容：路线说明卡和课程清单。
 */
function Home() {
  const { role: roleParam } = Route.useSearch()
  const path = rolePath(roleParam) ?? rolePath(roles[0].id)!

  const progress = useProgress()
  const doneSet = new Set(progress.done)

  return (
    <div>
      <header className="max-w-2xl">
        <h1 className="text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] sm:text-[32px]">
          选一条路线，在一张 5090 上把 RL 跑通
        </h1>
        <p className="mt-3 leading-relaxed text-gray-600">
          <span className="font-mono text-gray-900">{stats.lessonCount}</span> 节课，终点是同一个：
          你自己手写一份 GRPO，在单卡 32GB 上把 Qwen3-0.6B 的数学题正确率训上去，
          然后换成 TRL 框架再跑一遍做对照。三条线共用同一份进度，随时可以切。
        </p>
      </header>

      {/* 手机上三个标签排不下，直接横向滚动 */}
      <div className="-mx-3 mt-6 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {roles.map((role) => {
          const active = role.id === path.role.id
          return (
            <Link
              key={role.id}
              to="/"
              search={{ role: role.id }}
              className={`shrink-0 rounded-lg border px-3.5 py-2 text-left transition ${
                active
                  ? 'border-gray-900 bg-white shadow-e2'
                  : 'border-gray-200 bg-white/60 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-600'}`}>
                {role.title}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-gray-500">{role.alias}</div>
            </Link>
          )
        })}
      </div>

      <PathSummary path={path} doneSet={doneSet} />

      <div className="mt-8">
        {path.role.layout === 'catalog' ? (
          <CatalogView doneSet={doneSet} />
        ) : (
          <StagesView path={path} doneSet={doneSet} />
        )}
      </div>
    </div>
  )
}

/** 路线说明卡：一句诉求、一段裁剪说明、几条产出，外加进度与继续按钮 */
function PathSummary({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  const { role, items, lessonCount, minutes } = path
  const doneCount = items.filter((item) => doneSet.has(item.key)).length
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0
  const nextUp = items.find((item) => !doneSet.has(item.key)) ?? items[0]

  return (
    <div className={`mt-4 px-5 py-5 ${cardClass}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium text-gray-900">{role.tagline}</span>
        <span className="font-mono text-[11px] text-gray-500">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{role.desc}</p>
      <ul className="mt-3 space-y-1.5">
        {role.outcomes.map((outcome) => (
          <li key={outcome} className="flex gap-2 text-[13px] leading-relaxed text-gray-600">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-600" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Progress percent={percent} />
      </div>
      {nextUp && (
        <Link
          to="/learn/$trackId/$lessonId"
          params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
          search={{ role: role.id }}
          className={ctaClass}
        >
          {doneCount > 0 ? '继续这条路线' : '沿这条路线开始'}
          <span className="text-gray-500">·</span>
          <span className="font-normal text-gray-300">
            第 <span className="font-mono">{nextUp.index}</span> 节
          </span>
          <span className="font-normal text-gray-100">{nextUp.lesson.title}</span>
        </Link>
      )}
    </div>
  )
}

/** 裁剪过的路线：按段列课，序号是整条路线的连续序号 */
function StagesView({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  return (
    <>
      <div className="space-y-6">
        {path.stages.map(({ stage, items, minutes }) => (
          <div key={stage.title}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="text-[15px] font-semibold tracking-tight text-gray-900">
                {stage.title}
              </h2>
              <span className="font-mono text-[11px] text-gray-500">
                {items.length} 节 · {minutes} 分钟
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{stage.hint}</p>

            {/* 一段课程是一张表：行与行之间只用发丝线分隔，不再各自成卡 */}
            <ol className={`mt-3 divide-y divide-gray-100 overflow-hidden ${cardClass}`}>
              {items.map((item) => (
                <li key={item.key}>
                  <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[13px] leading-relaxed text-gray-500">
        这条线是挑着学的，没排进来的课不会消失 —— 切到「完整主线」就是按 L0–L4 通读的全部{' '}
        {stats.lessonCount} 节。三条路线共用同一份进度。
      </p>
    </>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <div className="space-y-3">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article
            key={track.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            {/*
              阶段头不铺阶段浅色 —— 五个阶段堆下来会像一叠便利贴。
              底色统一 canvas-soft，阶段色收进左侧那个角标的字色里。
            */}
            <header className="flex items-start gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white font-mono text-[11px] font-medium ${track.accent.text}`}
              >
                {track.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: track.id }}
                    className="font-medium text-gray-900 hover:underline"
                  >
                    {track.title}
                  </Link>
                  <span className="text-[11px] text-gray-500">{track.subtitle}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">{track.goal}</p>
              </div>
              <div className="shrink-0 font-mono text-[13px] font-medium text-gray-900">
                {trackDone}/{track.lessons.length}
              </div>
            </header>

            <ol className="divide-y divide-gray-100">
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                return (
                  <li key={lesson.id}>
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: 'full' }}
                      className="flex items-center gap-2.5 px-4 py-2.5 transition hover:bg-gray-50"
                    >
                      <Marker done={doneSet.has(key)}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-gray-800">{lesson.title}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {lesson.summary}
                        </span>
                      </span>
                      <KindBadge kind={lesson.kind} />
                      <span className="shrink-0 font-mono text-[11px] text-gray-500">
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
      className="flex items-center gap-2.5 px-3.5 py-2.5 transition hover:bg-gray-50 sm:px-4"
    >
      <Marker done={done}>{item.index}</Marker>
      <LevelChip level={track.level} accent={track.accent} />
      <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{lesson.title}</span>
      <KindBadge kind={lesson.kind} />
      <span className="shrink-0 font-mono text-[11px] text-gray-500">{lesson.minutes}m</span>
    </Link>
  )
}
