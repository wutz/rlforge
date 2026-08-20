/**
 * 课程大纲 —— 全站唯一数据源。
 * 首页路线、阶段页、课程页、实验索引、进度统计都从这里派生。
 *
 * status: 'ready'   已有正文（src/content/<trackId>/<lessonId>.mdx）
 *         'planned' 仅有大纲，课程页会渲染大纲占位
 *
 * 全站的硬约束：所有实验都必须能在【单张 RTX 5090（32GB）】上跑完。
 * 任何写进来的命令、参数、显存数字都按这个前提校准。
 */

export type LessonKind = 'concept' | 'lab' | 'quest' | 'planner'
export type LessonStatus = 'ready' | 'planned'

export interface LessonRef {
  label: string
  /** 外部链接；本地仓库/脚本路径留空 href，按代码样式展示 */
  href?: string
  path?: string
}

export interface Lesson {
  id: string
  title: string
  summary: string
  kind: LessonKind
  status: LessonStatus
  /** 预计学习时长（分钟），lab 含跑训练的等待时间 */
  minutes: number
  /** 学完能做什么 */
  objectives: string[]
  /** 小节大纲 */
  outline: string[]
  refs?: LessonRef[]
}

export interface Track {
  id: string
  level: string
  title: string
  subtitle: string
  goal: string
  lessons: Lesson[]
}

export const KIND_LABEL: Record<LessonKind, string> = {
  concept: '原理',
  lab: '实验',
  quest: '闯关',
  planner: '计算器',
}


/* ---------- 常用参考资料 ---------- */

const REF_SLIME: LessonRef = { label: 'slime — THUDM 的 RL 后训练框架', href: 'https://thudm.github.io/slime/' }
const REF_MILES: LessonRef = { label: 'Miles — SGLang + Megatron 的企业级 RL 框架', href: 'https://miles.radixark.com/docs' }
const REF_TRL_GRPO: LessonRef = { label: 'TRL GRPOTrainer 文档', href: 'https://huggingface.co/docs/trl/grpo_trainer' }
const REF_TRL_VLLM: LessonRef = { label: 'TRL vLLM Integration（server / colocate）', href: 'https://huggingface.co/docs/trl/vllm_integration' }
const REF_HF_COOKBOOK: LessonRef = {
  label: 'HF Cookbook：单卡上用 GRPO + vLLM 在线训练',
  href: 'https://huggingface.co/learn/cookbook/grpo_vllm_online_training',
}
const REF_DEEPSEEKMATH: LessonRef = { label: 'DeepSeekMath 论文（GRPO 原始出处）', href: 'https://arxiv.org/abs/2402.03300' }
const REF_PPO: LessonRef = { label: 'PPO 论文 — Schulman et al. 2017', href: 'https://arxiv.org/abs/1707.06347' }
const REF_R1: LessonRef = { label: 'DeepSeek-R1：纯 RL 激发推理能力', href: 'https://arxiv.org/abs/2501.12948' }
const REF_VLLM: LessonRef = { label: 'vLLM 文档', href: 'https://docs.vllm.ai/' }
const REF_UNSLOTH_RL: LessonRef = { label: 'Unsloth RL Guide（单卡 GRPO 实战）', href: 'https://unsloth.ai/docs/get-started/reinforcement-learning-rl-guide' }
const REF_SPINNINGUP: LessonRef = { label: 'OpenAI Spinning Up in Deep RL', href: 'https://spinningup.openai.com/' }
const REF_VERL: LessonRef = { label: 'verl / HybridFlow', href: 'https://github.com/verl-project/verl' }

/** 本站配套脚本，仓库内路径 */
const script = (path: string): LessonRef => ({ label: 'rlforge 配套脚本', path })

