import { behavior } from '../config/behavior.ts'
import { copy, type IdleBubble } from '../config/copy.ts'

export function isNight(): boolean {
  const hour = new Date().getHours()
  return hour >= 23 || hour < 6
}

export function chooseIdleBubble(previous: string[]): IdleBubble {
  const candidates = copy.idleBubbles.filter((entry) => !entry.nightOnly || isNight()).filter((entry) => !previous.includes(entry.id))
  const pool = candidates.length > 0 ? candidates : copy.idleBubbles.filter((entry) => !entry.nightOnly || isNight())
  const weighted = pool.map((entry) => ({ entry, weight: entry.id === 'qianwen-idle' ? behavior.weights.qianwenIdle : entry.nightOnly ? behavior.weights.nightBubble : entry.weight }))
  const total = weighted.reduce((sum, item) => sum + item.weight, 0)
  let cursor = Math.random() * total
  for (const item of weighted) {
    cursor -= item.weight
    if (cursor <= 0) return item.entry
  }
  return weighted[weighted.length - 1].entry
}

export function randomBubbleDelay(): number {
  const span = behavior.timing.bubbleMaxDelay - behavior.timing.bubbleMinDelay
  return behavior.timing.bubbleMinDelay + Math.random() * span
}

export function chooseLanding(): 'eatRun' | 'slack' | 'rewrite' {
  const entries = [
    { id: 'eatRun' as const, weight: behavior.weights.eatRun },
    { id: 'slack' as const, weight: behavior.weights.slack },
    { id: 'rewrite' as const, weight: behavior.weights.rewrite },
  ]
  let cursor = Math.random() * entries.reduce((sum, item) => sum + item.weight, 0)
  for (const entry of entries) {
    cursor -= entry.weight
    if (cursor <= 0) return entry.id
  }
  return 'rewrite'
}