/**
 * The /api/dsh-dafeiyu route family: bootstrap, chat, bubble.
 *
 * Loopback-only trust fence (mirrors dsh-ssh): these routes can trigger reply
 * generation, so LAN-exposed dsh deployments must not serve them.
 * @module dsh-dafeiyu/host/routes
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { makeIdeasRoutes } from "./ideas.js";
import { makeSessionTipRoutes } from "./session-tip.js";
import { stickersDir } from "./stickers.js";
/** Path prefix for every dafeiyu route. */
export const API_PREFIX = '/api/dsh-dafeiyu';
/** Cap on JSON request bodies (chat turns are small). */
const MAX_JSON_BODY_BYTES = 32 * 1024;
/** Loopback check with browser same-origin markers. */
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
/** One JSON response. */
function writeJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'referrer-policy': 'no-referrer' });
    res.end(payload);
}
/** Read a JSON request body (undefined when too large or unparseable). */
async function readJsonBody(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const buffer = chunk;
        size += buffer.length;
        if (size > MAX_JSON_BODY_BYTES)
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
/**
 * Build every /api/dsh-dafeiyu route.
 * @param deps - the services created in apply.
 * @returns the exact routes.
 */
export function makeRoutes(deps) {
    const { service, ideasService, sessionTipService } = deps;
    if (!ideasService)
        throw new Error('ideasService is required for routes');
    if (!sessionTipService)
        throw new Error('sessionTipService is required for routes');
    return [
        ...makeIdeasRoutes({ service: ideasService }),
        ...makeSessionTipRoutes({ service: sessionTipService }),
        {
            kind: 'exact',
            path: `${API_PREFIX}/bootstrap`,
            handler: async (req, res) => {
                if (!isLoopbackRequest(req) || req.method !== 'POST') {
                    writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                    return;
                }
                try {
                    const value = await service.bootstrap();
                    writeJson(res, 200, { ok: true, value });
                }
                catch (error) {
                    writeJson(res, 500, { ok: false, error: { code: 'internal', message: error instanceof Error ? error.message : String(error) } });
                }
            },
        },
        {
            kind: 'exact',
            path: `${API_PREFIX}/chat`,
            handler: async (req, res) => {
                if (!isLoopbackRequest(req) || req.method !== 'POST') {
                    writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                    return;
                }
                const body = await readJsonBody(req);
                const text = typeof body?.text === 'string' ? body.text : '';
                if (text === '') {
                    writeJson(res, 400, { ok: false, error: { code: 'internal', message: 'text is required' } });
                    return;
                }
                try {
                    const value = await service.chat(text);
                    writeJson(res, 200, { ok: true, value });
                }
                catch (error) {
                    writeJson(res, 500, { ok: false, error: { code: 'reply-failed', message: error instanceof Error ? error.message : String(error) } });
                }
            },
        },
        {
            kind: 'exact',
            path: `${API_PREFIX}/bubble`,
            handler: async (req, res) => {
                if (!isLoopbackRequest(req) || req.method !== 'POST') {
                    writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                    return;
                }
                try {
                    const value = await service.bubble();
                    writeJson(res, 200, { ok: true, value });
                }
                catch {
                    writeJson(res, 200, { ok: true, value: null });
                }
            },
        },
        {
            // 表情静态文件：GET /api/dsh-dafeiyu/stickers/<file>（从本地表情库目录读，回传图片）。
            kind: 'prefix',
            path: `${API_PREFIX}/stickers`,
            handler: async (req, res) => {
                if (!isLoopbackRequest(req) || req.method !== 'GET') {
                    writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } });
                    return;
                }
                const url = new URL(req.url ?? '/', 'http://localhost');
                // URL.pathname 保留百分号编码（中文文件名），需解码后再拼路径。
                let file = '';
                try {
                    file = decodeURIComponent(url.pathname.split('/').pop() ?? '');
                }
                catch {
                    file = '';
                }
                if (file === '' || file.includes('..') || file.includes('\\') || file.includes('/')) {
                    writeJson(res, 400, { ok: false, error: { code: 'internal', message: 'bad file' } });
                    return;
                }
                const full = join(stickersDir(), file);
                try {
                    const info = await stat(full);
                    if (!info.isFile()) {
                        writeJson(res, 404, { ok: false, error: { code: 'not-found', message: 'sticker not found' } });
                        return;
                    }
                    res.writeHead(200, {
                        'content-type': 'image/png',
                        'content-length': String(info.size),
                        'cache-control': 'public, max-age=86400',
                        'referrer-policy': 'no-referrer',
                    });
                    createReadStream(full).pipe(res);
                }
                catch {
                    writeJson(res, 404, { ok: false, error: { code: 'not-found', message: 'sticker not found' } });
                }
            },
        },
    ];
}
//# sourceMappingURL=routes.js.map