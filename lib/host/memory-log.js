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
import { WHALE_SYSTEM_PROMPT } from "../core/persona.js";
/** How many progressLog entries the greeting context draws on (contract: last 3). */
export const GREETING_RECENT = 3;
/** Hard cap on the stored progressLog (contract: keep newest 20). */
export const MAX_LOG_ENTRIES = 20;
/** Per-entry text length cap (contract: ≤120 chars). */
export const MAX_TEXT_LEN = 120;
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
export async function summarizeTurn(ctx, userText, whaleReply, prevMemory) {
    const empty = { entries: [], currentFocus: undefined };
    try {
        const c = ctx;
        const llm = c.llm;
        const resolved = await resolveModel(c);
        if (!llm || !resolved)
            return empty;
        const prompt = buildSummaryPrompt(userText, whaleReply, prevMemory);
        const stream = llm.stream({
            provider: resolved.provider,
            model: resolved.model,
            system: WHALE_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: [{ type: 'text', text: prompt }] }],
            temperature: 0.4,
            maxTokens: 260,
        });
        let text = '';
        for await (const chunk of stream) {
            if (chunk !== null && typeof chunk === 'object') {
                const c2 = chunk;
                if (c2.type === 'text-delta' && typeof c2.text === 'string')
                    text += c2.text;
                if (c2.type === 'finish')
                    break;
            }
        }
        return parseSummary(text, prevMemory);
    }
    catch {
        return empty;
    }
}
/**
 * Resolve a provider/model the way `createLlmReplyGateway` does: prefer the
 * agent's current default model, fall back to the first listed provider.
 * @returns `{ provider, model }` or null when unavailable.
 */
async function resolveModel(c) {
    let provider;
    let model;
    try {
        const selection = c.agentDefaultModel?.currentSelection?.();
        provider = selection?.provider;
        model = selection?.model;
    }
    catch {
        /* fall through */
    }
    if (!provider || !model) {
        try {
            const llm = c.llm;
            const providers = llm?.listProviders?.() ?? [];
            const first = providers[0];
            if (first?.name) {
                provider = first.name;
                const models = await llm?.listModels?.(first.name).catch(() => undefined);
                model = models?.[0]?.id;
            }
        }
        catch {
            /* no adaptive default */
        }
    }
    return provider && model ? { provider, model } : null;
}
/**
 * Build the distillation prompt. Keeps the persona voice but asks for pure JSON
 * output so it can be reliably parsed back into memory.
 */
function buildSummaryPrompt(userText, whaleReply, prevMemory) {
    const focus = prevMemory.currentFocus ? `用户之前的关注点是：「${prevMemory.currentFocus}」` : '用户还没有明确关注点。';
    return `这是一次大肥鱼（鲸鱼娘看板娘，称呼用户为「杂鱼」，九分娇一分傲的日常系陪伴）和用户的对话。

用户说：「${userText}」

大肥鱼回复：「${whaleReply}」

${focus}

请你从这段对话里，凝练出值得记住的短句。只记真正有信息量的工作进展或待办：
- 用户明确在做某件事、推进到某一步、完成/搞定了什么 → kind 记 "progress"
- 用户提到接下来要做、没完成、说到一半的待办 → kind 记 "todo"
- 只是闲聊、情绪、客套、没有实质进展 → 不要记，entries 给空数组 []
最多 2 条，每条 text 不超过 120 字，用自然口语凝练（别太正式）。
再顺手用一句话概括「用户当前正在做什么」作为 currentFocus（没有就空字符串）。

严格只输出一个 JSON 对象，不要任何解释、前缀或 markdown 代码块：
{ "entries": [ { "text": "...", "kind": "progress" | "todo" } ], "currentFocus": "..." }`;
}
/**
 * Parse the LLM's answer into a TurnSummary with heavy tolerance:
 * - extract the first `{...}` JSON object even if the LLM wrapped it in prose;
 * - validate each entry's shape/kind/length, drop the bad ones;
 * - never throw — return an empty summary on any malformed output.
 */
export function parseSummary(raw, prevMemory) {
    const empty = { entries: [], currentFocus: undefined };
    if (!raw || typeof raw !== 'string')
        return empty;
    const object = extractJsonObject(raw);
    if (!object)
        return empty;
    let entries;
    try {
        const maybeEntries = object.entries;
        entries = Array.isArray(maybeEntries) ? sanitizeEntries(maybeEntries) : [];
    }
    catch {
        entries = [];
    }
    const focusRaw = object.currentFocus;
    let currentFocus;
    if (typeof focusRaw === 'string') {
        const focus = focusRaw.trim();
        if (focus.length > 0 && focus.length <= MAX_TEXT_LEN)
            currentFocus = focus;
    }
    return { entries, currentFocus: currentFocus ?? prevMemory.currentFocus };
}
/**
 * Pull the first JSON object literal out of an arbitrary string. Tries a direct
 * parse first, then scans for the first balanced `{...}` block — so the LLM may
 * wrap its JSON in markdown fences or natural-language chatter.
 */
function extractJsonObject(raw) {
    const text = raw.trim();
    // Fast path: the whole output is valid JSON already.
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed;
        }
    }
    catch {
        /* fall through to scanning */
    }
    // Slow path: find the first `{` that closes with a matching `}`.
    const start = text.indexOf('{');
    if (start === -1)
        return null;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (inString) {
            if (escaped)
                escaped = false;
            else if (ch === '\\')
                escaped = true;
            else if (ch === '"')
                inString = false;
            continue;
        }
        if (ch === '"')
            inString = true;
        else if (ch === '{')
            depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                try {
                    const parsed = JSON.parse(text.slice(start, i + 1));
                    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
                        return parsed;
                    }
                }
                catch {
                    return null;
                }
            }
        }
    }
    return null;
}
/** Validate and normalize a list of raw entries (drop malformed/oversized ones). */
function sanitizeEntries(values) {
    const out = [];
    const now = Date.now();
    for (const value of values) {
        if (out.length >= 2)
            break;
        if (typeof value !== 'object' || value === null)
            continue;
        const candidate = value;
        if (typeof candidate.text !== 'string')
            continue;
        const text = candidate.text.trim();
        if (text.length === 0 || text.length > MAX_TEXT_LEN)
            continue;
        if (candidate.kind !== 'progress' && candidate.kind !== 'todo')
            continue;
        out.push({ at: now, text, kind: candidate.kind });
    }
    return out;
}
/**
 * Merge a turn's summary into the memory's progressLog and currentFocus.
 * Pushes newest entries to the front and trims to MAX_LOG_ENTRIES. Pure helper —
 * does not persist; the caller owns saveMemory.
 */
export function applySummary(memory, summary) {
    if (summary.currentFocus)
        memory.currentFocus = summary.currentFocus;
    if (summary.entries.length > 0) {
        memory.progressLog = [...summary.entries.reverse(), ...memory.progressLog].slice(0, MAX_LOG_ENTRIES);
    }
}
//# sourceMappingURL=memory-log.js.map