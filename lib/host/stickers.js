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
import { mkdir, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
/** Primary sticker library root (user's own picked images). */
export function stickersDir() {
    return join(homedir(), 'Pictures', '大肥鱼');
}
/** Fallback library root (kept for backward compat with older installs). */
export function legacyStickersDir() {
    return join(homedir(), '.dsh', 'dafeiyu-stickers');
}
/** Image extensions we index. */
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
/** Size cap per sticker (bytes): larger images are skipped at intake. */
const MAX_STICKER_BYTES = 1.5 * 1024 * 1024;
/**
 * Synonym map: a dsh-ish mood hint → the closest user mood word(s). The map
 * drives `normalizeMood` fallback when the requested mood has no exact pool.
 */
const MOOD_SYNONYMS = [
    ['委屈', /委屈|难过|伤心|哭|sad|呜呜|blah|沮丧|颓丧|躺平/],
    ['开心', /开心|高兴|哈哈|happy|笑|耶|up|元气|满足|兴奋|哈哈哈哈哈/],
    ['生气', /生气|愤怒|怒|angry|气死|恼怒|气鼓鼓/],
    ['无语', /无语|流汗|汗|无奈|无话可说|困惑|懵逼/],
    ['嘲讽', /嘲讽|嘲笑|讥讽|坏笑|狡黠|阴阳/],
    ['震惊', /震惊|惊讶|惊恐|吓|吃惊/],
    ['卖萌', /卖萌|撒娇|娇羞|可爱|萌/],
    ['理直气壮', /理直气壮|吃白饭|理直/],
    ['驱赶', /驱赶|走开|去别处|赶走/],
    ['迷糊', /迷糊|呆萌|发呆|我是谁/],
    ['慵懒', /慵懒|懒|躺|摸鱼/],
    ['元气', /元气|加油|冲|努力|Ciallo/],
];
/** 认怂/顺从类画面内容词：被吐槽语境下不贴这类图（LLM 提示标注 + 兜底排除）。 */
const SUBMISSIVE_CONTENT_RE = /好的现在我是大肥鱼|行行|听你的|认了|认输|顺从|求饶|我错了|乖乖听话/;
/**
 * 画面内容文字：文件名第一个「-」之后的文字（情绪词后面的部分），
 * 如 `委屈-压力一只蓝色大肥鱼.jpg` → `压力一只蓝色大肥鱼`；无「-` 则空。
 */
export function contentOf(filename) {
    const base = filename.slice(0, filename.lastIndexOf('.')) || filename;
    const idx = base.indexOf('-');
    return idx === -1 ? '' : base.slice(idx + 1).trim();
}
/** 是否为认怂/顺从图（被吐槽语境下禁用）。 */
export function isSubmissive(filename) {
    return SUBMISSIVE_CONTENT_RE.test(contentOf(filename));
}
/** 每个语境的候选情绪池（按优先级排列；neutral 走 memory.mood 兜底）。 */
export const TONE_MOOD_POOLS = {
    tease: ['委屈', '狡黠', '生气', '理直气壮', '无语', '嘲讽', '恼怒', '气鼓鼓'],
    praise: ['开心', '娇羞', '卖萌', '满足', '呆萌'],
    emo: ['元气', '委屈', '慵懒'],
    // happy 池兼顾开场白/护航提示/开心聊天——池子不能太小，否则笑脸/Ciallo 变固定答案
    happy: ['开心', '元气', '满足', '娇羞', '呆萌'],
    neutral: [],
};
/** 语境额外排除的画面内容（tease 的认怂排除见 SUBMISSIVE_CONTENT_RE）。 */
const TONE_CONTENT_EXCLUDES = {
    emo: /你这吃白饭|我不是大肥鱼/,
};
/**
 * 语境候选裁剪：tease 只留「态度池」情绪且剔除认怂图；emo 剔除认怂/嘴硬图；
 * 其余语境原样返回。裁剪后为空则退回原列表（图库缺图时别饿死选图）。
 */
export function filterStickersForTone(files, tone) {
    if (tone === 'tease') {
        const moods = new Set(TONE_MOOD_POOLS.tease);
        const kept = files.filter((f) => moods.has(moodOf(f)) && !isSubmissive(f));
        return kept.length > 0 ? kept : files;
    }
    if (tone === 'emo') {
        const extra = TONE_CONTENT_EXCLUDES.emo;
        const kept = files.filter((f) => !isSubmissive(f) && !(extra?.test(contentOf(f)) ?? false));
        return kept.length > 0 ? kept : files;
    }
    return files;
}
/** 最近用过的表情文件名（防连发同一张；进程内状态，够用即可）。 */
const RECENT_STICKER_MAX = 6;
let recentStickers = [];
/** 记录一张刚用过的表情（去重置顶，保留最近 RECENT_STICKER_MAX 张）。 */
export function rememberSticker(file) {
    if (!file)
        return;
    recentStickers = [file, ...recentStickers.filter((f) => f !== file)].slice(0, RECENT_STICKER_MAX);
}
/** 当前最近用过的表情列表（供各选图入口排除用）。 */
export function recentStickerList() {
    return [...recentStickers];
}
/** 从候选里剔除最近用过的（候选只剩 1 张时原样返回，避免饿死选图）。 */
export function avoidRecentStickers(files) {
    if (files.length <= 1)
        return files;
    const kept = files.filter((f) => !recentStickers.includes(f));
    return kept.length > 0 ? kept : files;
}
/** Fisher–Yates 洗牌（原地），用于打破 LLM 按目录序的位置偏好。 */
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}
/**
 * 结构化表情目录文本（给 LLM 选图用）：按情绪分组，逐张标注画面内容，
 * 认怂图显式打标「认怂图，被吐槽时别贴」。
 * 每次调用打散分组与组内顺序——LLM 常按列表位置选图，固定顺序会偏爱第一张。
 * @param files - 表情文件名列表（与 chat 传给 LLM 的 stickers 同源）。
 */
