import { useState } from 'react'
import type { ReactNode } from 'react'
import { useLessonKey } from './lesson-context'
import { setQuizPassed } from '#/lib/progress'

export interface QuizOption {
  text: string
  correct?: boolean
  /** 选错时针对性的解释，比统一答案更有教学价值 */
  feedback?: string
}

/**
 * 随堂检查点。多选时必须完全选对才算通过。
 * 通过后写进 localStorage，课程页顶部的检查点计数会跟着变。
 */
export function Quiz({
  id,
  question,
  options,
  explain,
}: {
  id: string
  question: string
  options: QuizOption[]
  explain?: ReactNode
}) {
  const lessonKey = useLessonKey()
  const multi = options.filter((o) => o.correct).length > 1
  const [picked, setPicked] = useState<number[]>([])
  const [submitted, setSubmitted] = useState(false)

  const correctSet = options.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0)
  const isCorrect =
    submitted && picked.length === correctSet.length && picked.every((i) => correctSet.includes(i))

  function toggle(index: number) {
    if (submitted) return
    setPicked((prev) =>
      multi ? (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]) : [index],
    )
  }

  function submit() {
    if (!picked.length) return
    setSubmitted(true)
    const ok = picked.length === correctSet.length && picked.every((i) => correctSet.includes(i))
    if (ok) setQuizPassed(`${lessonKey}#${id}`, true)
  }

  function retry() {
    setSubmitted(false)
    setPicked([])
  }

  return (
    <section className="my-6 overflow-hidden rounded-md bg-canvas shadow-card">
      <header className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span className="eyebrow">Checkpoint</span>
        <span className="font-mono text-[11px] text-mute">{multi ? '多选' : '单选'}</span>
      </header>

      <div className="px-4 py-4">
        <p className="mb-3 font-medium text-ink">{question}</p>

        <ul className="space-y-2">
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const reveal = submitted
            let cls = 'border-line bg-canvas hover:border-line-strong hover:bg-soft'
            if (chosen && !reveal) cls = 'border-brand-500 bg-brand-50'
            if (reveal && option.correct) cls = 'border-info bg-info-soft/50'
            if (reveal && chosen && !option.correct) cls = 'border-danger bg-danger-soft/50'

            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  disabled={submitted}
                  aria-pressed={chosen}
                  className={`w-full rounded-sm border px-3 py-2.5 text-left text-sm transition ${cls} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="mr-2 font-mono text-xs text-mute">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-ink">{option.text}</span>
                  {reveal && chosen && !option.correct && option.feedback && (
                    <span className="mt-1 block text-xs text-danger-deep">{option.feedback}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!picked.length}
            className="mt-4 rounded-sm bg-brand-500 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:bg-soft-2 disabled:text-mute"
          >
            提交
          </button>
        ) : (
          <div className="mt-4">
            <div
              className={`rounded-sm px-3 py-2.5 text-sm ${
                isCorrect ? 'bg-info-soft/50 text-info-deep' : 'bg-danger-soft/50 text-danger-deep'
              }`}
            >
              <strong className="font-medium">{isCorrect ? '答对了。' : '还不对。'}</strong>
              {explain ? <div className="mt-1 text-body">{explain}</div> : null}
            </div>
            {!isCorrect && (
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-sm bg-soft-2 px-4 py-2 text-sm text-body shadow-hair transition hover:text-ink"
              >
                再试一次
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
