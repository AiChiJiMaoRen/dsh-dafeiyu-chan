/** Events emitted by the surrounding UI/workflow for the deskpet director. */
export type DeskpetEvent =
  | { type: 'typing-start'; textLength: number }
  | { type: 'typing-stop' }
  | { type: 'message-sent'; textLength: number }
  | { type: 'reply-start' }
  | { type: 'reply-done' }
  | { type: 'reply-error' }
  | { type: 'work-start'; label?: string }
  | { type: 'work-success'; label?: string }
  | { type: 'work-error'; label?: string }
  | { type: 'new-session' }

export type DeskpetEventListener = (event: DeskpetEvent) => void

export type DeskpetEventBus = {
  emit(event: DeskpetEvent): void
  subscribe(listener: DeskpetEventListener): () => void
  dispose(): void
}

export function createDeskpetEventBus(): DeskpetEventBus {
  const listeners = new Set<DeskpetEventListener>()
  let disposed = false
  return {
    emit(event): void {
      if (disposed) return
      for (const listener of [...listeners]) listener(event)
    },
    subscribe(listener): () => void {
      if (disposed) return () => {}
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispose(): void {
      disposed = true
      listeners.clear()
    },
  }
}