export function buildStickerCatalog(files) {
    const byMood = new Map();
    for (const file of shuffle([...files])) {
        const mood = moodOf(file);
        const list = byMood.get(mood) ?? [];
        list.push(file);
        byMood.set(mood, list);
    }
    const lines = [];
    for (const [mood, list] of byMood) {
        const desc = shuffle([...list])
            .map((file) => {
            const content = contentOf(file);
            const parts = [];
            if (content)
                parts.push(`画面：${content}`);
            if (isSubmissive(file))
                parts.push('认怂图，被吐槽时别贴');
            return `${file}${parts.length > 0 ? `（${parts.join('｜')}）` : ''}`;
        })
            .join('、');
        lines.push(`${mood}：${desc}`);
    }
    return lines.join('\n');
}
/**
 * 按语境挑一张表情：语境情绪池优先（池内排除认怂图/语境额外排除/最近用过的），
 * 兜底走原 pickSticker(mood)。池内随机，保持多样性。Pure local — zero tokens. Never throws.
 */
export async function pickStickerForTone(tone, mood, dir = stickersDir(), exclude = []) {
    const moods = TONE_MOOD_POOLS[tone] ?? [];
    if (moods.length > 0) {
        const stickers = await listStickers(dir);
        let candidates = moods.flatMap((m) => stickers.filter((s) => s.mood === m));
        candidates = candidates.filter((s) => !isSubmissive(s.file));
        const extra = TONE_CONTENT_EXCLUDES[tone];
        if (extra)
            candidates = candidates.filter((s) => !extra.test(contentOf(s.file)));
        if (exclude.length > 0) {
            const kept = candidates.filter((s) => !exclude.includes(s.file));
            if (kept.length > 0)
                candidates = kept;
        }
        if (candidates.length > 0)
            return candidates[Math.floor(Math.random() * candidates.length)];
    }
    return pickSticker(mood, dir, exclude);
}
/** Cache of the scanned library (refreshed on demand). */
let cache = null;
/** Ensure the sticker dir exists (create when missing). */
export async function ensureStickersDir() {
    const dir = stickersDir();
    await mkdir(dir, { recursive: true }).catch(() => undefined);
    return dir;
}
/**
 * Parse the mood from a filename: the leading word before the first `-`
 * (or the whole name when no `-`), e.g. `委屈-xxx.jpg` → 委屈, `开心.jpg` → 开心.
 * Unknown/empty → '通用'.
 */
