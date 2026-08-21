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
    <section className="my-7 overflow-hidden rounded-xl border border-hairline bg-canvas shadow-card">
      <header className="flex items-center gap-3 border-b border-hairline bg-canvas-soft px-4 py-2.5">
        <span className="eyebrow text-body">检查点</span>
        <span className="font-mono text-[11px] text-mute">{multi ? '多选' : '单选'}</span>
      </header>

      <div className="px-4 py-4 sm:px-5 sm:py-5">
        <p className="mb-4 font-medium tracking-tight text-ink">{question}</p>

        <ul className="space-y-2">
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const reveal = submitted
            let cls = 'border-hairline hover:border-hairline-strong hover:bg-canvas-soft'
            if (chosen && !reveal) cls = 'border-ink bg-canvas-soft-2'
            if (reveal && option.correct) cls = 'border-teal-300 bg-teal-50'
            if (reveal && chosen && !option.correct) cls = 'border-red-300 bg-red-50'

            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  disabled={submitted}
                  className={`w-full rounded-ui border px-3 py-2.5 text-left text-sm transition-colors ${cls} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="mr-2.5 font-mono text-xs text-mute">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-ink">{option.text}</span>
                  {reveal && chosen && !option.correct && option.feedback && (
                    <span className="mt-1.5 block text-xs leading-relaxed text-red-800">
                      {option.feedback}
                    </span>
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
            className="mt-5 rounded-ui bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-body disabled:cursor-not-allowed disabled:bg-hairline disabled:text-mute"
          >
            提交
          </button>
        ) : (
          <div className="mt-5">
            <div
              className={`rounded-ui border px-3.5 py-3 text-sm leading-relaxed ${
                isCorrect ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              <strong className="font-medium">{isCorrect ? '答对了。' : '还不对。'}</strong>
              {explain ? <div className="mt-1.5 text-body">{explain}</div> : null}
            </div>
            {!isCorrect && (
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-ui border border-hairline px-4 py-1.5 text-sm text-ink transition-colors hover:bg-canvas-soft-2"
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
