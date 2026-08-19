/**
 * 显存账本。
 *
 * 目标不是精确到 MB，而是让人在开跑之前判断「这个配置能不能进 32GB」，
 * 并看清显存花在了哪几处。真实占用还受 kernel workspace、显存碎片、
 * allocator 缓存影响，所以结果里留了一条 headroom 提示。
 *
 * 模型架构参数按 Qwen3 系列的 config.json 填的，换模型请自己核对
 * num_hidden_layers / num_key_value_heads / head_dim / vocab_size。
 */

export interface ModelSpec {
  id: string
  label: string
  /** 参数量 */
  params: number
  layers: number
  hidden: number
  /** GQA 的 KV 头数，决定 KV cache 大小 */
  kvHeads: number
  headDim: number
  vocab: number
}

export const MODELS: ModelSpec[] = [
  { id: 'qwen3-0.6b', label: 'Qwen3-0.6B', params: 0.6e9, layers: 28, hidden: 1024, kvHeads: 8, headDim: 128, vocab: 151936 },
  { id: 'qwen3-1.7b', label: 'Qwen3-1.7B', params: 1.7e9, layers: 28, hidden: 2048, kvHeads: 8, headDim: 128, vocab: 151936 },
  { id: 'qwen3-4b', label: 'Qwen3-4B', params: 4.0e9, layers: 36, hidden: 2560, kvHeads: 8, headDim: 128, vocab: 151936 },
  { id: 'qwen3-8b', label: 'Qwen3-8B', params: 8.2e9, layers: 36, hidden: 4096, kvHeads: 8, headDim: 128, vocab: 151936 },
  { id: 'qwen3-14b', label: 'Qwen3-14B', params: 14.8e9, layers: 40, hidden: 5120, kvHeads: 8, headDim: 128, vocab: 151936 },
]

export type TrainMode = 'full' | 'lora' | 'qlora'

export const TRAIN_MODE_LABEL: Record<TrainMode, string> = {
  full: '全参微调',
  lora: 'LoRA（基座 bf16 冻结）',
  qlora: 'QLoRA（基座 4bit 冻结）',
}

/** LoRA rank → 可训练参数占比的粗估（按 attn + mlp 全挂适配器） */
export const LORA_RANKS = [8, 16, 32, 64] as const
const LORA_RATIO: Record<number, number> = { 8: 0.002, 16: 0.004, 32: 0.008, 64: 0.016 }

export interface VramInput {
  modelId: string
  trainMode: TrainMode
  loraRank: number
  /** 训练时的 micro batch（序列条数） */
  microBatch: number
  /** prompt + completion 的总长度 */
  seqLen: number
  /** 是否开梯度检查点 */
  gradCheckpoint: boolean
  /** 是否常驻一份参考模型（GRPO 的 KL 项需要） */
  refModel: boolean
  /** 训推同卡：vLLM 也要吃显存 */
  colocate: boolean
  /** rollout 的并发序列数 */
  rolloutConcurrency: number
  /** rollout 的最大长度 */
  rolloutLen: number
  /** 卡的总显存，GiB */
  totalGiB: number
}

const GiB = 1024 ** 3

/** 每 token 的 KV cache 字节数（K 和 V 两份，fp16/bf16） */
export function kvBytesPerToken(model: ModelSpec, bytesPerElem = 2) {
  return 2 * model.layers * model.kvHeads * model.headDim * bytesPerElem
}

export interface VramLine {
  label: string
  giB: number
  /** 归到哪一组，用于分色 */
  group: 'train' | 'ref' | 'infer'
  note: string
}

export interface VramResult {
  model: ModelSpec
  lines: VramLine[]
  trainGiB: number
  inferGiB: number
  totalGiB: number
  /** 预留给 CUDA context、kernel workspace、碎片 */
  reserveGiB: number
  freeGiB: number
  fits: boolean
  /** 占总显存比例，用于画条 */
  usedRatio: number
  trainableParams: number
  kvPerTokenKiB: number
  warnings: string[]
  suggestions: string[]
}

