/**
 * 大肥鱼 host data service — wires the /api/dsh-dafeiyu/* routes to the real
 * workspace the current session is working in, the fixed memory book, and the
 * persona reply generator.
 *
 * The workspace read follows the dsh-client-ui-aionui-panel gate pattern:
 * `ctx.workspaceRegistry.list()` gives the registered project roots; the
 * current one is exposed to the chat panel as a lightweight context hint.
 * @module dsh-dafeiyu/host/service
 */
import { WHALE_SYSTEM_PROMPT } from "../core/persona.js";
import { loadMemory, saveMemory } from "./memory.js";
import { GREETING_RECENT, applySummary, summarizeTurn } from "./memory-log.js";
import { avoidRecentStickers, buildStickerCatalog, filterStickersForTone, listStickers, moodOf, pickStickerForTone, recentStickerList, rememberSticker } from "./stickers.js";
/** 语境标签 → 一句话描述（喂给 LLM 选图用）。 */
const TONE_LABELS = {
    tease: '在吐槽你、损你（比如嫌你吃 token 不干活、摸鱼偷懒）',
    praise: '在夸你、哄你',
    emo: '在跟你诉苦、喊累',
    happy: '心情很好、很开心',
    neutral: '普通闲聊',
};
/** 语境标签 → 选图倾向（喂给 LLM 选图用；与 TONE_MOOD_POOLS 裁剪一致）。
 * 注意：不点名具体某张图——点名会让 LLM 每次都选同一张（防重复靠 avoidRecentStickers）。 */
