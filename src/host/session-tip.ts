/**
 * 「新建会话护航提示」data service — when the user clicks "新建会话" in a
 * workspace, give them a useful nudge BEFORE they start:
 * - no prior sessions in this workspace → a short "新任务注意事项" checklist
 * - prior sessions exist → a suggestion grounded in those sessions' titles
 *   and recent conversation extracts (read-only, never writes).
 *
 * Design (user-confirmed): fires on EVERY new-session click (no rate limit —
 * 下载该插件的都是需要陪伴的用户), reads real session summaries, and the tip
 * is rendered by the 大肥鱼 deskpet bubble.
 * @module dsh-dafeiyu/host/session-tip
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { extractSessionEventText } from '@deepseek-ai/dsh-session-query'
import { WHALE_SYSTEM_PROMPT } from '../core/persona.ts'

/** The runtime shape the /new-session-tip route binds to. */
export interface SessionTipService {
  tip(): Promise<{ hasSessions: boolean; text: string; sessions: string[] }>
}

/** Minimal ctx surface we need (typed defensively like the other services). */
interface SessionQueryCtx {
  sessionQuery?: {
    listSessions(signal?: AbortSignal): Promise<Array<{ header: { id: string; cwd?: string } }>>
    readTitle(sessionId: string): Promise<{ title?: string } | undefined>
    readSession(sessionId: string): Promise<{ events: Array<Record<string, unknown>> }>
  }
  llm?: { stream(o: unknown): AsyncIterable<unknown> }
  agentDefaultModel?: { currentSelection(): { provider?: string; model?: string } }
  workspaceRegistry?: { list(): Array<{ path: string }> }
}

/** Fallback checklist when the workspace has no prior sessions. */
const NEW_TASK_NOTES = [
  '给会话起个能看懂的名字：回头翻记录时，一眼就知道这个会话在干嘛~',
  '先把目标用一句话说清楚，大肥鱼也好帮你盯进度嘛。',
  '如果要接着上次的活，记得说「接着上次」——本鱼会去翻旧会话的。',
  '干活前确认工作目录选对，别把活干错地方啦。',
]

/** Fallback suggestion when sessions exist but LLM is unavailable. */
const HAS_SESSIONS_NOTES = [
  '这个地盘你不是第一次来啦，要不要先看看之前的会话，接着上次的活儿干？',
  '给新会话起个和上次不一样的、能看出「新进展」的名字，回头好找。',
]

/**
 * Create the new-session-tip service.
 * @param ctx - host context carrying sessionQuery / llm / agentDefaultModel / workspaceRegistry.
 * @returns the service for the route handler.
 */
export function createSessionTipService(ctx: unknown): SessionTipService {
  const c = ctx as SessionQueryCtx
  const sessionQuery = c.sessionQuery
  const workspacePath = c.workspaceRegistry?.list?.()?.[0]?.path ?? null

  return {
    async tip() {
      // 1. Find sessions belonging to this workspace (by header.cwd).
      let sessions: Array<{ id: string; cwd?: string }> = []
      try {
        const records = (await sessionQuery?.listSessions()) ?? []
        sessions = records
          .map((r) => ({ id: r.header.id, cwd: r.header.cwd }))
          .filter((s) => s.cwd !== undefined && workspacePath !== null && samePath(s.cwd!, workspacePath))
      } catch {
        /* query unavailable — treat as no sessions */
      }

      if (sessions.length === 0) {
        return {
          hasSessions: false,
          text: `诶，杂鱼，这是你在「${baseName(workspacePath)}」这儿第一次开张吧？本鱼给你念叨几句新任务注意事项：\n${NEW_TASK_NOTES.map((n, i) => `${i + 1}. ${n}`).join('\n')}`,
          sessions: [],
        }
      }

      // 2. Collect titles + a short recent-text extract from the newest few.
      const newest = [...sessions].sort((a, b) => a.id.localeCompare(b.id)).slice(-3)
      const titles: string[] = []
      const extracts: string[] = []
      for (const s of newest) {
        try {
          const title = (await sessionQuery?.readTitle(s.id))?.title
          if (title) titles.push(title)
        } catch { /* skip */ }
        try {
          const snapshot = await sessionQuery?.readSession(s.id)
          const text = (snapshot?.events ?? [])
            .slice(-12)
            .map((e) => extractSessionEventText(e as never))
            .filter((t) => t.length > 0)
            .join(' ')
          if (text) extracts.push(text.slice(0, 400))
        } catch { /* skip */ }
      }

      // 3. Ask the LLM (persona) for a suggestion grounded in those sessions.
      const llmText = await callLlm(c, buildPrompt(workspacePath, titles, extracts))
      if (llmText !== null) {
        return { hasSessions: true, text: llmText, sessions: titles }
      }
      return {
        hasSessions: true,
        text: `杂鱼，这个地盘你之前来过啦~ 本鱼翻了翻旧账：${titles.length > 0 ? titles.join('、') : '有几个旧会话'}。\n${HAS_SESSIONS_NOTES.join('\n')}`,
        sessions: titles,
      }
    },
  }
}

