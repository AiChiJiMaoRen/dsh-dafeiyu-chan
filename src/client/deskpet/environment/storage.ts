import { behavior } from '../config/behavior.ts'
import type { DeskpetStorage } from '../types.ts'

const emptyState = (): DeskpetStorage => ({ schema: behavior.storage.schema, nicknames: [], stats: { dragged: 0, poked: 0 } })

export function loadStorage(): DeskpetStorage {
  try {
    const raw = globalThis.localStorage?.getItem(behavior.storage.key)
    if (!raw) return emptyState()
    const value = JSON.parse(raw) as Partial<DeskpetStorage>
    return {
      schema: behavior.storage.schema,
      nicknames: Array.isArray(value.nicknames) ? value.nicknames.filter((item) => item && typeof item.value === 'string' && typeof item.source === 'string') : [],
      stats: {
        dragged: Number(value.stats?.dragged) || 0,
        poked: Number(value.stats?.poked) || 0,
      },
      pos: typeof value.pos?.x === 'number' ? { x: value.pos.x } : undefined,
    }
  } catch {
    return emptyState()
  }
}

export function saveStorage(value: DeskpetStorage): void {
  try { globalThis.localStorage?.setItem(behavior.storage.key, JSON.stringify(value)) } catch { /* storage is optional */ }
}