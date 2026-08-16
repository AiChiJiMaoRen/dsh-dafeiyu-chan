/**
 * 大肥鱼「给点子」data service — reads the current workspace + a slice of the
 * user's recent draft notes, detects whether the project is brand-new, then
 * asks the LLM (persona) for 1~3 concrete suggestions. **Strictly read-only**:
 * it lists directories and reads file heads — never writes or deletes.
 *
 * Reading is done with the same provider/model resolution and stream call the
 * chat gateway uses, but this is a standalone lightweight implementation so the
 * ideas path never couples to the chat route's memory bookkeeping. Falls back
 * to rule-based copy when the LLM channel is unavailable.
 * @module dsh-dafeiyu/host/ideas
 */

import { readdir, readFile, stat } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { WHALE_SYSTEM_PROMPT } from '../core/persona.ts'
import type { IdeasReply } from '../core/types.ts'

/** Key matching every workspace root's potential entry file. */
const FLAG_FILES = ['README', 'README.md', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'index.html']

/** Headings that make a Downloads text file look like 草稿/笔记. */
const NOTE_KEYWORDS = /(草稿|draft|note|笔记|idea|想法|随想|todo)/i

/** Text extensions considered when scanning ~/Downloads for drafts. */
const TEXT_EXTS = ['.md', '.txt', '.json']

/** Cap on drafts read per call (avoid scanning the whole Downloads dir). */
const MAX_DRAFTS = 10
/** A draft is only read when modified within this window when the name has no keyword. */
const RECENT_DAYS = 7
/** Every `.md`/`.txt`/`.json` head we record is capped at this many chars. */
const DRAFT_HEAD_CHARS = 200
/** Root README head caps at 300 chars. */
const README_HEAD_CHARS = 300

/** The runtime shape the ideas route binds to. */
export interface IdeasService {
  ideas(): Promise<IdeasReply>
}

/**
 * Fallback copy returned when the LLM is unavailable or the parse yields
 * nothing usable. Plain, concrete, actionable — and persona-flavoured.
 */
const RULE_IDEAS = (isNewProject: boolean): string[] => isNewProject
  ? [
      '先把根目录 README 立起来呀，别人一看就知道你在做什么~',
      '要不先起一个「跑起来就够酷」的骨架？第一个能跑的版本最提气。',
      '想起个头没方向的话，本鱼帮你盯着 Downloads 里的草稿找找素材?',
    ]
  : [
      '先把项目当前卡住的点挑出来，一口气啃掉，别拖着嘛~',
      '给 README 补上「怎么跑」的说明，回来看一眼就手拿把掐。',
      '把 Todo/待办列出来，挑最想先做的那一个开工，本鱼给你看着。',
    ]

/**
 * A minimal persona-driven LLM call for the ideas feature (provider/model
 * resolved like the chat gateway, streamed once, tolerating absence/failure).
 * @param ctx - host context carrying llm + agentDefaultModel.
 * @returns an async callLlm that reads provider/model then streams one reply.
 */
export function makeLlmCall(ctx: unknown): (userText: string) => Promise<string | null> {
  const llm = (ctx as { llm?: { stream(o: unknown): AsyncIterable<unknown> } }).llm
  const agentDefault = (ctx as { agentDefaultModel?: { currentSelection(): { provider?: string; model?: string } } }).agentDefaultModel

  return async (userText: string): Promise<string | null> => {
    if (!llm) return null
    let provider: string | undefined
    let model: string | undefined
    try {
      const selection = agentDefault?.currentSelection?.()
      provider = selection?.provider
      model = selection?.model
    } catch {
      /* fall through */
    }
    if (!provider || !model) {
      try {
        const providers = (llm as { listProviders?(): Array<{ name?: string }> }).listProviders?.() ?? []
        const first = providers[0]
        if (first?.name) {
          provider = first.name
          await (llm as { listModels?(p: string): Promise<Array<{ id?: string }>> }).listModels?.(first.name)
            .then((ms) => { model = ms[0]?.id })
            .catch(() => undefined)
        }
      } catch {
        /* no adaptive default */
      }
    }
    if (!provider || !model) return null
    try {
      const stream = llm.stream({
        provider,
        model,
        system: WHALE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: [{ type: 'text', text: userText }] }],
        temperature: 0.9,
        maxTokens: 300,
      })
      let reply = ''
      for await (const chunk of stream) {
        if (chunk !== null && typeof chunk === 'object') {
          const c = chunk as { type?: string; text?: string }
          if (c.type === 'text-delta' && typeof c.text === 'string') reply += c.text
          if (c.type === 'finish') break
        }
      }
      const cleaned = reply.trim()
      return cleaned.length > 0 ? cleaned : null
    } catch {
      return null
    }
  }
}

