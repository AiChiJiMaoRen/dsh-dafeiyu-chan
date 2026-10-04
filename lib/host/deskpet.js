/**
 * 桌宠（DeskPet）host 半端：给 client 提供记忆快照 + 桌宠开关持久化。
 *
 * 职责（对应规格 §5.0 environment / §5.5 / §5.7）：
 * - 记忆快照：从 `~/.dsh/whale-memory.json` 读出 deskpet 需要的
 *   { progressLog, currentFocus, mood } 子集，供桌宠记忆相关能力读取，
 *   零新增读取（与 0.0.1 共用 loadMemory，不重复实现）。
 * - 开关持久化：桌宠「放到桌面上」开关状态存入
 *   `~/.dsh/dafeiyu-deskpet-settings.json`，跨刷新/跨浏览器保留。
 *
 * 纯 Node fs，无其他 dsh 依赖——与 host/memory.ts 一样可独立编译。
 * @module dsh-dafeiyu/host/deskpet
 */
import { mkdir, readFile, writeFile, appendFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadMemory } from "./memory.js";
/* ───────────────────────── 存储 ───────────────────────── */
/** 桌宠开关配置文件路径（与 whale-memory 分开，互不污染）。 */
export function deskpetSettingsPath() {
    return join(homedir(), '.dsh', 'dafeiyu-deskpet-settings.json');
}
/** 用户桌宠资产落地区：~/.dsh/dsh-dafeiyu/deskpet-assets（管线/脚本可直接写入）。 */
export function deskpetAssetsDir() {
    return join(homedir(), '.dsh', 'dsh-dafeiyu', 'deskpet-assets');
}
/** 首次 / 损坏时的默认：关闭（保持 0.0.1 原行为，不擅自塞桌宠）。 */
export function defaultDeskpetSettings() {
    return { schema: 3, enabled: false, anchor: 'composer', characterVariant: 'legacy', syncWithWhale: true };
}
/** 读取开关（容错：缺失/损坏回落默认，绝不抛）。 */
export async function loadDeskpetSettings(file = deskpetSettingsPath()) {
    try {
        const raw = await readFile(file, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            schema: 3,
            enabled: parsed.enabled === true,
            anchor: parsed.anchor === 'dock' ? 'dock' : 'composer',
            // 只使用旧版人物：忽略磁盘上的 current，一律回落 legacy。
            characterVariant: 'legacy',
            syncWithWhale: parsed.syncWithWhale !== false,
        };
    }
    catch {
        return defaultDeskpetSettings();
    }
}
/** 持久化开关（原子式：写 tmp 再覆盖）。 */
export async function saveDeskpetSettings(settings, file = deskpetSettingsPath()) {
    const payload = {
        schema: 3,
        enabled: settings.enabled === true,
        anchor: settings.anchor === 'dock' ? 'dock' : 'composer',
        characterVariant: 'legacy',
        syncWithWhale: settings.syncWithWhale !== false,
    };
    await mkdir(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
    await writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
    try {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
    catch { /* 尽力清理 */ }
}
/**
 * 读 whale 记忆并挑出 deskpet 需要的子集（永远不抛，失败回落空快照）。
 * 复用 0.0.1 的 loadMemory —— 单一数据源，不重复实现读取。
 */
export async function readDeskpetMemory() {
    try {
        const memory = await loadMemory();
        return {
            progressLog: memory.progressLog.map((entry) => ({ text: entry.text, kind: entry.kind })),
            currentFocus: memory.currentFocus,
            mood: memory.mood,
        };
    }
    catch {
        return { progressLog: [] };
    }
}
/** 组装 service（与 createDafeiyuService 同级，供 apply 注入 routes）。 */
export function createDeskpetService() {
    return {
        async memory() {
            return readDeskpetMemory();
        },
        async getSettings() {
            return loadDeskpetSettings();
        },
        async setSettings(partial) {
            const current = await loadDeskpetSettings();
            const next = {
                schema: 3,
                enabled: typeof partial.enabled === 'boolean' ? partial.enabled : current.enabled,
                anchor: partial.anchor === 'dock' ? 'dock' : partial.anchor === 'composer' ? 'composer' : current.anchor,
                characterVariant: 'legacy',
                syncWithWhale: typeof partial.syncWithWhale === 'boolean' ? partial.syncWithWhale : current.syncWithWhale,
            };
            await saveDeskpetSettings(next);
            return next;
        },
    };
}
/* ───────────────────────── 路由 ───────────────────────── */
/** 回环 + 同源校验（与 routes.ts 的信任栅栏一致）。 */
function isLoopbackRequest(request) {
    const address = request.socket.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1')
        return false;
    const host = request.headers.host;
    if (typeof host !== 'string')
        return false;
    let hostUrl;
    try {
        hostUrl = new URL(`http://${host}`);
    }
    catch {
        return false;
    }
    if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]')
        return false;
    if (request.headers['sec-fetch-site'] === 'cross-site')
        return false;
    return true;
}
/** 一条 JSON 响应。 */
function writeJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'referrer-policy': 'no-referrer',
        'cache-control': 'no-store',
    });
    res.end(payload);
}
/** 读取 JSON 请求体（过大/非法返回 undefined）。 */
async function readJsonBody(request) {
    const chunks = [];
    let size = 0;
    const MAX = 16 * 1024;
    for await (const chunk of request) {
        const buffer = chunk;
        size += buffer.length;
        if (size > MAX)
            return undefined;
        chunks.push(buffer);
    }
    try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
    }
    catch {
        return undefined;
    }
}
const API_PREFIX = '/api/dsh-dafeiyu/deskpet';
/** 桌宠媒体资产 MIME（assets/deskpet/ 下的 webm/mp4/png/webp/json…）。 */
const DESKPET_ASSET_MIME = {
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
};
// Removed actions stay blocked at the HTTP boundary, so an old package copy
// or stale user asset cannot resurrect them through the fallback route.
const REMOVED_DESKPET_ASSETS = new Set(['stretch', 'lanyao', 'feed']);
/**
 * 桌宠媒体资产静态路由：GET/HEAD `{prefix}/assets/<file>`
 * 从包内 `assets/deskpet/` 直出（视频/精灵表/元数据），供 client 播放使用。
 * 设计目标：媒体文件不再 base64 打进 client 包（占位 PNG 曾达 ~1.9MB）。
 * 借鉴 dsh-pet 的 `/pet/whale/*` 资产路由：包根经 `import.meta.url` 推导，文件名做 basename 消毒。
 */
