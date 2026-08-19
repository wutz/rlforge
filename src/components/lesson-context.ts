import { createContext, useContext } from 'react'

/** 当前课程键 `${trackId}/${lessonId}`，交互组件用它来写进度 */
export const LessonKeyContext = createContext<string>('')

export function useLessonKey() {
  return useContext(LessonKeyContext)
}