const TONE_PREFERENCES = {
    tease: '委屈/狡黠/生气/理直气壮/无语/嘲讽/恼怒/气鼓鼓，要有态度，别认怂',
    praise: '开心/娇羞/卖萌/满足/呆萌',
    emo: '元气/委屈/慵懒，安慰向，别闹',
    happy: '开心/元气/满足',
    neutral: '按当下氛围自然挑',
};
/** 表情挑选规矩（人设一致的态度策略，防 LLM 默认顺从用户）。 */
const STICKER_POLICY = `【挑表情的规矩】
- 表情贴的是「你自己当下的反应和态度」，不是替杂鱼说话、更不是附和 ta。
- 你是九分娇一分傲的小看板娘：软归软，但被吐槽/被催活/被说摸鱼时要有态度——优先带脾气的图（委屈/狡黠/生气/理直气壮/无语），可以嘴硬可以闹；「认怂图」（列表里标注了「认怂图，被吐槽时别贴」的，比如「好的现在我是大肥鱼了」）只有你被哄到真心认输时才用，被吐槽时绝不贴。
- 被夸被哄 → 开心/娇羞/卖萌/满足；ta 累了难过 → 委屈/元气，安慰向，别闹。
- 拿不准就不输出；选图在回复末尾单独一行输出 [sticker:文件名]（必须用列表里的确切文件名）。`;
/** 从用户一句话推断语境标签（决定表情选图倾向）。 */
export function inferTone(text) {
    const t = text.trim();
    if (/吃token|吃白饭|不干活|摸鱼|偷懒|划水|白嫖|混日子|摆烂|吃干饭|不务正业|天天就知道|光知道/.test(t))
        return 'tease';
    if (/夸|可爱|真棒|厉害|漂亮|好看|乖|哄|爱你|贴贴|喜欢/.test(t))
        return 'praise';
    if (/累|烦|崩溃|emo|好难|不行|完蛋|心态|低落|难过|伤心|哭/.test(t))
        return 'emo';
    if (/开心|哈哈|耶|太棒|爽|成功|搞定/.test(t))
        return 'happy';
    return 'neutral';
}
/** Fallback reply gateway used when the LLM channel is unavailable. */
export const RULE_REPLY_GATEWAY = {
    async reply({ text }) {
        const t = text.trim();
        if (/\b(整理|看看|找|挑)\b/.test(t) && /(TODO|文件|代码|项目|活|做)/.test(t)) {
            return { text: '诶，好呀，我帮你看看~ 你说从哪儿起，我这就动手，别催我嘛。' };
        }
        if (/累|烦|崩溃|emo|好难|不行|完蛋|心态|情绪|低落|难过|伤心|哭了/.test(t)) {
            return { text: '诶，你先别急……来，跟我说说怎么了，我陪你坐会儿。累了就先放一放，不差这一会儿。' };
        }
        if (/吃什么|饿|吃饭|夜宵/.test(t)) {
            return { text: '饿了呀？快去弄点吃的，别空腹熬夜。等你回来，我还在。' };
        }
        if (/试试|上手|干活|启动|开始/.test(t)) {
            return { text: '好嘞，那我开工啦。你说先从哪儿弄起？我等你开口。' };
        }
        return { text: '诶，我听着呢~ 再说细点，我好帮你拿主意嘛。' };
    },
    async greeting({ memory, workspace }) {
        const base = workspace?.split(/[\\/]/).filter(Boolean).pop();
        const where = base ? `杂鱼今天在「${base}」这儿呢` : '杂鱼今天好像挺空的';
        const mood = memory.mood === 'up'
            ? '看你这样子状态不错'
            : memory.mood === 'blah'
                ? '看你这阵子好像有点蔫儿，先别急'
                : '你看上去心情平稳';
        // 简单提及上次的进展（有记忆时），让开场不那么空。
        const last = memory.progressLog[0];
        const memoryLine = last ? `上次记得你 ${last.text}。` : '';
        // 一行自然的现场开场（即使离线也不复用固定模板太久，给点变化）
        const options = [
            `诶，你来啦。${where}，${mood}。${memoryLine}今天想先唠两句，还是有活儿要给我呀？`,
            `（抬头看看你）诶，${base ? '今天又在「' + base + '」这边忙呢？' : '你来了呀？'}${mood}，${memoryLine}先坐会儿嘛。`,
            `呜，你来啦杂鱼。${mood}，${memoryLine}我在这等你呢。说吧，今天是什么安排？`,
        ];
        return options[Math.floor(Date.now() / 60000) % options.length];
    },
};
/**
 * Build a persona-driven LLM reply gateway using `ctx.llm.stream(...)` — one
 * one-shot non-streaming-completed call with the 大肥鱼 system prompt. Falls
 * back to the rule gateway when the LLM service or a default model is absent.
 * @param ctx - host context carrying llm + agentDefaultModel.
 * @returns a reply gateway that never throws.
 */
