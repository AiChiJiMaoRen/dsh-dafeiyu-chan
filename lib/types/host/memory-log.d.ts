/**
 * 对话/工作进展摘要记忆 — the "layer 1 memory" stepping stone:
 * after each chat turn, one lightweight LLM call distills the 用户消息 + 大肥鱼
 * 回复 into 0~2 condensed `MemoryEntry` lines (progress/todo) plus a one-line
 * `currentFocus`. This module owns that call and its defensive parsing.
 *
 * Contract: never throws — any failure (no LLM, no default model, bad JSON)
 * degrades to an empty summary, leaving the caller's memory untouched.
 * @module dsh-dafeiyu/host/memory-log
 */
import type { Context } from '@deepseek-ai/cordis';
import type { MemoryEntry, WhaleMemory } from '../core/types.ts';
/** Result of distilling one chat turn into memory layers. */
export interface TurnSummary {
    /** 0~2 condensed entries (empty when nothing worth remembering). */
    entries: MemoryEntry[];
    /** One-line "what the user is up to", or undefined when not updated. */
    currentFocus: string | undefined;
}
/** How many progressLog entries the greeting context draws on (contract: last 3). */
export declare const GREETING_RECENT = 3;
/** Hard cap on the stored progressLog (contract: keep newest 20). */
export declare const MAX_LOG_ENTRIES = 20;
/** Per-entry text length cap (contract: ≤120 chars). */
export declare const MAX_TEXT_LEN = 120;
/**
 * Distill one chat turn into memory layers via a single LLM call.
 * The output is strict JSON `{ "entries": [...], "currentFocus": "..." }`; the
 * parse is tolerant of LLM chatter. Every failure path returns an empty summary.
 *
 * @param ctx - host context carrying llm + agentDefaultModel.
 * @param userText - the user's latest message.
 * @param whaleReply - 大肥鱼's reply to that message.
 * @param prevMemory - the memory as of this turn (its currentFocus feeds the prompt).
 * @returns a never-throwing TurnSummary.
 */
export declare function summarizeTurn(ctx: Context, userText: string, whaleReply: string, prevMemory: WhaleMemory): Promise<TurnSummary>;
/**
 * Parse the LLM's answer into a TurnSummary with heavy tolerance:
 * - extract the first `{...}` JSON object even if the LLM wrapped it in prose;
 * - validate each entry's shape/kind/length, drop the bad ones;
 * - never throw — return an empty summary on any malformed output.
 */
export declare function parseSummary(raw: string, prevMemory: WhaleMemory): TurnSummary;
/**
 * Merge a turn's summary into the memory's progressLog and currentFocus.
 * Pushes newest entries to the front and trims to MAX_LOG_ENTRIES. Pure helper —
 * does not persist; the caller owns saveMemory.
 */
export declare function applySummary(memory: WhaleMemory, summary: TurnSummary): void;
