/**
 * 学习路线 —— 首页的组织方式，也是课程页的"路线模式"。
 *
 * 课程只有一份（见 curriculum.ts 的 L0–L4 阶段），
 * 这里做的是"按学习偏好裁剪并重排顺序"：同一节课可以出现在多条路线里。
 *
 * 「完整主线」不手写清单，直接由 L0–L4 全量阶段生成，用 layout: 'catalog' 渲染。
 */
import { type Lesson, type Track, getLesson, lessonKey, tracks } from './curriculum'

export interface RoleStage {
  title: string
  /** 这一段解决什么问题，一行以内 */
  hint: string
  /** 课程键，格式 `${trackId}/${lessonId}` */
  lessons: string[]
  /** 整段等于某个 L0–L4 阶段时填上，段标题会链到阶段页 */
  trackId?: string
}

export interface Role {
  id: string
  title: string
  /** 这条线适合谁，展示成一行 */
  alias: string
  /** 这条线的诉求，一句话 */
  tagline: string
  /** 这条线怎么裁的 */
  desc: string
  /** 走完能做什么 */
  outcomes: string[]
  /** catalog：按 L0–L4 阶段通读；默认按裁剪过的分段清单 */
  layout?: 'catalog'
  stages: RoleStage[]
}

export const roles: Role[] = [
  {
    id: 'run-first',
    title: '先跑起来',
    alias: '周末两天 · 手上有卡 · 想先看到 reward 曲线动',
    tagline: '先让 5090 上真的训出点东西，原理边跑边补',
    desc: '把概念课压到最少，只留理解代码必需的那几节。路线是一条直线：装环境 → 算显存 → 手写 GRPO → 跑通 → 看曲线。中途会有你暂时不懂的地方，标注了「回头看哪一节」，不影响先跑完。',
    outcomes: [
      '在自己的 5090 上跑完一次完整 GRPO 训练，看到 reward 曲线上升',
      '手上有一份两百行、每行都看得懂的 RL 训练脚本',
      '训练炸了的时候，知道先看哪四条曲线',
    ],
    stages: [
      {
        title: '先把环境和账算清楚',
        hint: '这三节不跳，跳了后面全是 OOM 和玄学报错',
        lessons: ['l0-env/blackwell-toolchain', 'l0-env/vram-budget', 'l0-env/first-inference'],
      },
      {
        title: '够用的原理',
        hint: '只讲写代码时会用到的部分，数学推导放到后面再补',
        lessons: ['l1-concepts/rl-in-5-minutes', 'l1-concepts/ppo-to-grpo'],
      },
      {
        title: '手写并跑通',
        hint: '这条线的主体，四节课拼出一个能跑的训练脚本',
        lessons: [
          'l2-scratch/rollout-loop',
          'l2-scratch/reward-fn',
          'l2-scratch/advantage-and-loss',
          'l2-scratch/train-loop',
        ],
      },
      {
        title: '跑完之后',
        hint: '看懂自己跑出来的东西，再上一次框架做对照',
        lessons: ['l2-scratch/read-the-curve', 'l4-ops/failure-modes', 'l3-frameworks/trl-grpo'],
      },
    ],
  },
  {
    id: 'understand-first',
    title: '先搞懂原理',
    alias: '暂时没有卡 · 想吃透数学 · 面试或科研准备',
    tagline: '先把公式推明白，代码只是公式的转写',
    desc: '按概念的依赖顺序走：策略梯度 → 基线 → PPO → GRPO，每一步都落到具体公式。动手部分保留手写实现，因为那是验证你真的懂了的唯一方式；环境和框架的工程细节压后。',
    outcomes: [
      '独立推导策略梯度，说清基线为什么降方差不引偏差',
      '看到 GRPO 的损失函数，能逐项说出每一项在防什么',
      '读得懂 slime、Miles 这类框架文档里的算法参数',
    ],
    stages: [
      {
        title: '先看清全局',
        hint: '知道 RL 在整条后训练链路的哪一段',
        lessons: ['l0-env/what-you-need', 'l1-concepts/rl-in-5-minutes', 'l1-concepts/posttraining-map'],
      },
      {
        title: '把数学推一遍',
        hint: '这条线的主课，三节课从策略梯度推到 GRPO',
        lessons: ['l1-concepts/policy-gradient', 'l1-concepts/reward-design', 'l1-concepts/ppo-to-grpo'],
      },
      {
        title: '用代码验证你的理解',
        hint: '公式对不对，跑一遍就知道',
        lessons: [
          'l0-env/vram-budget',
          'l2-scratch/advantage-and-loss',
          'l2-scratch/train-loop',
          'l2-scratch/read-the-curve',
        ],
      },
      {
        title: '看看工业界怎么做',
        hint: '同样的算法，放大一千倍之后要解决什么',
        lessons: ['l3-frameworks/why-frameworks', 'l3-frameworks/slime-miles-arch', 'l4-ops/hyperparams'],
      },
    ],
  },
  {
    id: 'full',
    title: '完整主线',
    alias: 'L0 到 L4 一节不落 · 约需两周业余时间',
    tagline: '从开炉到淬火，把这条路完整走一遍',
    desc: '不做裁剪的全量路线：先把 5090 环境和显存账打好底，再建立 RL 的心智模型，然后从零手写一个 GRPO，接着上框架并对照 slime 与 Miles 的工业设计，最后收在评测、调参与排障。',
    outcomes: [
      '在单卡 5090 上独立完成从环境搭建到模型评测的完整 RL 实验',
      '手写实现与框架实现两条路都走通，并能解释两者的差异',
      '认得出熵崩塌、reward hacking、KL 跑飞等典型失效并知道怎么救',
    ],
    layout: 'catalog',
    stages: tracks.map((track) => ({
      trackId: track.id,
      title: `${track.level} ${track.title}`,
      hint: track.goal,
      lessons: track.lessons.map((lesson) => lessonKey(track.id, lesson.id)),
    })),
  },
]