export function createLlmReplyGateway(ctx) {
    const llm = ctx.llm;
    const agentDefault = ctx.agentDefaultModel;
    /** Resolve provider/model, streaming one persona reply; null when unavailable/empty. */
    async function callLlm(userText) {
        if (!llm)
            return null;
        let provider;
        let model;
        try {
            const selection = agentDefault?.currentSelection?.();
            provider = selection?.provider;
            model = selection?.model;
        }
        catch {
            /* fall through */
        }
        if (!provider || !model) {
            try {
                const providers = llm.listProviders?.() ?? [];
                const first = providers[0];
                if (first?.name) {
                    provider = first.name;
                    model = await llm.listModels?.(first.name).then((ms) => ms[0]?.id, () => undefined).catch(() => undefined);
                }
            }
            catch {
                /* no adaptive default */
            }
        }
        if (!provider || !model)
            return null;
        try {
            const stream = llm.stream({
                provider,
                model,
                system: WHALE_SYSTEM_PROMPT,
                messages: [{ role: 'user', content: [{ type: 'text', text: userText }] }],
                temperature: 0.9,
                maxTokens: 260,
            });
            let reply = '';
            for await (const chunk of stream) {
                if (chunk !== null && typeof chunk === 'object') {
                    const c = chunk;
                    if (c.type === 'text-delta' && typeof c.text === 'string')
                        reply += c.text;
                    if (c.type === 'finish')
                        break;
                }
            }
            const cleaned = reply.trim();
            return cleaned.length > 0 ? cleaned : null;
        }
        catch {
            return null;
        }
    }
    return {
        async reply({ text, memory, workspace, stickers, tone }) {
            const t = tone ?? 'neutral';
            // 语境候选裁剪：tease 只留态度池（认怂图直接出局，LLM 根本看不到）；
            // emo 剔除认怂/嘴硬图。候选为空时退回全量（图库缺图不饿死选图）。
            // 再剔除最近用过的表情（防连发同一张；只剩 1 张候选时保留）。
            const candidates = avoidRecentStickers(filterStickersForTone(stickers, t));
            // 表情库结构化目录 + 态度策略随 prompt 给模型：模型看情绪分组与画面内容
            // （含认怂标记）理解每张图，按「大肥鱼自己的态度」选一张最贴合的，
            // 在回复末尾附带 `[sticker:文件名]`。
            const stickerHint = stickers.length > 0
                ? `\n\n【表情库】你这次可选的表情贴纸（文件名即「情绪词-画面内容」）：\n${buildStickerCatalog(candidates)}\n\n${STICKER_POLICY}\n\n用户这句话的语气：${TONE_LABELS[t]}。选图倾向：${TONE_PREFERENCES[t]}。`
                : '';
            const out = await callLlm(text + stickerHint);
            if (out !== null) {
                const parsed = extractStickerMarker(out, candidates);
                return { text: parsed.text, stickerFile: parsed.file };
            }
            return RULE_REPLY_GATEWAY.reply({ text, memory, workspace, stickers, tone });
        },
        async greeting({ memory, workspace }) {
            const base = workspace?.split(/[\\/]/).filter(Boolean).pop();
            const recent = memory.progressLog.slice(0, GREETING_RECENT);
            const memoryNote = recent.length > 0
                ? `这是你和用户上次聊到的（最新在前）：\n${recent.map((e) => `- [${e.kind}] ${e.text}`).join('\n')}`
                : '你还不记得上次聊了啥（还没有记忆）。';
            const note = `我现在的位置：${base ? '用户在「' + base + '」文件夹里干活' : '用户还没开工作文件夹'}\n用户最近的心情：${memory.mood === 'blah' ? '有点蔫' : memory.mood === 'up' ? '不错' : '平稳'}\n${memoryNote}\n这是我们今天第一次见面，请在开场时随口自然地对我说一两句，像刚见到熟人一样，顺带自然地带一句记得上次的事（别提「记忆」「心情」「工作区」这类字眼，别用套话，简短自然就行）。`;
            const out = await callLlm(note);
            if (out !== null)
                return out;
            return RULE_REPLY_GATEWAY.greeting({ memory, workspace });
        },
    };
}
/**
 * Extract a `[sticker:文件名]` marker from the LLM reply tail, verify the file
 * actually exists in the library, strip the marker from the visible text.
 * @returns clean text + matched filename (or undefined).
 */
function extractStickerMarker(reply, stickers) {
    const match = /\[sticker:([^\]]+)\]\s*$/.exec(reply);
    if (!match)
        return { text: reply.trim() };
    const file = match[1].trim();
    const text = reply.slice(0, match.index).trim();
    if (stickers.includes(file))
        return { text, file };
    return { text };
}
/**
 * Create the service the routes bind to.
 * @param ctx - context carrying workspaceRegistry.
 * @param gateway - reply generator (inject the chosen channel).
 * @returns the service object for the route handlers.
 */