export function moodOf(filename) {
    const base = filename.slice(0, filename.lastIndexOf('.')) || filename;
    const first = base.split('-')[0]?.trim();
    return first && first.length > 0 && first.length <= 8 ? first : '通用';
}
/**
 * Scan the sticker directory and rebuild the index. Only files with image
 * extensions are indexed; name → mood via `moodOf`. Never throws.
 */
export async function scanStickers(dir = stickersDir()) {
    try {
        const entries = await readdir(dir, { withFileTypes: true });
        const stickers = [];
        for (const entry of entries) {
            if (!entry.isFile())
                continue;
            const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
            if (!IMAGE_EXTS.includes(ext))
                continue;
            if (entry.name.startsWith('.'))
                continue;
            const full = join(dir, entry.name);
            try {
                const info = await stat(full);
                if (info.size > MAX_STICKER_BYTES)
                    continue;
            }
            catch {
                continue;
            }
            stickers.push({ id: entry.name, file: entry.name, mood: moodOf(entry.name) });
        }
        cache = stickers;
        return stickers;
    }
    catch {
        // 主目录不可读 → 尝试旧目录（向后兼容）。
        if (dir === stickersDir()) {
            try {
                const legacy = await scanStickers(legacyStickersDir());
                cache = legacy;
                return legacy;
            }
            catch {
                cache = [];
                return [];
            }
        }
        cache = [];
        return [];
    }
}
/** Read the current sticker list (refreshing the scan when stale/unset). */
export async function listStickers(dir = stickersDir()) {
    if (cache === null)
        return scanStickers(dir);
    return cache;
}
/**
 * Pick one sticker for a mood. Prefers the exact mood pool; falls back to a
 * synonym pool (via MOOD_SYNONYMS); then 通用; then any sticker. Random within
 * the chosen pool. Pure local — zero tokens. Never throws.
 * @param dir - sticker directory (override for tests).
 * @param exclude - filenames to skip (recently used, anti-repeat).
 */
export async function pickSticker(mood, dir = stickersDir(), exclude = []) {
    const stickers = await listStickers(dir);
    if (stickers.length === 0)
        return null;
    const wanted = normalizeMood(mood);
    let pool = stickers.filter((s) => s.mood === wanted);
    if (pool.length === 0) {
        // 近义兜底：请求的情绪词在库里没有精确池时，用同义词映射找最接近的池。
        for (const [moodWord, re] of MOOD_SYNONYMS) {
            if (re.test(wanted)) {
                pool = stickers.filter((s) => s.mood === moodWord);
                if (pool.length > 0)
                    break;
            }
        }
    }
    if (pool.length === 0)
        pool = stickers.filter((s) => s.mood === '通用');
    let final = pool.length > 0 ? pool : stickers;
    // 排除最近用过的（防连发同一张；候选只剩 1 张时保留，避免饿死）
    if (exclude.length > 0) {
        const kept = final.filter((s) => !exclude.includes(s.file));
        if (kept.length > 0)
            final = kept;
    }
    // 随机挑（多样性优先）；加载慢由客户端「全量预加载」解决。
    return final[Math.floor(Math.random() * final.length)];
}
/**
 * Map an arbitrary mood-ish string to the closest sticker mood word:
 * first try the exact word, then the synonym map, then '通用'.
 */
export function normalizeMood(mood) {
    if (!mood)
        return '通用';
    const t = String(mood).trim();
    if (t === '通用' || t === '')
        return '通用';
    // exact mood words (like 开心/委屈) stay as-is
    if (/^[\u4e00-\u9fa5]{1,8}$/.test(t))
        return t;
    // dsh buckets / english hints → synonym map
    for (const [moodWord, re] of MOOD_SYNONYMS) {
        if (re.test(t))
            return moodWord;
    }
    return t.length <= 8 ? t : '通用';
}
//# sourceMappingURL=stickers.js.map