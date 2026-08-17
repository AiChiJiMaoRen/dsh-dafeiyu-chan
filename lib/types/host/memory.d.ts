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
import type { WhaleMemory } from '../core/types.ts';
/** Default memory (first-run). The nickname is fixed to 杂鱼 per spec. */
export declare function defaultMemory(): WhaleMemory;
/** The memory file lives under the dsh user dir so it is not project-scoped. */
export declare function memoryPath(): string;
/**
 * Read the committed memory (or seed a fresh one when the file is absent).
 * Returns the memory plus a flag whether the file needed seeding.
 * @param file - memory file path (override for tests).
 * @returns the loaded (or seeded) memory.
 */
export declare function loadMemory(file?: string): Promise<WhaleMemory>;
/** Persist the memory file atomically. */
export declare function saveMemory(memory: WhaleMemory, file?: string): Promise<void>;
