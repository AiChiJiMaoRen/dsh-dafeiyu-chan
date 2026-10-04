import type { MemorySnapshot } from '../types.ts'

let cached: MemorySnapshot | undefined
let pending: Promise<MemorySnapshot | undefined> | undefined

export function readMemory(): Promise<MemorySnapshot | undefined> {
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  pending = fetch('/api/dsh-dafeiyu/memory', { method: 'GET' })
    .then((response) => response.json() as Promise<{ ok?: boolean; value?: { memory?: MemorySnapshot } }>)
    .then((payload) => {
      cached = payload.ok ? payload.value?.memory : undefined
      return cached
    })
    .catch(() => undefined)
    .finally(() => { pending = undefined })
  return pending
}