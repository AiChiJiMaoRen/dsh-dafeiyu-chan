/**
 * @dsh-external/dsh-dafeiyu-chan — host half: the 大肥鱼 data service, the
 * /api/dsh-dafeiyu/* HTTP routes on the shared webserver, and a system-prompt
 * announcement so agents know the whale companion exists. The browser half
 * (exports "./client") is served by client-modules from the same package's
 * dsh.client declaration.
 *
 * Reply channel: the MVP ships with the rule-based offline gateway (zero extra
 * wiring); an optional `llm` channel uses `ctx.llm.stream(...)` with the 大肥鱼
 * persona for richer replies. Default follows the finalized MVP scope.
 * @module @dsh-external/dsh-dafeiyu-chan
 */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-session-query'
import { createDafeiyuService, createLlmReplyGateway, RULE_REPLY_GATEWAY } from './host/service.ts'
import { createIdeasService } from './host/ideas.ts'
import { createSessionTipService } from './host/session-tip.ts'
import { createDeskpetService } from './host/deskpet.ts'
import { makeRoutes } from './host/routes.ts'

export const name = '@dsh-external/dsh-dafeiyu-chan'
export const inject = ['webServer', 'workspaceRegistry', 'systemPrompt', 'llm', 'agentDefaultModel', 'sessionQuery']

/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
  /** Reply channel: 'rule' (offline, zero wiring) or 'llm' (LLM persona replies). */
  replyChannel?: 'rule' | 'llm'
  /** When true, announce the whale to every agent via the system-prompt band. */
  announceToAgent?: boolean
  /** Master switch for the plugin. */
  enabled?: boolean
}

export const Config = z.object({
  replyChannel: z.string().default('llm'),
  announceToAgent: z.boolean().default(true),
  enabled: z.boolean().default(true),
})

/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 999

/** Model-facing announcement: the whale companion is present and how to use it. */
export const DAFEIYU_GUIDANCE = '本机已安装 dsh-dafeiyu-chan 插件（大肥鱼·鲸鱼娘陪伴看板娘）：左侧栏最底部的一条「大肥鱼」鱼标，点击展开一个 dsh 风的聊天对话框。她会以鲸鱼娘人设陪你唠嗑（俏皮、有骨头、护短，称呼你为「杂鱼」），能接住你当前工作会话的上下文做简单的代码/文件/整理类小活，并通过 ~/.dsh/whale-memory.json 记住你的心情与关注点（固定称呼，不跟项目绑）。你提到「大肥鱼 / 鲸鱼娘 / 陪聊 / 看板娘」时即指本插件，可让它在对话里协助。'

/**
 * Mount the 大肥鱼 data service, routes, and announcement.
 * @param ctx - host plugin context carrying webServer/workspaceRegistry/systemPrompt.
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export function apply(ctx: Context, config?: Config): void {
  const gateway = config?.replyChannel === 'llm' ? createLlmReplyGateway(ctx) : RULE_REPLY_GATEWAY
  const services = {
    service: createDafeiyuService(ctx, gateway),
    ideasService: createIdeasService(ctx),
    sessionTipService: createSessionTipService(ctx),
    // 桌宠后端：记忆快照 + 开关持久化（client 端 deskpet 专用）。
    deskpet: createDeskpetService(),
  }
  const routes = makeRoutes(services)

  let disposeRoutes: (() => void) | undefined
  let disposeSection: (() => void) | undefined

  const sync = (): void => {
    if (disposeRoutes !== undefined) { disposeRoutes(); disposeRoutes = undefined }
    if (disposeSection !== undefined) { disposeSection(); disposeSection = undefined }
    if (config?.enabled === false) return
    disposeSection = ctx.systemPrompt.section({
      name: 'plugin:dsh-dafeiyu-chan',
      order: SECTION_ORDER,
      text: DAFEIYU_GUIDANCE,
    })
    disposeRoutes = ctx.effect(
      () => {
        const disposers = routes.map((route) => ctx.webServer.register(route))
        return () => { for (const dispose of disposers) dispose() }
      },
      'dsh-dafeiyu-chan: routes',
    )
  }

  sync()
}