export const tracks: Track[] = [
  /* ==================== L0 ==================== */
  {
    id: 'l0-env',
    level: 'L0',
    title: '开炉',
    subtitle: '5090 环境与显存账本',
    goal: '在动手写一行 RL 代码之前，先把这张卡摸清楚：工具链装对、显存算得出、推理跑得起来、评测基线量得到。这一阶段的产出是一个「已知能跑」的环境和一张写下起点分数的纸。',
    lessons: [
      {
        id: 'what-you-need',
        title: '这条路需要什么：一张 5090 和一份预期管理',
        summary: '先把话说清楚：单卡 32GB 能做什么、不能做什么，以及为什么这不影响你学会 RL。',
        kind: 'concept',
        status: 'ready',
        minutes: 20,
        objectives: [
          '说出单卡 32GB 在 RL 后训练里的真实位置：能训 0.6B 全参，能 LoRA 到 8B，跑不了 MoE',
          '知道为什么 slime / Miles 这类工业框架的最小配置是 8×H100，以及这对你意味着什么',
          '给自己定一个能在一周内达成的终点，而不是复现一篇论文',
        ],
        outline: [
          '这条路径的终点长什么样：一个训练过的 0.6B 模型 + 一条能看懂的 reward 曲线',
          '5090 的硬参数：32GB GDDR7、1.79TB/s、无 NVLink、sm_120',
          '能做 / 不能做清单（按模型规模和训练方式列表）',
          '工业框架为什么起步就是 8 卡：Megatron 并行、KV cache、weight sync 的代价',
          '学习顺序说明：为什么先手写再上框架',
        ],
        refs: [REF_SLIME, REF_MILES, REF_R1],
      },
      {
        id: 'blackwell-toolchain',
        title: 'Blackwell 的工具链地雷：sm_120 到底装什么版本',
        summary: '5090 是 sm_120，用错一个 wheel 就是「no kernel image is available」。这一节把环境一次装对，并留下验证命令。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '用三条命令验证 PyTorch 真的认得这张卡，而不是装完就以为好了',
          '装出一套 torch + vLLM + TRL 能互相兼容的环境',
          '看到常见报错时，一眼判断是驱动、CUDA、wheel 还是算子的问题',
        ],
        outline: [
          '概念先理顺：驱动版本、CUDA Toolkit、PyTorch 自带的 CUDA runtime 是三件不同的东西',
          'sm_120 是什么：compute capability 与 wheel 的 arch list',
          '装机步骤：驱动 → uv/conda 环境 → torch（cu128 及以上）→ vLLM → TRL',
          '三条验证命令：device_capability、一次真实 matmul、一次 vLLM 生成',
          '错误对照表：no kernel image / unsupported toolchain / flash-attn 编译失败 / 单卡别开 DDP',
          '为什么建议原生 Linux 而不是 WSL2',
        ],
        refs: [REF_VLLM, { label: 'PyTorch 安装选择器', href: 'https://pytorch.org/get-started/locally/' }],
      },
      {
        id: 'vram-budget',
        title: '显存账本：32GB 到底放得下什么',
        summary: 'RL 训练要同时装下策略模型、优化器状态、参考模型和一个推理引擎。这一节把这笔账算清，用计算器验证。',
        kind: 'planner',
        status: 'ready',
        minutes: 45,
        objectives: [
          '手算出「模型参数量 + 精度 + 优化器」需要多少显存，误差在 10% 以内',
          '解释为什么 RL 比 SFT 多吃两份显存，以及 GRPO 省掉的是哪一份',
          '给定一个模型，判断该走全参、LoRA 还是 QLoRA，并说出 KV cache 该留多少',
        ],
        outline: [
          '五个吃显存的部件：权重、梯度、优化器状态、激活、KV cache',
          'bf16 全参训练的经典 16 倍系数是怎么来的',
          'RL 的额外账单：参考模型（+1 份权重）、推理引擎（+1 份权重 + KV cache）',
          'GRPO 相对 PPO 省掉的 critic：省了多少',
          'KV cache 逐 token 公式，以及为什么长回答比大模型更容易 OOM',
          'LoRA / QLoRA 改变了账本的哪几行',
          '交互计算器：把模型、精度、并发、回答长度都拨一遍',
        ],
        refs: [REF_TRL_GRPO, REF_UNSLOTH_RL],
      },
      {
        id: 'first-inference',
        title: '第一次推理：把 vLLM 跑起来，量出你的 tok/s',
        summary: 'RL 的墙钟时间大头在采样。先把推理引擎跑起来，测出这张卡的真实吞吐，后面所有时间估算都以它为基准。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '在 5090 上起一个 vLLM 服务并完成一次批量生成',
          '测出 Qwen3-0.6B 在你的机器上的实际生成吞吐（tok/s）',
          '知道 gpu_memory_utilization、max_model_len、CUDA graph 各自影响什么',
        ],
        outline: [
          '为什么不用 transformers 的 generate 做 rollout：吞吐差一个数量级',
          '下载模型：Qwen3-0.6B 与 hf 镜像设置',
          '起 offline LLM 与起 server 两种用法',
          '压一次吞吐：固定 prompt 数与 max_tokens，记录 tok/s 和显存占用',
          '三个旋钮：gpu_memory_utilization、max_model_len、enforce_eager',
          '把测出来的数字记到实验笔记里，后面 L4 的时间账要用',
        ],
        refs: [REF_VLLM, script('scripts/bench_rollout.py')],
      },
      {
        id: 'dataset-and-eval',
        title: '先量起点：数据集与评测基线',
        summary: 'RL 只能证明「比训练前好」。所以第一件事是量出训练前的分数，否则后面所有曲线都没有意义。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '准备好 GSM8K 的训练/测试切分，并说清为什么不能拿训练集报分',
          '写出一个能自动判对错的答案抽取器，并知道它会在哪里误判',
          '跑出训练前的 baseline 准确率，写进实验笔记',
        ],
        outline: [
          '为什么第一个任务选数学题：reward 可验证，不需要训 reward model',
          'GSM8K 结构：7473 训练 / 1319 测试，答案在 #### 之后',
          '写答案抽取：正则、数字归一化、常见误判',
          'pass@1 与 greedy / 采样的区别',
          '跑 baseline：记录准确率、平均回答长度、耗时',
          '实验笔记模板：一次实验必须记下的七个字段',
        ],
        refs: [{ label: 'GSM8K 数据集', href: 'https://huggingface.co/datasets/openai/gsm8k' }, script('scripts/eval_gsm8k.py')],
      },
      {
        id: 'tokens-and-template',
        title: 'token 与 chat template：新手翻车最密集的地方',
        summary: '一半的「RL 不收敛」其实是模板拼错、EOS 没停、mask 错位。这一节把这些坑提前踩掉。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '手动拼出一条 chat template 的完整 token 序列，并指出哪些位置该算 loss',
          '说清 prompt mask、completion mask、padding mask 三者的关系',
          '判断「模型不停下来」是模板问题、EOS 问题还是采样参数问题',
        ],
        outline: [
          'tokenizer 的三件事：编码、特殊 token、chat template',
          'apply_chat_template 到底往里塞了什么（打印出来看）',
          'Base 模型与 Instruct 模型的模板差异，以及选错的后果',
          'RL 里的 loss mask：只对 completion 求梯度',
          'EOS、stop token、max_tokens 三种停止方式',
          '常见翻车现场：回答里带模板标记、答案被截断、长度全部顶到上限',
        ],
      },
    ],
  },

  /* ==================== L1 ==================== */
  {
    id: 'l1-concepts',
    level: 'L1',
    title: '认料',
    subtitle: 'RL 与后训练的心智模型',
    goal: '用最少的数学把 RL 讲通：为什么能对采样结果求梯度、reward 从哪来、PPO 在防什么、GRPO 又砍掉了什么。这一阶段不写训练代码，但每个概念都对应后面手写代码里的一行。',
    lessons: [
      {
        id: 'rl-in-5-minutes',
        title: 'RL 的最小心智模型：试、评、改',
        summary: '不讲马尔可夫决策过程。先用「模型自己生成一批答案，好的多学一点，坏的少学一点」把整件事说完。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '用一句话讲清 RL 与监督学习的根本区别：标签是自己采样出来的',
          '把 state / action / reward / policy 对应到 LLM 里的具体东西',
          '说出「为什么不能直接对 reward 做梯度下降」',
        ],
        outline: [
          '监督学习：给你答案，照着抄。RL：自己写，别人打分',
          '术语对照表：policy = 模型，action = token，trajectory = 一条回答，reward = 打分',
          '一个玩具例子：让模型学会「答案只输出数字」',
          '为什么 RL 更贵：每一步都要先生成再学习',
          '三个必然出现的麻烦：方差大、会作弊、会跑飞 —— 后面每节课各解决一个',
        ],
        refs: [REF_SPINNINGUP],
      },
      {
        id: 'posttraining-map',
        title: 'LLM 后训练全景：SFT、RM、RLHF、RLVR 各在什么位置',
        summary: '把你听过的一堆缩写排进一张流程图，知道 GRPO 训的是哪一段、前后各接什么。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '画出 预训练 → SFT → 偏好对齐 / 可验证奖励 的完整链路',
          '说清 RLHF 与 RLVR 的区别，以及为什么新手该从 RLVR 起步',
          '判断一个任务该用 SFT、DPO 还是 GRPO',
        ],
        outline: [
          '预训练给的是知识，SFT 给的是格式，RL 给的是取舍',
          'RLHF 三段式：SFT → 训 reward model → PPO',
          'RLVR：奖励来自可验证的答案，跳过 reward model',
          'DPO 一类离线方法：便宜，但拿不到 on-policy 的收益',
          'R1 的启示：足够强的 base + 可验证奖励，能长出推理行为',
          '决策树：你的任务有没有标准答案',
        ],
        refs: [REF_R1, REF_DEEPSEEKMATH],
      },
      {
        id: 'reward-design',
        title: 'reward 从哪来：可验证奖励、模型打分、人标',
        summary: 'reward 设计是 RL 里唯一真正需要你想清楚的事情。写歪一个 reward，模型会精确地学会钻它的空子。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '给一个任务设计出可验证 reward，并预判它会被怎么钻空子',
          '说清格式奖励与正确性奖励为什么要分开给、怎么配权重',
          '识别 reward hacking 的早期信号',
        ],
        outline: [
          '三种来源：规则可验证、模型打分（LLM-as-judge / RM）、人标',
          '可验证奖励的甜区：数学、代码、结构化输出',
          '复合 reward：正确性 + 格式 + 长度惩罚，权重怎么配',
          '稀疏与稠密：全对才给分 vs 分步给分',
          'reward hacking 案例集：空答案拿满格式分、答案重复十遍、复述题目',
          '设计检查清单：这个 reward 有没有不写答案就能拿分的路径',
        ],
      },
      {
        id: 'policy-gradient',
        title: '策略梯度：为什么能对「采样出来的东西」求梯度',
        summary: 'RL 唯一绕不开的一段数学。这一节只推一个公式，但推完之后 GRPO 的代码你会觉得理所当然。',
        kind: 'concept',
        status: 'ready',
        minutes: 40,
        objectives: [
          '解释 log-derivative trick：为什么梯度里出现了 log π',
          '说清基线（baseline）为什么能降方差却不引入偏差',
          '把 REINFORCE 的一行公式对应到代码里的 logprob * advantage',
        ],
        outline: [
          '目标函数：最大化期望 reward',
          'log-derivative trick，一步一步推',
          'REINFORCE：最朴素的实现，以及它为什么方差大到不可用',
          '基线的作用：只关心「比平均好多少」',
          '优势函数 advantage 登场',
          '代码对照：这个公式在 PyTorch 里就是三行',
        ],
        refs: [REF_SPINNINGUP],
      },
      {
        id: 'ppo-to-grpo',
        title: '从 PPO 到 GRPO：丢掉 critic 换来了什么',
        summary: 'PPO 的四个模型对单卡是灾难。GRPO 用「组内比较」替掉 critic，这正是 5090 能玩 RL 的原因。',
        kind: 'concept',
        status: 'ready',
        minutes: 40,
        objectives: [
          '说出 PPO 显存里的四个模型各干什么，以及 GRPO 去掉了哪个',
          '手算一组 reward 的 GRPO 优势值',
          '解释 clip 和 KL 两个约束各在防什么，以及去掉它们会怎样',
        ],
        outline: [
          'PPO 的四件套：actor、critic、reference、reward model',
          'critic 为什么贵：又一个同尺寸模型 + 它自己的优化器',
          'GRPO 的核心一招：同一个 prompt 采 G 条，用组内均值当基线',
          '优势公式与它的两个性质：零均值、尺度无关',
          'clip：限制单步更新幅度，防止一次跑飞',
          'KL 惩罚：拴住参考模型，防止说人话的能力被训丢',
          '交互演示：拨动 reward 分布，看优势值和梯度方向怎么变',
          'GRPO 的代价：组内全对或全错时优势归零，这一批白采',
        ],
        refs: [REF_DEEPSEEKMATH, REF_PPO],
      },
    ],
  },

  /* ==================== L2 ==================== */
  {
    id: 'l2-scratch',
    level: 'L2',
    title: '手锻',
    subtitle: '从零写一个能跑的 GRPO',
    goal: '不用任何 RL 框架，用 transformers + vLLM 手写完整训练循环。跑完这一阶段你会拥有一个约 200 行、你完全看得懂每一行的 RL 训练脚本，并在 5090 上把 Qwen3-0.6B 的 GSM8K 分数推上去。',
    lessons: [
      {
        id: 'rollout-loop',
        title: '写 rollout：让模型自己生成一批答案',
        summary: '训练数据不是给的，是采的。这一节把「一个 prompt 采 8 条回答」写出来，并处理好 token 对齐。',
        kind: 'lab',
        status: 'ready',
        minutes: 45,
        objectives: [
          '用 vLLM 对一批 prompt 各采 G 条回答，拿到 token id 而不是字符串',
          '解释为什么必须拿 token id 回来（token-in-token-out）',
          '把采样结果整理成后面能直接喂进训练的张量',
        ],
        outline: [
          'rollout 的输入输出定义清楚：prompt 批 → (prompt_ids, completion_ids, reward) 三元组',
          'SamplingParams：n、temperature、top_p、max_tokens 各自的影响',
          '为什么 temperature 不能设 0：没有多样性就没有可比较的组',
          '拿 token id 不拿文本：detokenize→retokenize 会产生不一致（工业框架管这叫 TITO）',
          '拼 batch：左 pad 还是右 pad，mask 怎么造',
          '跑一次：打印 8 条回答，肉眼看看模型现在什么水平',
        ],
        refs: [REF_MILES, script('scripts/grpo_scratch/rollout.py')],
      },
      {
        id: 'reward-fn',
        title: '写 reward 函数：把「答对了」变成一个数',
        summary: '两个 reward：答案对不对、格式规不规范。加起来就是这一轮的分数。',
        kind: 'lab',
        status: 'ready',
        minutes: 35,
        objectives: [
          '实现正确性 reward 与格式 reward，并组合成总分',
          '在自己的 reward 上主动找出一条作弊路径并堵掉',
          '打印 reward 分布，判断这一批采样有没有信息量',
        ],
        outline: [
          '正确性 reward：抽答案 → 归一化 → 比对',
          '格式 reward：要求把推理放进标签、答案单独一行',
          '组合与权重：为什么格式分要小于正确性分',
          '长度惩罚该不该加（先不加，L4 再回来）',
          '自测：故意喂几条垃圾回答，看 reward 有没有给错分',
          '看分布：全 0 或全 1 都意味着这批数据白采',
        ],
        refs: [script('scripts/grpo_scratch/rewards.py')],
      },
      {
        id: 'advantage-and-loss',
        title: 'GRPO 的核心 20 行：优势、ratio、clip、KL',
        summary: '整个算法真正的实现只有二十行。这一节逐行写出来，并用打印验证每个中间量。',
        kind: 'lab',
        status: 'ready',
        minutes: 50,
        objectives: [
          '写出组内归一化的优势计算，并处理 std 为 0 的情况',
          '写出带 clip 的策略损失，并解释每个符号对应 L1 的哪个概念',
          '写出低方差 KL 估计，并知道 KL 系数设 0 意味着什么',
        ],
        outline: [
          '第一步：算 logprob —— 从 logits 取出每个采样 token 的对数概率',
          '第二步：算优势 —— (r - mean) / (std + eps)，逐组做',
          '边界情况：一组全对或全错，std=0，优势该给 0 而不是 NaN',
          '第三步：算 ratio —— 为什么是 exp(new_logp - old_logp)',
          '第四步：clip —— torch.min 的两项各在什么时候生效',
          '第五步：KL —— k3 低方差估计，为什么不用朴素差值',
          '第六步：mask 与归一化 —— per-token 还是 per-sequence，这里有个经典陷阱',
          '逐个中间量打印检查：ratio 初始应该恒等于 1',
        ],
        refs: [REF_DEEPSEEKMATH, script('scripts/grpo_scratch/grpo.py')],
      },
      {
        id: 'train-loop',
        title: '拼成训练循环：第一次真正的 RL 训练',
        summary: '把 rollout、reward、loss 串起来，加上权重同步和显存管理，在 5090 上跑完第一次训练。',
        kind: 'lab',
        status: 'ready',
        minutes: 60,
        objectives: [
          '跑完一次完整训练，看到 reward 曲线上升',
          '实现训练权重到 vLLM 的同步，并解释不同步会发生什么',
          '在 32GB 内安排好训练与推理的显存，扛住不 OOM',
        ],
        outline: [
          '主循环骨架：采样 → 打分 → 算优势 → 更新 → 同步权重',
          '权重同步：为什么每步都要同步，以及不同步就变成了 off-policy',
          'sleep / wake：训练时把 vLLM 的显存让出来',
          '参考模型怎么省：单卡上直接用「更新前的自己」还是常驻一份',
          '梯度累积与 micro batch：显存不够时的唯一出路',
          '该记什么日志：reward 均值、优势标准差、KL、回答长度、clip 比例',
          '启动，等 30 分钟，然后看曲线',
        ],
        refs: [script('scripts/grpo_scratch/train.py'), REF_UNSLOTH_RL],
      },
      {
        id: 'read-the-curve',
        title: '闯关：读第一次训练曲线',
        summary: '给你六组真实形状的训练曲线，判断哪些是在学、哪些是在作弊、哪些已经废了。',
        kind: 'quest',
        status: 'ready',
        minutes: 40,
        objectives: [
          '从 reward、KL、长度、熵四条线的组合形状判断训练状态',
          '看到异常曲线时，说出下一步该改哪个参数',
          '建立「先看曲线再改代码」的习惯',
        ],
        outline: [
          '健康形状长什么样：reward 缓升、KL 小幅上行、长度稳定',
          '案例一：reward 冲顶但准确率没变 —— 格式分被刷了',
          '案例二：reward 上升伴随长度暴涨 —— 长度作弊',
          '案例三：KL 飞了，模型开始说胡话',
          '案例四：熵掉到接近 0，输出全部一样',
          '案例五：优势标准差归零，训练实际已停',
          '案例六：曲线锯齿 —— 学习率或 batch 太小',
        ],
      },
      {
        id: 'improve-it',
        title: '把分数再往上推：三轮迭代实验',
        summary: '同一套代码，只改超参和 reward，做三轮对照实验，把 GSM8K 分数推到你能达到的最高点。',
        kind: 'lab',
        status: 'ready',
        minutes: 60,
        objectives: [
          '设计一组只改一个变量的对照实验',
          '用固定测试集比较三轮结果，并解释差异来源',
          '产出一份能给别人看的实验报告',
        ],
        outline: [
          '实验纪律：一次只改一个变量，固定随机种子',
          '第一轮：调 group size G（4 / 8 / 16）',
          '第二轮：调 KL 系数（0 / 0.001 / 0.01）',
          '第三轮：改 reward 权重或加长度惩罚',
          '每轮都在 held-out 测试集上评',
          '报告模板：改了什么、分数变化、你的解释',
        ],
      },
    ],
  },

  /* ==================== L3 ==================== */
  {
    id: 'l3-frameworks',
    level: 'L3',
    title: '上机',
    subtitle: '框架层：TRL 实跑 + slime/Miles 对照',
    goal: '手写脚本让你懂原理，框架让你能干活。这一阶段先用 TRL + vLLM 在 5090 上把同一个任务重跑一遍，再去读 slime 与 Miles 的设计，理解工业级框架在解决什么你刚刚亲手踩过的问题。',
    lessons: [
      {
        id: 'why-frameworks',
        title: '手写脚本会死在哪：框架解决的五个问题',
        summary: '你的 200 行脚本在单卡小模型上够用。这一节说清它在什么位置会撑不住，从而知道框架的每个模块是为什么存在的。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '列出手写脚本的五个硬伤，并对应到框架里的具体模块',
          '判断自己的下一个任务该继续手写还是上框架',
          '读框架文档时能把术语映射回自己写过的代码',
        ],
        outline: [
          '硬伤一：模型放不下 —— 并行策略（TP/PP/CP/EP）',
          '硬伤二：采样慢且卡住训练 —— 异步 rollout 与 Data Buffer',
          '硬伤三：权重同步慢 —— P2P / RDMA、delta 同步',
          '硬伤四：一步挂了全盘重来 —— checkpoint 与容错',
          '硬伤五：看不见发生了什么 —— 观测与 trace',
          '术语对照表：你写的变量名 ↔ 框架里的模块名',
        ],
        refs: [REF_SLIME, REF_MILES],
      },
      {
        id: 'trl-grpo',
        title: 'TRL GRPOTrainer：5090 单卡实跑',
        summary: '把手写脚本换成 TRL，跑同一个任务、比同一个分数。这是本站唯一在 5090 上被验证过的框架路径。',
        kind: 'lab',
        status: 'ready',
        minutes: 50,
        objectives: [
          '用 GRPOTrainer 复现 L2 的实验，并对上分数',
          '把自己写的 reward 函数接进 TRL 的 reward_funcs',
          '把 TRL 的配置项逐个映射回你手写代码里的变量',
        ],
        outline: [
          '为什么单卡框架层选 TRL：装得上、能 colocate、文档跟得上',
          '最小可跑脚本：GRPOConfig + reward_funcs + 数据集',
          '配置项对照表：num_generations ↔ G、beta ↔ KL 系数、epsilon ↔ clip',
          '接自己的 reward：函数签名与返回值约定',
          '跑起来，和 L2 的曲线放在一起比',
          '差异排查：分数不一致时先看哪三个地方',
        ],
        refs: [REF_TRL_GRPO, REF_HF_COOKBOOK],
      },
      {
        id: 'vllm-colocate',
        title: '训推同卡：colocate 的显存怎么分',
        summary: '单卡上训练和推理抢同一块 32GB。这一节把 colocate 模式调稳，并知道它比多卡慢在哪。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '说清 colocate 与 server 两种模式的区别，以及单卡为什么只能用前者',
          '调出一组不 OOM 又不浪费的显存分配参数',
          '解释 sleep mode 在省什么，以及为什么 colocate 必然比 server 慢',
        ],
        outline: [
          '两种模式：server（分卡，HTTP 通信）与 colocate（同卡，交替执行）',
          '单卡的现实：只能 colocate，训练和生成不能重叠',
          '核心参数 vllm_gpu_memory_utilization：从 0.3 开始试',
          'sleep mode：生成完把 KV cache 的显存还回去',
          'OOM 排查顺序：先降 max_completion_length，再降 G，最后动 utilization',
          '记一次真实的时间分解：采样占了百分之多少',
        ],
        refs: [REF_TRL_VLLM, REF_VLLM],
      },
      {
        id: 'slime-miles-arch',
        title: '读 slime 与 Miles：工业级 RL 框架长什么样',
        summary: '这两个框架单卡跑不了，但正是最好的架构教材。带着你刚踩过的坑去读它们的设计文档。',
        kind: 'concept',
        status: 'ready',
        minutes: 50,
        objectives: [
          '画出 slime 的 训练 / rollout / Data Buffer 三段结构，并说清数据怎么流',
          '解释 Miles 的 fully-async、TITO、R3、P2P weight transfer 各解决什么问题',
          '看懂一份 8×H100 的启动脚本，认出每个参数属于哪一层',
        ],
        outline: [
          'slime 的设计取舍：只绑 SGLang 一个推理后端，为什么',
          'Data Buffer：把 agentic、工具调用、verifier 都收敛成「数据生成」',
          'Megatron 侧的并行参数：TP / PP / CP / EP 各自切什么',
          'colocate 在多卡上的含义与单卡的区别',
          'Miles 的四个关键词：fully-async、TITO、Rollout Routing Replay、P2P 权重传输',
          '读一份真实启动脚本：把 40 个参数分成五类',
          '这些设计里，哪些在单卡上仍然有用（答案：比你想的多）',
        ],
        refs: [REF_SLIME, REF_MILES, REF_VERL],
      },
      {
        id: 'scale-out',
        title: '从 1 卡到 8 卡：哪些结论会变',
        summary: '你在单卡上得到的所有直觉，哪些能带上多卡，哪些必须扔掉。为将来真有机器的那天做准备。',
        kind: 'concept',
        status: 'ready',
        minutes: 30,
        objectives: [
          '说清 batch size、学习率、G 在扩到多卡时该怎么跟着变',
          '判断一个任务是被显存卡住还是被吞吐卡住',
          '看懂多卡启动脚本里 ray / torchrun 那一层在做什么',
        ],
        outline: [
          '不变的：算法本身、reward 设计、曲线的读法',
          '要变的：全局 batch、学习率、rollout 与训练的卡数配比',
          'colocate 与 disaggregated 的选择依据',
          'ray 集群怎么起，为什么 RL 框架偏爱 ray',
          '成本视角：8×H100 一小时能做完你在 5090 上跑一周的量',
          '云上租卡的最小实验：先花 20 块钱验证脚本能跑',
        ],
        refs: [REF_SLIME, REF_MILES],
      },
    ],
  },

  /* ==================== L4 ==================== */
  {
    id: 'l4-ops',
    level: 'L4',
    title: '淬火',
    subtitle: '评测、调参与排障',
    goal: '能跑通只是起点。这一阶段处理真正决定成败的部分：怎么评得可信、参数按什么顺序调、五种常见炸法怎么认怎么救，以及一次实验到底要花多久。',
    lessons: [
      {
        id: 'failure-modes',
        title: '闯关：五种炸法',
        summary: '熵崩塌、reward hacking、长度爆炸、KL 跑飞、OOM。每一种给现场证据，你来判断和处置。',
        kind: 'quest',
        status: 'ready',
        minutes: 45,
        objectives: [
          '看到日志和曲线就能认出是哪一种失效',
          '对每种失效给出第一步处置动作，而不是把所有参数都动一遍',
          '知道哪些失效是必须重启训练的，哪些可以边跑边救',
        ],
        outline: [
          '炸法一：熵崩塌 —— 输出高度同质，探索停止',
          '炸法二：reward hacking —— 分数涨、能力没涨',
          '炸法三：长度爆炸 —— 全部回答顶到 max_tokens',
          '炸法四：KL 跑飞 —— 语言能力被训坏',
          '炸法五：OOM —— 采样长度、组大小、显存分配三处任选',
          '通用处置顺序：先冻结变量，再二分定位',
        ],
        refs: [REF_UNSLOTH_RL],
      },
      {
        id: 'eval-harness',
        title: '评测：别用训练集骗自己',
        summary: '把评测做成一条能重复执行的流水线，让每次实验的分数可比。',
        kind: 'lab',
        status: 'ready',
        minutes: 40,
        objectives: [
          '搭一条固定种子、固定采样参数的评测流程',
          '说清 greedy 与采样、pass@1 与 pass@k 分别适合报什么',
          '识别评测污染与「过拟合到测试集」的迹象',
        ],
        outline: [
          '评测三要素：固定测试集、固定采样参数、固定判分器',
          'greedy 报主分，采样报 pass@k',
          '判分器本身的误差要估出来（抽 50 条人工核对）',
          '泛化检查：换一个同类数据集看分数还在不在',
          '把评测接进训练循环：eval_interval 该设多大',
          '结果表怎么写才不会骗自己',
        ],
      },
      {
        id: 'hyperparams',
        title: '调参优先级：先动哪三个旋钮',
        summary: '十几个超参不必都调。按影响排序，前三个决定成败，剩下的基本不用碰。',
        kind: 'concept',
        status: 'ready',
        minutes: 35,
        objectives: [
          '按影响力给 GRPO 的超参排序，并说出每个的合理起始值',
          '判断一个现象该调哪个参数，而不是全部微调一遍',
          '在有限的卡时里设计出信息量最大的实验序列',
        ],
        outline: [
          '第一优先：reward 设计（不算超参，但影响最大）',
          '第二优先：学习率 与 KL 系数',
          '第三优先：group size G 与 batch size',
          '基本不用动的：clip 阈值、优化器 betas、warmup',
          '采样温度：探索与稳定的直接旋钮',
          '起始配置表：0.6B / 1.7B / LoRA 各一组',
        ],
        refs: [REF_TRL_GRPO],
      },
      {
        id: 'time-budget',
        title: '时间账：一次实验到底要跑多久',
        summary: '用你在 L0 测出的 tok/s，算出一次实验的墙钟时间。计算器帮你在开跑之前就知道要等多久。',
        kind: 'planner',
        status: 'ready',
        minutes: 30,
        objectives: [
          '估出一次训练的总时长，误差在 30% 以内',
          '说出 rollout 与训练各占多少时间，以及该优化哪一头',
          '在给定时间预算下反推出该缩哪个参数',
        ],
        outline: [
          '一步的时间构成：采样 + 前向 + 反向 + 权重同步',
          '为什么采样通常占 60% 到 80%',
          '总 token 数怎么算：步数 × prompt 数 × G × 平均长度',
          'colocate 的额外开销：切换与 sleep/wake',
          '交互计算器：拨参数看总时长',
          '省时间的四个动作，按性价比排序',
        ],
      },
      {
        id: 'whats-next',
        title: '走完之后：下一道门在哪',
        summary: '你已经能在单卡上完整跑一轮 RL。接下来是 agentic RL、多轮工具调用、更大的模型——以及它们各自要求什么。',
        kind: 'concept',
        status: 'ready',
        minutes: 25,
        objectives: [
          '知道 agentic RL 与单轮 RLVR 在工程上的差别',
          '列出继续深入需要补的三块知识',
          '给自己排一个下一步的具体项目',
        ],
        outline: [
          'agentic RL：多轮、工具调用、环境反馈，reward 变得稀疏',
          '沙箱与 verifier：为什么代码任务需要一套基础设施',
          'on-policy distillation：比 RL 便宜的替代路线',
          '更大的模型：LoRA 到 8B，再往上就要租卡',
          '值得读的三篇论文与两个仓库',
          '给自己排的下一个项目：从一个你真正在意的任务开始',
        ],
        refs: [REF_SLIME, REF_MILES, REF_R1],
      },
    ],
  },
]

