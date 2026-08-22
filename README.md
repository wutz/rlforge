# RLforge

面向新手的 LLM 强化学习动手路径。**所有实验以单张 RTX 5090（32GB）为基准校准**——终点是你自己手写一份 GRPO，在单卡上把 Qwen3-0.6B 的 GSM8K 正确率训上去，再换成 TRL 框架重跑一遍做对照。

`rlforge.wutz.dev`（与 [storpath](https://storpath.wutz.dev/)、[netpath](https://netpath.wutz.dev/) 同一系列）

## 技术栈

与 storpath 一致：

- **Bun** + **Vite 8** + **TanStack Start / Router**（文件路由，SSR）
- **React 19** + **Tailwind 4**（`@theme` 里定义全部设计令牌，见下）
- **Geist / Geist Mono** 走 Google Fonts，无自托管字体依赖
- **MDX** 写正文，`@shikijs/rehype` 做代码高亮，`remark-gfm` + `rehype-slug`
- **Cloudflare Workers** 部署（wrangler，custom domain）
- 进度存 `localStorage`，无账号体系，无后端

## 设计系统

视觉规范在 [`DESIGN.md`](./DESIGN.md)（`npx getdesign@latest add vercel` 生成）。
**token 落地与 [storpath](https://storpath.wutz.dev/) 保持一致** —— 命名、分档、
组件外壳都一样，两个站的样式代码可以直接互相搬。全部 token 在 `src/styles.css`
的 `@theme` 里，改设计只改那一处：

- **字体**：Geist / Geist Mono（Google Fonts 的 latin 子集，中文落系统字面，不为此多下字形）
- **中性阶**：正文三档 `ink` / `body` / `mute`，描边两档 `line` / `line-strong`，
  底色三档 `canvas` / `soft` / `soft-2` —— 别再往里加灰
- **语义色**：`info` / `warn` / `plum` / `danger`，各带 `-soft` 与 `-deep`；
  只出现在徽标和状态上，不做大面积铺底
- **主题色**：浅紫 302°，与 storpath(30°)、netpath(203°) 各差 88° / 99°。
  `brand-500` 是浅紫块面（按钮底色、进度条、marker、logo 方块），只配 ink 深字；
  `brand-600` 是可读紫（链接 / 聚焦 / 勾选 / 选中竖条，白底 5.31:1，别再往上提亮）。
  logo 底色 == `brand-500`，改这一档必须同步改 `public/logo.svg`
- **半径**：`xs` 4px / `sm` 6px 控件 / `md` 8px 卡片 / `lg` 12px 大卡片，按钮统一走 6px
- **层次**：`shadow-hair` / `card` / `soft` / `float` 叠层阴影，内含 1px inset 描边 ——
  所以卡片不写 border，避免和 inset 环重影
- **排版**：`.display-2xl` ~ `.display-sm` 五档，字重封顶 600，字号越大字距收得越紧；
  `.eyebrow` 是等宽小眉标，只用在栏目标题上
- **阶段色**：没有。五个阶段共用中性的 `LEVEL_CHIP` 角标，靠 L0–L4 的字面区分 ——
  五种浅色堆一页像一叠便利贴，而且会和主题色（代表「可点」）撞车
- **共享原语**：`src/components/ui.tsx` 里的 `Panel` / `Field` / `Stat` / `NoteList` / `inputCls`，
  三个计算器的外壳都从这里来

## 开发

```bash
bun install
bun run dev        # http://localhost:3002
bun run typecheck
bun run build
bun run deploy     # build + wrangler deploy
```

## 结构

```
src/
├── lib/
│   ├── curriculum.ts   全站唯一数据源：L0–L4 五个阶段、27 节课
│   ├── roles.ts        三条学习路线（对课程做裁剪与重排）
│   ├── content.ts      MDX 正文加载（import.meta.glob，eager）
│   ├── progress.ts     localStorage 进度，useSyncExternalStore
│   ├── vram.ts         显存账本计算
│   ├── grpo.ts         GRPO 优势 / clip / KL 估计（与课程里手写的实现同构）
│   ├── throughput.ts   训练时长估算
│   └── units.ts        显示格式化
├── components/
│   ├── Callout.tsx     五种语气的提示框（含 5090 专用的 gpu 档）
│   ├── Quiz.tsx        随堂检查点，通过写进进度
│   ├── Terminal.tsx    命令行演练器（预置输出，练"看到什么该想什么"）
│   ├── VramBudget.tsx  ← 显存账本计算器
│   ├── GrpoAdvantage.tsx ← GRPO 优势与 clip 交互演示
│   └── TimeBudget.tsx  ← 一次实验要跑多久
├── routes/
│   ├── __root.tsx
│   ├── index.tsx                    首页，按 ?role= 切路线
│   ├── tracks.$trackId.tsx          阶段页
│   ├── learn.$trackId.$lessonId.tsx 课程页（?role= 进入路线模式）
│   └── labs.tsx                     实验 / 闯关 / 计算器索引
└── content/<trackId>/<lessonId>.mdx 正文
```

## 课程状态

`curriculum.ts` 里每节课有 `status`：

- `'ready'` —— 已有正文，路径 `src/content/<trackId>/<lessonId>.mdx`
- `'planned'` —— 仅有大纲（`outline` 字段），课程页渲染大纲占位

当前 **27 节课，17 节已有正文**。加正文时把对应 lesson 的 `status` 改成 `'ready'` 并新建 MDX 即可，其余全自动派生。

## 内容原则

1. **单卡 32GB 是硬约束。** 任何写进来的命令、参数、显存数字都按这个前提校准。写不进 32GB 的东西不写。
2. **不给"标准吞吐值"。** 同一张卡不同配置能差三倍，一律要求读者自己实测（L0 有专门一节做这件事），后续所有时间估算都基于读者自己的数。
3. **先手写后上框架。** 目的是把框架参数从黑盒变成玻璃盒；每节框架课都带「你写的变量 ↔ 框架参数」对照表。
4. **slime / Miles 是架构教材，不是动手工具。** 两者最小配置都是 8×H100，明确说清跑不了单卡，然后带着读者刚踩过的坑去读它们的设计。

## 参考资料

- [slime](https://thudm.github.io/slime/) — THUDM 的 RL 后训练框架（GLM 系列背后）
- [Miles](https://miles.radixark.com/docs) — SGLang + Megatron，从 slime 分叉
- [TRL GRPOTrainer](https://huggingface.co/docs/trl/grpo_trainer) / [vLLM Integration](https://huggingface.co/docs/trl/vllm_integration) — 单卡实跑用的框架
- [HF Cookbook：单卡 GRPO + vLLM](https://huggingface.co/learn/cookbook/grpo_vllm_online_training)
- [DeepSeekMath](https://arxiv.org/abs/2402.03300)（GRPO 出处）、[DeepSeek-R1](https://arxiv.org/abs/2501.12948)
- [Unsloth RL Guide](https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide)、[Spinning Up in Deep RL](https://spinningup.openai.com/)
