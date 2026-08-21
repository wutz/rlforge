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

  const doneCount = path.items.filter((item) => doneSet.has(item.key)).length
  const nextUp = path.items.find((item) => !doneSet.has(item.key)) ?? path.items[0]

  return (
    <div className="space-y-16 sm:space-y-24">
      {/*
        首屏。装饰只有一处：DESIGN.md 那块多色网格渐变，摆在标题上方当氛围底。
        卡片边框、投影、渐变文字统统不加 —— 大字号 + 负字距 + 白底本身就是主角。
      */}
      <section className="relative isolate -mt-4 pt-6">
        <div aria-hidden className="mesh" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-3 py-1 shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <span className="eyebrow text-body">单卡 32GB · RL 后训练锻造场</span>
          </div>

          <h1 className="mt-6 max-w-3xl text-display-lg text-balance sm:text-display-xl">
            在一张 RTX 5090 上把 RL 跑通。
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-body sm:text-body-lg">
            {stats.lessonCount} 节课，终点是同一个：你自己手写一份 GRPO，在单卡 32GB 上把
            Qwen3-0.6B 的数学题正确率训上去，然后换成 TRL 框架再跑一遍做对照。
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {nextUp && (
              <Link
                to="/learn/$trackId/$lessonId"
                params={{ trackId: nextUp.track.id, lessonId: nextUp.lesson.id }}
                search={{ role: path.role.id }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-medium text-white transition-colors hover:bg-body"
              >
                {doneCount > 0 ? '继续这条路线' : '从第一节开始'}
                <span aria-hidden className="text-white/60">
                  →
                </span>
              </Link>
            )}
            <Link
              to="/labs"
              className="inline-flex items-center gap-2 rounded-full border border-hairline bg-canvas px-5 py-2.5 font-medium text-ink shadow-soft transition-colors hover:bg-canvas-soft-2"
            >
              直接去动手
            </Link>
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-3 divide-x divide-hairline border-t border-hairline pt-6">
            {[
              [String(stats.lessonCount), '节课'],
              [String(stats.labCount), '个动手 / 闯关'],
              [`${Math.round(stats.totalMinutes / 60)}`, '小时完整主线'],
            ].map(([value, label], index) => (
              <div key={label} className={index === 0 ? 'pr-4' : 'px-4'}>
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-1 text-display-sm tabular-nums text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 选路线 */}
      <section>
        <SectionHead
          eyebrow="第一步"
          title="挑一条和你现在情况最接近的路线"
          desc="三条线共用同一份进度，随时可以切。裁掉的课不会消失，切到「完整主线」就是全部 27 节。"
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {roles.map((role) => {
            const active = role.id === path.role.id
            return (
              <Link
                key={role.id}
                to="/"
                search={{ role: role.id }}
                className={`group rounded-lg border bg-canvas px-4 py-4 transition ${
                  active
                    ? 'border-ink shadow-card'
                    : 'border-hairline shadow-soft hover:border-hairline-strong'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium tracking-tight text-ink">{role.title}</span>
                  {active && (
                    <span className="rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">
                      当前
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{role.alias}</p>
              </Link>
            )
          })}
        </div>

        <PathSummary path={path} doneSet={doneSet} />
      </section>

      {/* 课程清单 */}
      <section>
        <SectionHead
          eyebrow={path.role.layout === 'catalog' ? 'L0 → L4' : path.role.title}
          title={path.role.layout === 'catalog' ? '五个阶段，二十七节课' : '这条路线的全部课程'}
          desc={
            path.role.layout === 'catalog'
              ? '按 L0 开炉 → L1 认料 → L2 手锻 → L3 上机 → L4 淬火 的顺序通读，每一阶段都有独立的阶段页。'
              : '序号是这条路线的连续序号，不是全站序号 —— 按顺序走就行。'
          }
        />

        <div className="mt-6">
          {path.role.layout === 'catalog' ? (
            <CatalogView doneSet={doneSet} />
          ) : (
            <StagesView path={path} doneSet={doneSet} />
          )}
        </div>
      </section>

      {/* 极性翻转的收尾段：整站唯一的深色块，用来收住页面 */}
      <section className="rounded-xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="eyebrow text-white/50">终点</div>
        <h2 className="mt-3 max-w-2xl text-display-md text-white">
          一个训练过的 0.6B 模型，和一条你能看懂的 reward 曲线。
        </h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-white/70">
          不复现论文，不追榜。走完之后你手上会有一份两百行、每行都读得懂的训练脚本，
          知道显存花在哪、时间花在哪，以及训练炸了先看哪四条曲线。
          进度存在本地浏览器，随时可以停。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            search={{ role: 'full' }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-medium text-ink transition-colors hover:bg-canvas-soft-2"
          >
            看完整主线
          </Link>
          <Link
            to="/labs"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 font-medium text-white transition-colors hover:bg-white/10"
          >
            实验与闯关
          </Link>
        </div>
      </section>
    </div>
  )
}

/** 段头：等宽眉标 + 负字距标题 + 一句说明 */
function SectionHead({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string
  title: string
  desc?: string
}) {
  return (
    <header>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="mt-2.5 text-display-md text-ink">{title}</h2>
      {desc && <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-body">{desc}</p>}
    </header>
  )
}

/** 路线简介卡：诉求一句话 + 裁剪说明 + 产出 + 进度 */
function PathSummary({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  const { role, items, lessonCount, minutes } = path
  const doneCount = items.filter((item) => doneSet.has(item.key)).length
  const percent = lessonCount > 0 ? Math.round((doneCount / lessonCount) * 100) : 0

  return (
    <div className="mt-4 rounded-xl border border-hairline bg-canvas px-5 py-5 shadow-soft sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-display-sm text-ink">{role.tagline}</h3>
        <span className="font-mono text-xs text-mute">
          {lessonCount} 节 · 约 {Math.round(minutes / 60)} 小时 · 已完成 {doneCount}/{lessonCount}
        </span>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-body">{role.desc}</p>

      <ul className="mt-5 grid gap-2 sm:grid-cols-3">
        {role.outcomes.map((outcome) => (
          <li
            key={outcome}
            className="rounded-lg bg-canvas-soft px-3.5 py-3 text-sm leading-relaxed text-body"
          >
            {outcome}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas-soft-2">
          <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${percent}%` }} />
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-mute">{percent}%</span>
      </div>
    </div>
  )
}

/** 裁剪过的路线：按段列课，序号是整条路线的连续序号 */
function StagesView({ path, doneSet }: { path: RolePath; doneSet: Set<string> }) {
  return (
    <div className="space-y-8">
      {path.stages.map(({ stage, items, minutes }) => (
        <div key={stage.title}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-medium tracking-tight text-ink">{stage.title}</h3>
            <span className="font-mono text-[11px] text-mute">
              {items.length} 节 · {minutes} 分钟
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-body">{stage.hint}</p>
          <ol className="mt-3 overflow-hidden rounded-lg border border-hairline bg-canvas shadow-soft">
            {items.map((item) => (
              <li key={item.key} className="border-t border-hairline first:border-t-0">
                <LessonRow item={item} roleId={path.role.id} done={doneSet.has(item.key)} />
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}

/** 完整主线：按 L0–L4 阶段通读 */
function CatalogView({ doneSet }: { doneSet: Set<string> }) {
  return (
    <div className="space-y-4">
      {tracks.map((track) => {
        const trackDone = track.lessons.filter((lesson) =>
          doneSet.has(lessonKey(track.id, lesson.id)),
        ).length

        return (
          <article
            key={track.id}
            className="overflow-hidden rounded-xl border border-hairline bg-canvas shadow-soft"
          >
            <header className="flex items-start gap-3.5 border-b border-hairline px-4 py-4 sm:px-5">
              <span
                className={`mt-0.5 flex h-8 shrink-0 items-center rounded-ui px-2 font-mono text-xs font-medium ${track.accent.bg} ${track.accent.text}`}
              >
                {track.level}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2.5">
                  <Link
                    to="/tracks/$trackId"
                    params={{ trackId: track.id }}
                    className="text-display-sm text-ink underline decoration-transparent decoration-1 underline-offset-4 transition-colors hover:decoration-hairline-strong"
                  >
                    {track.title}
                  </Link>
                  <span className="text-xs text-mute">{track.subtitle}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{track.goal}</p>
              </div>
              <span className="shrink-0 font-mono text-sm tabular-nums text-mute">
                {trackDone}/{track.lessons.length}
              </span>
            </header>

            <ol>
              {track.lessons.map((lesson, index) => {
                const key = lessonKey(track.id, lesson.id)
                return (
                  <li key={lesson.id} className="border-t border-hairline first:border-t-0">
                    <Link
                      to="/learn/$trackId/$lessonId"
                      params={{ trackId: track.id, lessonId: lesson.id }}
                      search={{ role: 'full' }}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft sm:px-5"
                    >
                      <Marker done={doneSet.has(key)}>{index + 1}</Marker>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{lesson.title}</span>
                        <span className="block truncate text-xs text-body">{lesson.summary}</span>
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
      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas-soft"
    >
      <Marker done={done}>{item.index}</Marker>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] ${track.accent.bg} ${track.accent.text}`}
      >
        {track.level}
      </span>
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
        done ? 'bg-ink text-white' : 'bg-canvas-soft-2 text-mute'
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
