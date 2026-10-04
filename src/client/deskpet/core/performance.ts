import type { DeskpetEventBus, DeskpetEvent } from './events.ts'

export type PerformancePriority = 'ambient' | 'contextual' | 'direct' | 'critical'

const PRIORITY: Record<PerformancePriority, number> = {
  ambient: 10,
  contextual: 40,
  direct: 80,
  critical: 100,
}

export type PerformanceRequest = {
  clip?: string
  priority: PerformancePriority
  bubble?: string
  thought?: boolean
  bubbleCooldownMs?: number
  dedupeKey?: string
}

export type PerformanceHooks = {
  startClip(clip: string, priority: number): boolean
  say(text: string, thought?: boolean): void
  now?: () => number
}

export type PerformanceDirector = {
  request(request: PerformanceRequest): boolean
  isBusy(): boolean
  dispose(): void
}

/**
 * Converts external events into bounded performances. Ambient work is muted
 * while the user is typing or a reply/work request is in flight. Higher
 * priority requests are allowed to interrupt a lower priority action; the
 * clip layer owns the actual handoff so the canvas never goes transparent.
 */
export function createPerformanceDirector(bus: DeskpetEventBus, hooks: PerformanceHooks): PerformanceDirector {
  let disposed = false
  let busy = false
  const lastBubbleAt = new Map<string, number>()
  const now = hooks.now ?? (() => Date.now())

  const request = (performance: PerformanceRequest): boolean => {
    if (disposed) return false
    const priority = PRIORITY[performance.priority]
    const key = performance.dedupeKey ?? performance.bubble ?? performance.clip ?? performance.priority
    const cooldown = Math.max(0, performance.bubbleCooldownMs ?? 0)
    const timestamp = now()
    const last = lastBubbleAt.get(key) ?? 0
    const canSpeak = Boolean(performance.bubble) && timestamp - last >= cooldown
    if (canSpeak) {
      lastBubbleAt.set(key, timestamp)
      hooks.say(performance.bubble!, performance.thought)
    }
    if (!performance.clip) return canSpeak
    return hooks.startClip(performance.clip, priority) || canSpeak
  }

  const handle = (event: DeskpetEvent): void => {
    if (disposed) return
    switch (event.type) {
      case 'typing-start':
        busy = true
        return
      case 'typing-stop':
        busy = false
        return
      case 'message-sent':
        busy = true
        request({ clip: 'jump', priority: 'direct', bubble: '收到。', bubbleCooldownMs: 12000, dedupeKey: 'message-received' })
        return
      case 'reply-start':
        busy = true
        request({ clip: 'look', priority: 'contextual', dedupeKey: 'reply-waiting' })
        return
      case 'reply-done':
        busy = false
        request({ clip: 'cheer', priority: 'contextual', dedupeKey: 'reply-done' })
        return
      case 'reply-error':
        busy = false
        request({ clip: 'startled', priority: 'critical', dedupeKey: 'reply-error' })
        return
      case 'work-start':
        busy = true
        return
      case 'work-success':
        busy = false
        request({ clip: 'cheer', priority: 'contextual', bubble: event.label ? `${event.label}，完成啦。` : '完成啦。', bubbleCooldownMs: 45000, dedupeKey: 'work-success' })
        return
      case 'work-error':
        busy = false
        request({ clip: 'startled', priority: 'critical', bubble: event.label ? `${event.label}遇到一点问题。` : '遇到一点问题，先看看。', bubbleCooldownMs: 30000, dedupeKey: 'work-error' })
        return
      case 'new-session':
        busy = false
        request({ clip: 'jump', priority: 'direct', dedupeKey: 'new-session' })
        return
    }
  }

  const unsubscribe = bus.subscribe(handle)
  return {
    request,
    isBusy: () => busy,
    dispose(): void {
      disposed = true
      unsubscribe()
      lastBubbleAt.clear()
    },
  }
}