/** A sourced snippet of a single draft note. */
interface DraftSample {
  name: string
  head: string
}

/** Collected read-only context about the workspace + drafts. */
interface IdeasContext {
  fileList: string[]
  isNewProject: boolean
  gitStatus: string | null
  readmeHead: string | null
  drafts: DraftSample[]
  note: string | null
}

/**
 * Create the ideas service binding the route handlers to.
 * @param ctx - host context carrying workspaceRegistry (for the current root).
 * @param gateway - optional LLM caller; defaults to a persona-driven stream call.
 * @returns the service object for the `/ideas` handler.
 */
export function createIdeasService(ctx: unknown, gateway?: (userText: string) => Promise<string | null>): IdeasService {
  const workspaceRegistry = (ctx as { workspaceRegistry?: { list(): Array<{ path: string }> } }).workspaceRegistry
  const workspacePath = workspaceRegistry?.list?.()?.[0]?.path ?? null
  const callLlm = gateway ?? makeLlmCall(ctx)

  return {
    async ideas(): Promise<IdeasReply> {
      const context = await gatherContext(workspacePath)
      const prompt = buildPrompt(context)
      const llmText = await callLlm(prompt)
      const parsed = llmText !== null ? extractIdeas(llmText) : null
      return parsed ?? {
        isNewProject: context.isNewProject,
        ideas: RULE_IDEAS(context.isNewProject),
        note: context.note ?? undefined,
      }
    },
  }
}

/** Gather every read-only fact the ideas reply needs. Never throws. */
async function gatherContext(workspace: string | null): Promise<IdeasContext> {
  const fileList: string[] = []
  let isNewProject = false
  let gitStatus: string | null = null
  let readmeHead: string | null = null
  let hasManifest = false

  if (workspace != null) {
    try {
      const entries = await readdir(workspace, { withFileTypes: true })
      const names = entries
        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
        .sort()
      for (const name of names) fileList.push(name)
      hasManifest = names.some((n) => {
        const bare = n.replace(/\/$/, '')
        return FLAG_FILES.includes(bare)
      })
      if (names.some((n) => n === '.git/')) {
        gitStatus = await gitPorcelain(workspace).catch(() => null)
      }
      const readmeName = names.find((n) => /^readme(\.[a-z0-9]+)?\/?$/i.test(n.replace(/\/$/, '')))
      if (readmeName) {
        readmeHead = await readHead(workspace, readmeName.replace(/\/$/, ''), README_HEAD_CHARS)
      }
    } catch {
      /* workspace unreadable — treat as unknown, not an error */
    }
  }

  // 新项目：根目录文件数 ≤ 5 且没有任何标志文件。
  isNewProject = workspace != null && fileList.length <= 5 && !hasManifest

  const drafts = await readDrafts()
  const note = buildNote({ workspace, gitStatus: gitStatus != null, draftCount: drafts.length, hasManifest })

  return { fileList, isNewProject, gitStatus, readmeHead, drafts, note }
}

/** `git status --porcelain` in the workspace root; `null` on any failure. */
async function gitPorcelain(workspace: string): Promise<string | null> {
  const execAsync = promisify(execFile)
  try {
    const { stdout } = await execAsync('git', ['status', '--porcelain'], { cwd: workspace })
    const out = (stdout ?? '').toString().trim()
    return out.length > 0 ? out : null
  } catch {
    return null
  }
}

/** Read the first `chars` characters of a text file (best-effort). */
async function readHead(dir: string, name: string, chars: number): Promise<string | null> {
  try {
    const raw = await readFile(join(dir, name), 'utf8')
    return raw.slice(0, chars).trim()
  } catch {
    return null
  }
}

