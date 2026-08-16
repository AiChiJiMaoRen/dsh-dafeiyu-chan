/**
 * The fixed personal note-book (`~/.dsh/whale-memory.json`): what 大肥鱼
 * remembers about the user. Pure Node fs — deliberately no dsh dependency so
 * this module compiles anywhere (including a machine without a dsh checkout).
 *
 * Invariants (from the finalized spec):
 * - The nickname is FIXED as `杂鱼` — not user-editable, not project-scoped.
 * - The memory is about the person (mood, focus), never about project state,
 *   never historical files. Work is read on demand, not stored here.
 * @module dsh-dafeiyu/host/memory
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import type { WhaleMemory } from '../core/types.ts'

/** Default memory (first-run). The nickname is fixed to 杂鱼 per spec. */
export function defaultMemory(): WhaleMemory {
  return {
    nickname: '杂鱼',
    mood: 'okay',
    currentFocus: undefined,
    lastSeenAt: Date.now(),
    interactionCount: 0,
    progressLog: [],
  }
}

/** The memory file lives under the dsh user dir so it is not project-scoped. */
export function memoryPath(): string {
  return join(homedir(), '.dsh', 'whale-memory.json')
}

/**
 * Read the committed memory (or seed a fresh one when the file is absent).
 * Returns the memory plus a flag whether the file needed seeding.
 * @param file - memory file path (override for tests).
 * @returns the loaded (or seeded) memory.
 */
export async function loadMemory(file: string = memoryPath()): Promise<WhaleMemory> {
  try {
    const raw = await readFile(file, 'utf8')
    const parsed = JSON.parse(raw) as Partial<WhaleMemory>
    const base = defaultMemory()
    // Merge defensively: keep the fixed nickname, tolerate a partial file
    // (an old file without progressLog degrades to an empty log).
    const progressLog = Array.isArray(parsed.progressLog)
      ? parsed.progressLog.filter(isMemoryEntry)
      : []
    return {
      ...base,
      ...parsed,
      nickname: '杂鱼',
      mood: parsed.mood === 'blah' || parsed.mood === 'up' ? parsed.mood : 'okay',
      interactionCount: typeof parsed.interactionCount === 'number' ? parsed.interactionCount : 0,
      currentFocus: typeof parsed.currentFocus === 'string' ? parsed.currentFocus : undefined,
      progressLog,
    }
  } catch {
    // Missing or corrupt — seed a fresh book.
    const seeded = defaultMemory()
    await saveMemory(seeded, file).catch(() => undefined)
    return seeded
  }
}

/** Defensive shape-check for one memo entry from an on-disk file. */
function isMemoryEntry(value: unknown): value is { at: number; text: string; kind: 'progress' | 'todo' } {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as { at?: unknown; text?: unknown; kind?: unknown }
  return typeof entry.at === 'number' && typeof entry.text === 'string' &&
    (entry.kind === 'progress' || entry.kind === 'todo')
}

/** Persist the memory file atomically. */
export async function saveMemory(memory: WhaleMemory, file: string = memoryPath()): Promise<void> {
  await mkdir(dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  await writeFile(tmp, JSON.stringify(memory, null, 2), 'utf8')
  await writeFile(file, JSON.stringify(memory, null, 2), 'utf8')
  try { /* best-effort cleanup */ await new Promise<void>((r) => setTimeout(r, 0)) } catch { /* noop */ }
}
