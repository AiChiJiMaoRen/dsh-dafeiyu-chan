/**
 * @dsh-external/dsh-dafeiyu-chan — core wire vocabulary shared by the host data
 * services and the browser client: the request/response shapes of the
 * `/api/dsh-dafeiyu/*` routes and the stable envelope the chat panel uses.
 * Pure types — no runtime code.
 * @module dsh-dafeiyu-chan/core/types
 */

/** Envelope every /api/dsh-dafeiyu JSON response carries. */
export type DafeiyuEnvelope<T> =
  | { ok: true; value: T }
  | { ok: false; error: DafeiyuError }

/** Stable rejection codes (host-authored; the client renders its own copy). */
export type DafeiyuErrorCode =
  | 'workspace-unknown'
  | 'memory-unreadable'
  | 'memory-write-failed'
  | 'reply-failed'
  | 'read-failed'
  | 'internal'

/** One rejection with a human-readable host message. */
export interface DafeiyuError {
  code: DafeiyuErrorCode
  message: string
}

/** The personal memory note-book (fixed fields; 杂鱼 is permanent per spec). */
export interface WhaleMemory {
  /** What 大肥鱼 calls the user — fixed as `杂鱼` (not user-editable per spec). */
  nickname: string
  /** Last known mood marker ('blah' | 'okay' | 'up'), updated from chats. */
  mood: 'blah' | 'okay' | 'up'
  /** A short note about what the user is currently up to (one sentence). */
  currentFocus?: string
  /** Last interaction epoch millis. */
  lastSeenAt: number
  /** Count of interactions since install. */
  interactionCount: number
  /** Recent work/progress summaries since the last few turns (newest first, ≤20). */
  progressLog: MemoryEntry[]
}

/**
 * One condensed progress/待办 entry distilled by the LLM after a chat turn.
 * `progress` = a step that got advanced/completed; `todo` = something left half-finished.
 */
export interface MemoryEntry {
  /** Epoch millis when this entry was recorded. */
  at: number
  /** A condensed progress/todo summary (≤120 characters). */
  text: string
  /** progress=已完成/进展；todo=待办/说到一半. */
  kind: 'progress' | 'todo'
}

/** A single message row inside the in-panel transcript. */
export interface ChatTurn {
  role: 'user' | 'whale'
  text: string
  at: number
}

/** The initial panel payload: greeting + the remembered context. */
export interface ChatBootstrap {
  greeting: string
  memory: WhaleMemory
  /** Real project root the current session is working in (from workspaceRegistry). */
  workspace: string | null
  /** A locally-picked sticker matching the remembered mood (zero-token, optional). */
  sticker?: ReplySticker
  /** All available sticker filenames — client preloads them for instant display. */
  stickers: string[]
}

/** Request body for one chat turn. */
export interface ChatRequest {
  text: string
}

/** One sticker attached to a reply (rendered as an image by the client). */
export interface ReplySticker {
  /** Filename (URL path under /api/dsh-dafeiyu/stickers/<file>). */
  file: string
  /** Mood label ('开心' | '难过' | '生气' | '无语' | '加油' | '通用'). */
  mood: string
}

/** The result of one chat turn: the whale's reply + the updated memory. */
export interface ChatReply {
  text: string
  memory: WhaleMemory
  /** A locally-picked sticker matching the turn's mood (zero-token, optional). */
  sticker?: ReplySticker
}

/** One lightweight proactive bubble (deny-rate limited). */
export interface BubblePayload {
  text: string
}

/** The result of a `/ideas` call: suggested next moves for the current workspace. */
export interface IdeasReply {
  /** Whether the workspace looks like a fresh/new project (few root files, no manifest). */
  isNewProject: boolean
  /** 1~3 concrete, actionable suggestions (each ≤80 chars). */
  ideas: string[]
  /** Where the context came from (e.g. README、工作区文件清单、草稿笔记). */
  note?: string
}