/** Scan ~/Downloads for draft-like notes and read their 200-char heads. */
async function readDrafts(): Promise<DraftSample[]> {
  const downloads = join(homedir(), 'Downloads')
  const drafts: DraftSample[] = []
  try {
    let entries: import('node:fs').Dirent[] | null = null
    try {
      entries = await readdir(downloads, { withFileTypes: true })
    } catch {
      return drafts // 目录不存在/无权限 → 跳过
    }
    const now = Date.now()
    const recentMs = RECENT_DAYS * 24 * 60 * 60 * 1000

    const matches: Array<{ name: string; path: string; recent: boolean }> = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
      if (!TEXT_EXTS.includes(ext)) continue
      if (!NOTE_KEYWORDS.test(entry.name)) {
        // 名字不含关键词 → 仅当「近期修改」才考虑。
        try {
          const info = await stat(join(downloads, entry.name))
          if (now - info.mtimeMs > recentMs) continue
        } catch {
          continue
        }
      }
      matches.push({ name: entry.name, path: join(downloads, entry.name), recent: true })
    }

    // 最近修改的优先，最多取 MAX_DRAFTS 个。
    matches.sort((a, b) => (a.recent ? 0 : 1) - (b.recent ? 0 : 1))
    for (const m of matches.slice(0, MAX_DRAFTS)) {
      const head = await readHead(downloads, m.name, DRAFT_HEAD_CHARS)
      if (head == null) continue
      drafts.push({ name: m.name, head })
      if (drafts.length >= MAX_DRAFTS) break
    }
  } catch {
    /* downloads scan failed — return what we got */
  }
  return drafts
}

/** Build a human-readable note describing where the ideas context came from. */
function buildNote(info: { workspace: string | null; gitStatus: boolean; draftCount: number; hasManifest: boolean }): string | null {
  const parts: string[] = []
  if (info.workspace != null) parts.push(info.hasManifest ? '基于当前工作区' : '基于当前工作区（还挺空）')
  if (info.gitStatus) parts.push('git 有未提交改动')
  if (info.draftCount > 0) parts.push(`基于你 Downloads 里的 ${info.draftCount} 份草稿`)
  return parts.length > 0 ? parts.join('；') : null
}

/** Assemble the LLM prompt from gathered context. */
function buildPrompt(context: IdeasContext): string {
  const lines: string[] = ['请作为帮我出点子的伙伴，基于下面的事实给我 1~3 条具体、可马上动手的建议。每条一行，≤80 字，别空泛。']
  if (context.isNewProject) lines.push('（这像是个新地盘，建议往「起步」方向想：立 README、搭骨架、做第一个能跑的功能。）')
  if (context.fileList.length > 0) lines.push(`工作区根目录：${context.fileList.join(', ')}`)
  if (context.gitStatus) lines.push(`git 未提交/新文件：\n${context.gitStatus}`)
  if (context.readmeHead) lines.push(`README 开头：${context.readmeHead}`)
  if (context.drafts.length > 0) {
    lines.push('我下面这些草稿笔记可能有用：')
    for (const d of context.drafts) lines.push(`- ${d.name}：${d.head}`)
  }
  lines.push('只输出这样的 JSON：{"ideas": ["建议一", "建议二"]}')
  return lines.join('\n')
}

/** Extract an ideas array from the LLM reply, tolerating JSON + line splits. */
function extractIdeas(text: string): { isNewProject: boolean; ideas: string[] } | null {
  const cleaned = text.trim()
  // — JSON object form —
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const obj = JSON.parse(jsonMatch[0]) as { ideas?: unknown }
      if (Array.isArray(obj.ideas)) {
        const ideas = obj.ideas
          .filter((i): i is string => typeof i === 'string' && i.trim().length > 0)
          .map((i) => i.trim().slice(0, 80))
        if (ideas.length > 0) return { isNewProject: false, ideas: ideas.slice(0, 3) }
      }
    } catch {
      /* try line fallback */
    }
  }
  // — line-by-line (each line = one idea) —
  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*\d.\s]+/, '').trim())
    .filter((l) => l.length > 0 && l.length <= 100)
  if (lines.length > 0) {
    return { isNewProject: false, ideas: lines.slice(0, 3).map((l) => l.slice(0, 80)) }
  }
  return null
}

/** Loopback-only trust fence (mirrors the chat family): allow localhost only. */
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
 * Build the `/ideas` route. Strictly read-only: reads workspace heads + draft
 * notes, never writes or deletes. GET-less; only POST with an optional body.
 * @param deps - the ideas service created in apply.
 * @returns the exact route list (currently one entry).
 */
export function makeIdeasRoutes(deps: { service: IdeasService }): WebRoute[] {
  const { service } = deps
  return [
    {
      kind: 'exact',
      path: '/api/dsh-dafeiyu/ideas',
      handler: async (req, res) => {
        if (!isLoopbackRequest(req) || req.method !== 'POST') {
          writeJson(res, 403, { ok: false, error: { code: 'internal', message: 'forbidden' } })
          return
        }
        try {
          const value = await service.ideas()
          writeJson(res, 200, { ok: true, value })
        } catch (error) {
          writeJson(res, 500, { ok: false, error: { code: 'read-failed', message: error instanceof Error ? error.message : String(error) } })
        }
      },
    },
  ]
}
