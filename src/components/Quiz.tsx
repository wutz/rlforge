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
    <section className="my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-e2">
      <header className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <span className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          检查点
        </span>
        <span className="font-mono text-[11px] text-gray-500">{multi ? '多选' : '单选'}</span>
      </header>

      <div className="px-4 py-4">
        <p className="mb-3.5 font-medium text-gray-900">{question}</p>

        <ul className="space-y-2">
          {options.map((option, index) => {
            const chosen = picked.includes(index)
            const reveal = submitted
            let cls = 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
            if (chosen && !reveal) cls = 'border-gray-900 bg-gray-50'
            if (reveal && option.correct) cls = 'border-emerald-300 bg-emerald-50'
            if (reveal && chosen && !option.correct) cls = 'border-rose-300 bg-rose-50'

            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  disabled={submitted}
                  aria-pressed={chosen}
                  className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition ${cls} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <span className="mr-2 font-mono text-xs text-gray-500">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-gray-800">{option.text}</span>
                  {reveal && chosen && !option.correct && option.feedback && (
                    <span className="mt-1.5 block text-xs text-rose-800">{option.feedback}</span>
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
            className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-e1 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
          >
            提交
          </button>
        ) : (
          <div className="mt-4">
            <div
              className={`rounded-md border px-3 py-2.5 text-sm ${
                isCorrect
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              <strong className="font-medium">{isCorrect ? '答对了。' : '还不对。'}</strong>
              {explain ? <div className="mt-1.5 text-gray-700">{explain}</div> : null}
            </div>
            {!isCorrect && (
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-md border border-gray-200 px-4 py-1.5 text-sm text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
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