function makeDeskpetAssetRoute(packageRoot) {
    return {
        kind: 'prefix',
        path: `${API_PREFIX}/assets`,
        handler: async (req, res) => {
            if (!isLoopbackRequest(req) || (req.method !== 'GET' && req.method !== 'HEAD')) {
                writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                return;
            }
            let file = '';
            try {
                const url = new URL(req.url ?? '/', 'http://localhost');
                file = basename(decodeURIComponent(url.pathname.split('/').pop() ?? ''));
            }
            catch {
                file = '';
            }
            if (file === '' || file.includes('..') || file.includes('\\') || file.includes('/')) {
                writeJson(res, 400, { ok: false, error: { code: 'internal', message: 'bad file' } });
                return;
            }
            const mime = DESKPET_ASSET_MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
            const assetStem = file.replace(/\.[^.]+$/, '').toLowerCase();
            if (REMOVED_DESKPET_ASSETS.has(assetStem)) {
                writeJson(res, 404, { ok: false, error: { code: 'not-found', message: 'asset removed' } });
                return;
            }
            // 用户落地区是导入管线的真实资产源；包内文件只作为首次安装时的
            // fallback。否则同名旧 sheet 会遮住刚导入的新动作。
            // 只使用旧版人物：资源一律走 legacy 目录（current 素材已删除）。
            const variant = 'legacy';
            const candidates = [
                join(deskpetAssetsDir(), variant, file),
                join(packageRoot, 'assets', 'deskpet', variant, file),
                // Keep the old root layout as a compatibility fallback for callers
                // that have not yet been migrated to an explicit variant.
                join(deskpetAssetsDir(), file),
                join(packageRoot, 'assets', 'deskpet', file),
            ];
            let body;
            for (const candidate of candidates) {
                try {
                    body = await readFile(candidate);
                    break;
                }
                catch { /* 下一候选 */ }
            }
            if (body === undefined) {
                writeJson(res, 404, { ok: false, error: { code: 'not-found', message: 'asset not found' } });
                return;
            }
            res.writeHead(200, {
                'content-type': mime,
                'content-length': String(body.byteLength),
                // Sheets are user-replaced assets. Never keep a failed/old decode in
                // the browser for an hour; life.json already carries a revision.
                'cache-control': 'no-store, no-cache, must-revalidate',
                'referrer-policy': 'no-referrer',
            });
            if (req.method === 'HEAD') {
                res.end();
                return;
            }
            res.end(body);
        },
    };
}
/**
 * 桌宠路由族：
 * - GET/PUT {prefix}/settings       → 桌宠开关持久化（{ settings }）
 * - GET/HEAD {prefix}/assets/<file> → 桌宠媒体资产静态服务（视频/精灵表/元数据）
 * 记忆快照复用 /api/dsh-dafeiyu/memory（已裹 `{ memory }` 形状），不在本族重复。
 */