export function planVram(input: VramInput): VramResult {
  const model = MODELS.find((m) => m.id === input.modelId) ?? MODELS[0]
  const reserveGiB = 1.2

  const trainableParams =
    input.trainMode === 'full' ? model.params : model.params * (LORA_RATIO[input.loraRank] ?? 0.004)

  /* ---- 权重 ---- */
  const baseBytesPerParam = input.trainMode === 'qlora' ? 0.55 : 2
  const weightsGiB = (model.params * baseBytesPerParam) / GiB

  /* ---- 梯度：只有可训练参数有 ---- */
  const gradGiB = (trainableParams * 2) / GiB

  /* ---- 优化器：AdamW 的 fp32 master + m + v = 12 字节/参数 ---- */
  const optimGiB = (trainableParams * 12) / GiB

  /* ---- 激活 ---- */
  const perLayerBoundary = input.microBatch * input.seqLen * model.hidden * 2
  const activationGiB =
    (input.gradCheckpoint
      ? perLayerBoundary * (model.layers + 4)
      : perLayerBoundary * model.layers * 10) / GiB

  /* ---- logits：新手最容易忽略的一项，词表大就爆 ---- */
  const logitsGiB = (input.microBatch * input.seqLen * model.vocab * 2 * 2) / GiB

  /* ---- 参考模型 ---- */
  const refGiB = input.refModel ? (model.params * 2) / GiB : 0

  /* ---- 推理引擎 ---- */
  const engineWeightGiB = input.colocate ? (model.params * 2) / GiB : 0
  const kvPerToken = kvBytesPerToken(model)
  const kvGiB = input.colocate
    ? (kvPerToken * input.rolloutLen * input.rolloutConcurrency) / GiB
    : 0

  const lines: VramLine[] = [
    {
      label: '策略模型权重',
      giB: weightsGiB,
      group: 'train',
      note: input.trainMode === 'qlora' ? '4bit 量化基座，约 0.55 字节/参数' : 'bf16，2 字节/参数',
    },
    {
      label: '梯度',
      giB: gradGiB,
      group: 'train',
      note: input.trainMode === 'full' ? '全参：与权重同量级' : 'LoRA：只有适配器有梯度',
    },
    {
      label: '优化器状态',
      giB: optimGiB,
      group: 'train',
      note: 'AdamW：fp32 主权重 + 一阶 + 二阶动量，12 字节/可训练参数',
    },
    {
      label: '激活',
      giB: activationGiB,
      group: 'train',
      note: input.gradCheckpoint ? '开了梯度检查点，只存层边界' : '没开检查点，逐层中间量全留',
    },
    {
      label: 'logits 与 logprob',
      giB: logitsGiB,
      group: 'train',
      note: `词表 ${model.vocab.toLocaleString('en-US')}，长度 × 词表 × 2 份`,
    },
    {
      label: '参考模型',
      giB: refGiB,
      group: 'ref',
      note: input.refModel ? 'bf16 冻结，算 KL 用' : '关掉了：KL 系数为 0 时可以不留',
    },
    {
      label: 'vLLM 权重',
      giB: engineWeightGiB,
      group: 'infer',
      note: input.colocate ? '推理引擎自己持有一份权重' : '未开训推同卡',
    },
    {
      label: 'KV cache',
      giB: kvGiB,
      group: 'infer',
      note: input.colocate
        ? `${(kvPerToken / 1024).toFixed(0)} KiB/token × ${input.rolloutLen} × ${input.rolloutConcurrency} 并发`
        : '未开训推同卡',
    },
  ]

  const trainGiB = lines.filter((l) => l.group === 'train').reduce((s, l) => s + l.giB, 0)
  const inferGiB = lines.filter((l) => l.group === 'infer').reduce((s, l) => s + l.giB, 0)
  const totalUsed = trainGiB + refGiB + inferGiB + reserveGiB
  const freeGiB = input.totalGiB - totalUsed

  /* ---- 警告与建议 ---- */
  const warnings: string[] = []
  const suggestions: string[] = []

  if (freeGiB < 0) {
    warnings.push(`超了 ${Math.abs(freeGiB).toFixed(1)} GiB，这个配置会 OOM。`)
  } else if (freeGiB < 2) {
    warnings.push('余量不足 2 GiB，实际跑起来很可能被显存碎片顶掉，建议再压一压。')
  }

  if (logitsGiB > trainGiB * 0.3 && logitsGiB > 1) {
    warnings.push(
      `logits 占了训练侧的 ${((logitsGiB / trainGiB) * 100).toFixed(0)}%，这是长序列 + 大词表的典型症状，优先降 micro batch 而不是降模型。`,
    )
  }

  if (input.colocate && kvGiB > 6) {
    warnings.push(
      `KV cache 已经 ${kvGiB.toFixed(1)} GiB。rollout 的并发数与长度对显存是乘法关系，降并发比降长度更不影响效果。`,
    )
  }

  if (input.trainMode === 'full' && model.params > 1e9) {
    warnings.push('超过 1B 还走全参，优化器状态会吃掉大半张卡。单卡建议从 LoRA 起步。')
  }

  if (!input.gradCheckpoint && activationGiB > 3) {
    suggestions.push('开梯度检查点：激活能降一个数量级，代价是多约 30% 的前向计算。')
  }
  if (input.trainMode === 'full' && freeGiB < 4) {
    suggestions.push('换 LoRA：梯度与优化器状态会掉到零点几 GiB，是最有效的一刀。')
  }
  if (input.microBatch > 1 && freeGiB < 4) {
    suggestions.push('micro batch 降到 1，用梯度累积把有效 batch 补回来——数学上等价，只是慢一点。')
  }
  if (input.colocate && freeGiB < 4) {
    suggestions.push('开 vLLM 的 sleep mode：训练阶段把 KV cache 的显存还回来，等下一轮采样再申请。')
  }
  if (freeGiB > 8) {
    suggestions.push(
      `还剩 ${freeGiB.toFixed(1)} GiB。优先加 rollout 并发（采样是墙钟时间的大头），而不是加 micro batch。`,
    )
  }

  return {
    model,
    lines: lines.filter((l) => l.giB > 0 || l.group === 'train'),
    trainGiB,
    inferGiB,
    totalGiB: totalUsed,
    reserveGiB,
    freeGiB,
    fits: freeGiB >= 0,
    usedRatio: Math.min(1, totalUsed / input.totalGiB),
    trainableParams,
    kvPerTokenKiB: kvPerToken / 1024,
    warnings,
    suggestions,
  }
}