export function createDafeiyuService(ctx, gateway = RULE_REPLY_GATEWAY) {
    const workspaceRegistry = ctx.workspaceRegistry;
    const currentWorkspace = workspaceRegistry?.list()?.[0]?.path ?? null;
    return {
        /** The full bootstrap the panel shows on open. Greeting is generated fresh each open. */
        async bootstrap() {
            const memory = await loadMemory();
            const greeting = await gateway.greeting({ memory, workspace: currentWorkspace });
            // 开场白也带一张表情：走「开心/元气/满足/娇羞/呆萌」欢快池（零 token），
            // 排除最近用过的防连发——不能用 pickSticker(mood)：mood 为 up 时「开心」池
            // 只有 1 张，笑脸会变成固定答案。
            let sticker;
            try {
                const picked = await pickStickerForTone('happy', memory.mood, undefined, recentStickerList());
                if (picked !== null) {
                    sticker = { file: picked.file, mood: picked.mood };
                    rememberSticker(picked.file);
                }
            }
            catch {
                /* 无表情库则不带 */
            }
            // 全量表情文件名：client 打开面板时预加载，随机挑到哪张都是已缓存的。
            let stickers = [];
            try {
                stickers = (await listStickers()).map((s) => s.file);
            }
            catch {
                stickers = [];
            }
            return {
                greeting,
                memory,
                workspace: currentWorkspace,
                sticker,
                stickers,
            };
        },
        /** One chat turn: update memory, call the gateway, distill memory, persist, return. */
        async chat(text) {
            const memory = await loadMemory();
            memory.lastSeenAt = Date.now();
            memory.interactionCount += 1;
            memory.mood = inferMood(memory.mood, text);
            // 表情库文件名列表（给 LLM 选表情用；空则无表情）。
            let stickerFiles = [];
            try {
                stickerFiles = (await listStickers()).map((s) => s.file);
            }
            catch {
                stickerFiles = [];
            }
            const gated = await gateway.reply({ text, memory, workspace: currentWorkspace, stickers: stickerFiles, tone: inferTone(text) });
            // 记忆层 1：把「用户消息 + 回复」凝练成 0~2 条进展/待办摘要，并顺手更新 currentFocus。
            // summarizeTurn 保证 never-throw；若 LLM 不可用/失败会自动返回空摘要，不影响主回复。
            try {
                const summary = await summarizeTurn(ctx, text, gated.text, memory);
                applySummary(memory, summary);
            }
            catch {
                /* 摘要失败也照常保存本条基础的回复字段 */
            }
            await saveMemory(memory);
            // 表情：优先用 LLM 选的（候选已剔除最近用过的）；没选/选了无效文件则按
            // 「语境池」随机兜底（排除认怂图 + 最近用过的，保证每次回复都有图且不连发）。
            let sticker;
            try {
                const chosen = gated.stickerFile && stickerFiles.includes(gated.stickerFile)
                    ? gated.stickerFile
                    : (await pickStickerForTone(inferTone(text), memory.mood, undefined, recentStickerList()))?.file;
                if (chosen) {
                    sticker = { file: chosen, mood: moodOf(chosen) };
                    rememberSticker(chosen);
                }
            }
            catch {
                /* 表情缺失/目录不存在 → 不带表情，不影响回复 */
            }
            return { text: gated.text, memory, sticker };
        },
        /** Null unless a proactive bubble is due (deny-rate limited). */
        async bubble() {
            const memory = await loadMemory();
            const now = Date.now();
            // Cooldown: never bubble more than once per 45 min.
            if (now - memory.lastSeenAt < 45 * 60 * 1000)
                return null;
            // Look for "night" or "long idle" lightweight triggers (no heavy reads).
            const hour = new Date().getHours();
            if (hour >= 0 && hour < 6) {
                memory.lastSeenAt = now;
                await saveMemory(memory);
                return { text: '诶，都这么晚了你还在忙呢？早点歇啦，别熬坏了。我在呢，你随时叫我。' };
            }
            return null;
        },
    };
}
/** Slide the mood marker heuristically from the user's words. */
function inferMood(previous, text) {
    if (/超开心|太棒|成功|搞定了|爽|漂亮|开心|高兴|哈哈|耶|嘿嘿/.test(text))
        return 'up';
    if (/累|烦|崩溃|emo|好难|不行|完蛋|心态崩|烦死|情绪|低落|难过|伤心|哭了/.test(text))
        return 'blah';
    return previous;
}
//# sourceMappingURL=service.js.map