/* ---------- 派生查询 ---------- */

export interface PathItem {
  key: string
  track: Track
  lesson: Lesson
  /** 在整条路线里的序号，1 起 */
  index: number
}

export interface PathStage {
  stage: RoleStage
  items: PathItem[]
  minutes: number
}

export interface RolePath {
  role: Role
  stages: PathStage[]
  items: PathItem[]
  lessonCount: number
  minutes: number
}

export function getRole(roleId: string | undefined): Role | undefined {
  return roles.find((role) => role.id === roleId)
}

/** 把一条路线的课程键解析成课程对象，并按路线顺序编号 */
export function rolePath(roleId: string | undefined): RolePath | undefined {
  const role = getRole(roleId)
  if (!role) return undefined

  let index = 0
  const stages = role.stages.map((stage) => {
    const items = stage.lessons.flatMap<PathItem>((key) => {
      const [trackId, lessonId] = key.split('/')
      const found = trackId && lessonId ? getLesson(trackId, lessonId) : undefined
      if (!found) {
        // 键写错时丢掉这一条，不让整个首页崩掉
        if (import.meta.env.DEV) console.warn(`[roles] 课程键无效：${key}`)
        return []
      }
      index += 1
      return [{ key, track: found.track, lesson: found.lesson, index }]
    })
    return {
      stage,
      items,
      minutes: items.reduce((sum, item) => sum + item.lesson.minutes, 0),
    }
  })

  const items = stages.flatMap((stage) => stage.items)
  return {
    role,
    stages,
    items,
    lessonCount: items.length,
    minutes: items.reduce((sum, item) => sum + item.lesson.minutes, 0),
  }
}

/** 课程页的路线模式：这节课在这条路线的第几节、属于哪一段、前后是哪两节 */
export function roleNav(roleId: string | undefined, key: string) {
  const path = rolePath(roleId)
  if (!path) return undefined

  const at = path.items.findIndex((item) => item.key === key)
  if (at === -1) return { path, current: undefined, stage: undefined, prev: undefined, next: undefined }

  return {
    path,
    current: path.items[at],
    stage: path.stages.find((stage) => stage.items.some((item) => item.key === key))?.stage,
    prev: at > 0 ? path.items[at - 1] : undefined,
    next: at < path.items.length - 1 ? path.items[at + 1] : undefined,
  }
}