/** Windows-safe path comparison (case-insensitive, slash-normalized). */
function samePath(a: string, b: string): boolean {
  const norm = (p: string) => p.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase()
  return norm(a) === norm(b)
}

/** Basename of a path (or a fallback label). */
function baseName(path: string | null): string {
  if (path == null) return '这个地盘'
  const base = path.split(/[\\/]/).filter(Boolean).pop()
  return base ? `「${base}」` : '这个地盘'
}

/** Build the LLM prompt for the "has sessions" case. */
function buildPrompt(workspace: string | null, titles: string[], extracts: string[]): string {
  const lines: string[] = [
    `用户正在工作区${workspace != null ? `「${baseName(workspace)}」` : ''}里点击「新建会话」。`,
    '这个工作区之前已经有一些会话了，用户需要一条简短、贴心、有用的建议（1~3 句），告诉他可以怎么开始：',
    '可以提醒他：上次在忙什么（引用旧会话标题/内容）、要不要接着上次做、新会话怎么命名、避免重复劳动。',
  ]
  if (titles.length > 0) lines.push(`旧会话标题：${titles.join('；')}`)
  if (extracts.length > 0) lines.push(`最近对话片段：\n${extracts.join('\n---\n')}`)
  lines.push('要求：用大肥鱼的语气（自称本鱼，叫用户杂鱼，娇软自然，别用科幻辞藻），不超过 3 句，直接给建议，不要解释你在干嘛。')
  return lines.join('\n')
}

/** One persona LLM call with the shared provider/model resolution. */
async function callLlm(c: SessionQueryCtx, userText: string): Promise<string | null> {
  const llm = c.llm
  if (!llm) return null
  let provider: string | undefined
  let model: string | undefined
  try {
    const selection = c.agentDefaultModel?.currentSelection?.()
    provider = selection?.provider
    model = selection?.model
  } catch { /* fall through */ }
  if (!provider || !model) {
    try {
      const providers = (llm as unknown as { listProviders?(): Array<{ name?: string }> }).listProviders?.() ?? []
      const first = providers[0]
      if (first?.name) {
        provider = first.name
        model = await (llm as unknown as { listModels?(p: string): Promise<Array<{ id?: string }>> }).listModels?.(first.name)
          .then((ms) => ms[0]?.id, () => undefined)
          .catch(() => undefined)
      }
    } catch { /* no adaptive default */ }
  }
  if (!provider || !model) return null
  try {
    const stream = llm.stream({
      provider,
      model,
      system: WHALE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: [{ type: 'text', text: userText }] }],
      temperature: 0.9,
      maxTokens: 260,
    })
    let reply = ''
    for await (const chunk of stream) {
      if (chunk !== null && typeof chunk === 'object') {
        const c2 = chunk as { type?: string; text?: string }
        if (c2.type === 'text-delta' && typeof c2.text === 'string') reply += c2.text
        if (c2.type === 'finish') break
      }
    }
    const cleaned = reply.trim()
    return cleaned.length > 0 ? cleaned : null
  } catch {
    return null
  }
}

/** Loopback-only trust fence (mirrors the other dafeiyu routes). */
function isLoopbackRequest(request: IncomingMessage): boolean {
  const address = request.socket.remoteAddress
  if (address !== '127.0.0.1' && address !== '::1' && address !== '::ffff:127.0.0.1') return false
  const host = request.headers.host
  if (typeof host !== 'string') return false
  let hostUrl: URL
  try {
    hostUrl = new URL(`http://${host}`)
  } catch {
    return false
  }
  if (hostUrl.hostname !== '127.0.0.1' && hostUrl.hostname !== 'localhost' && hostUrl.hostname !== '[::1]') return false
  if (request.headers['sec-fetch-site'] === 'cross-site') return false
  return true
}

/** One JSON response. */
function writeJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'referrer-policy': 'no-referrer' })
  res.end(payload)
}

/**
 * Build the `/new-session-tip` route. Read-only: lists sessions, reads titles
 * and recent extracts — never writes or deletes.
 */
export function makeSessionTipRoutes(deps: { service: SessionTipService }): WebRoute[] {
  const { service } = deps
  return [
    {
      kind: 'exact',
      path: '/api/dsh-dafeiyu/new-session-tip',
      handler: async (req, res) => {
        if (!isLoopbackRequest(req) || req.method !== 'POST') {
          writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } })
          return
        }
        try {
          const value = await service.tip()
          writeJson(res, 200, { ok: true, value })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: { code: 'read-failed', message: error instanceof Error ? error.message : String(error) } })
        }
      },
    },
  ]
}