/* ---------- 派生查询 ---------- */

export const allLessons = tracks.flatMap((track) =>
  track.lessons.map((lesson) => ({ track, lesson })),
)

export function getTrack(trackId: string): Track | undefined {
  return tracks.find((t) => t.id === trackId)
}

export function getLesson(trackId: string, lessonId: string) {
  const track = getTrack(trackId)
  if (!track) return undefined
  const index = track.lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return undefined
  return {
    track,
    lesson: track.lessons[index],
    prev: track.lessons[index - 1],
    next: track.lessons[index + 1],
  }
}

/** 全局线性顺序，用于"上一课 / 下一课"跨阶段跳转 */
export function getFlatNeighbors(trackId: string, lessonId: string) {
  const index = allLessons.findIndex(
    (item) => item.track.id === trackId && item.lesson.id === lessonId,
  )
  return {
    prev: index > 0 ? allLessons[index - 1] : undefined,
    next: index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : undefined,
  }
}

export function lessonKey(trackId: string, lessonId: string) {
  return `${trackId}/${lessonId}`
}

export const stats = {
  trackCount: tracks.length,
  lessonCount: allLessons.length,
  readyCount: allLessons.filter(({ lesson }) => lesson.status === 'ready').length,
  labCount: allLessons.filter(({ lesson }) => lesson.kind === 'lab' || lesson.kind === 'quest')
    .length,
  totalMinutes: allLessons.reduce((sum, { lesson }) => sum + lesson.minutes, 0),
}
