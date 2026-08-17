/**
 * 大肥鱼表情系统 — local sticker library.
 *
 * Reads a local directory of user-picked images as the sticker source. The
 * user manually renames each image as `表情-内容文字` (e.g. `委屈-你这吃白饭
 * 的蓝色大肥鱼.jpg`) or just `表情.jpg`. Every image is indexed once; the
 * filename's leading mood word becomes the sticker's mood label.
 *
 * pickSticker() picks one sticker by mood — pure local matching, ZERO tokens.
 *
 * Directory conventions (user-owned, documented in README):
 *   ~/Pictures/大肥鱼/
 *     ├── 委屈-你这吃白饭的蓝色大肥鱼.jpg   ← mood-内容文字
 *     ├── 开心.jpg                           ← mood only
 *     └── ...（mood = 文件名第一个「-」前的词，或整个文件名）
 *
 * Mood vocabulary is open (any Chinese word works); a synonym map folds
 * dsh's three mood buckets (blah/up/neutral) onto the closest sticker mood.
 * @module dsh-dafeiyu/host/stickers
 */
/** Primary sticker library root (user's own picked images). */
export declare function stickersDir(): string;
/** Fallback library root (kept for backward compat with older installs). */
export declare function legacyStickersDir(): string;
/** One indexed sticker. */
export interface Sticker {
    /** Stable id = filename. */
    id: string;
    /** Filename (served under /api/dsh-dafeiyu/stickers/<file>). */
    file: string;
    /** Mood label (the filename's leading mood word). */
    mood: string;
}
/**
 * 画面内容文字：文件名第一个「-」之后的文字（情绪词后面的部分），
 * 如 `委屈-压力一只蓝色大肥鱼.jpg` → `压力一只蓝色大肥鱼`；无「-` 则空。
 */
export declare function contentOf(filename: string): string;
/** 是否为认怂/顺从图（被吐槽语境下禁用）。 */
export declare function isSubmissive(filename: string): boolean;
/** 用户一句话的语境标签（决定表情选图倾向）。 */
export type Tone = 'tease' | 'praise' | 'emo' | 'happy' | 'neutral';
/** 每个语境的候选情绪池（按优先级排列；neutral 走 memory.mood 兜底）。 */
export declare const TONE_MOOD_POOLS: Record<Tone, string[]>;
/**
 * 语境候选裁剪：tease 只留「态度池」情绪且剔除认怂图；emo 剔除认怂/嘴硬图；
 * 其余语境原样返回。裁剪后为空则退回原列表（图库缺图时别饿死选图）。
 */
export declare function filterStickersForTone(files: string[], tone: Tone): string[];
/** 记录一张刚用过的表情（去重置顶，保留最近 RECENT_STICKER_MAX 张）。 */
export declare function rememberSticker(file: string | undefined | null): void;
/** 当前最近用过的表情列表（供各选图入口排除用）。 */
export declare function recentStickerList(): string[];
/** 从候选里剔除最近用过的（候选只剩 1 张时原样返回，避免饿死选图）。 */
export declare function avoidRecentStickers(files: string[]): string[];
/**
 * 结构化表情目录文本（给 LLM 选图用）：按情绪分组，逐张标注画面内容，
 * 认怂图显式打标「认怂图，被吐槽时别贴」。
 * 每次调用打散分组与组内顺序——LLM 常按列表位置选图，固定顺序会偏爱第一张。
 * @param files - 表情文件名列表（与 chat 传给 LLM 的 stickers 同源）。
 */
export declare function buildStickerCatalog(files: string[]): string;
/**
 * 按语境挑一张表情：语境情绪池优先（池内排除认怂图/语境额外排除/最近用过的），
 * 兜底走原 pickSticker(mood)。池内随机，保持多样性。Pure local — zero tokens. Never throws.
 */
export declare function pickStickerForTone(tone: Tone, mood?: string, dir?: string, exclude?: string[]): Promise<Sticker | null>;
/** Ensure the sticker dir exists (create when missing). */
export declare function ensureStickersDir(): Promise<string>;
/**
 * Parse the mood from a filename: the leading word before the first `-`
 * (or the whole name when no `-`), e.g. `委屈-xxx.jpg` → 委屈, `开心.jpg` → 开心.
 * Unknown/empty → '通用'.
 */
export declare function moodOf(filename: string): string;
/**
 * Scan the sticker directory and rebuild the index. Only files with image
 * extensions are indexed; name → mood via `moodOf`. Never throws.
 */
export declare function scanStickers(dir?: string): Promise<Sticker[]>;
/** Read the current sticker list (refreshing the scan when stale/unset). */
export declare function listStickers(dir?: string): Promise<Sticker[]>;
/**
 * Pick one sticker for a mood. Prefers the exact mood pool; falls back to a
 * synonym pool (via MOOD_SYNONYMS); then 通用; then any sticker. Random within
 * the chosen pool. Pure local — zero tokens. Never throws.
 * @param dir - sticker directory (override for tests).
 * @param exclude - filenames to skip (recently used, anti-repeat).
 */
export declare function pickSticker(mood?: string, dir?: string, exclude?: string[]): Promise<Sticker | null>;
/**
 * Map an arbitrary mood-ish string to the closest sticker mood word:
 * first try the exact word, then the synonym map, then '通用'.
 */
export declare function normalizeMood(mood?: string): string;
