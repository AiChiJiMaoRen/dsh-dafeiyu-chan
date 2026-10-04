import { isNight } from './timer.ts'
import type { MemorySnapshot } from '../types.ts'

export function nicknameFromMemory(memory: MemorySnapshot | undefined): { value: string; source: string } {
  if (isNight()) return { value: '夜猫子', source: '夜间双击' }
  const log = memory?.progressLog ?? []
  if (log.length >= 5) return { value: '小话痨', source: '记忆条目较多' }
  if (log.length > 0 && log.every((entry) => entry.kind === 'progress')) return { value: '卷王', source: '进展记录较多' }
  if (log.length > 0 && log.every((entry) => entry.kind === 'todo')) return { value: '拖延症晚期', source: '待办记录较多' }
  const focus = memory?.currentFocus ?? ''
  if (/代码|写|修/.test(focus)) return { value: '程序员', source: '当前关注点' }
  if (/文档|报告/.test(focus)) return { value: '文档侠', source: '当前关注点' }
  if (memory?.mood === 'up') return { value: '小太阳', source: '心情记录' }
  return { value: '小机灵鬼', source: '默认称呼' }
}