export function makeDeskpetRoutes(deps) {
    const { service } = deps;
    const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
    return [
        {
            kind: 'exact',
            path: `${API_PREFIX}/settings`,
            handler: async (req, res) => {
                if (!isLoopbackRequest(req)) {
                    writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                    return;
                }
                if (req.method === 'GET') {
                    try {
                        writeJson(res, 200, { ok: true, value: { settings: await service.getSettings() } });
                    }
                    catch (error) {
                        writeJson(res, 500, { ok: false, error: { code: 'internal', message: error instanceof Error ? error.message : String(error) } });
                    }
                    return;
                }
                if (req.method === 'PUT') {
                    const body = await readJsonBody(req);
                    const next = await service.setSettings({
                        enabled: typeof body?.enabled === 'boolean' ? body.enabled : undefined,
                        anchor: body?.anchor === 'dock' || body?.anchor === 'composer' ? body.anchor : undefined,
                        characterVariant: body?.characterVariant === 'legacy' || body?.characterVariant === 'current' ? body.characterVariant : undefined,
                        syncWithWhale: typeof body?.syncWithWhale === 'boolean' ? body.syncWithWhale : undefined,
                    });
                    writeJson(res, 200, { ok: true, value: { settings: next } });
                    return;
                }
                writeJson(res, 405, { ok: false, error: { code: 'internal', message: 'method not allowed' } });
            },
        },
        {
            // 调试日志：POST { message } → 追加一行到 ~/.dsh/dsh-dafeiyu/deskpet-debug.log
            // （排查前端片段播放是否真的选到/播放，读日志即知，不用猜。）
            kind: 'exact',
            path: `${API_PREFIX}/debug-log`,
            handler: async (req, res) => {
                if (!isLoopbackRequest(req) || req.method !== 'POST') {
                    writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                    return;
                }
                try {
                    const body = await readJsonBody(req);
                    const message = typeof body?.message === 'string' ? body.message : JSON.stringify(body ?? {});
                    const line = `${new Date().toISOString()} ${message}\n`;
                    await mkdir(dirname(deskpetAssetsDir()), { recursive: true });
                    await appendFile(join(deskpetAssetsDir(), 'deskpet-debug.log'), line, 'utf8');
                    writeJson(res, 200, { ok: true });
                }
                catch (error) {
                    writeJson(res, 500, { ok: false, error: { code: 'internal', message: error instanceof Error ? error.message : String(error) } });
                }
            },
        },
        makeDeskpetAssetRoute(packageRoot),
    ];
}
//# sourceMappingURL=deskpet.js.map