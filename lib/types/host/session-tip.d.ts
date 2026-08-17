/**
 * 「新建会话护航提示」data service — when the user clicks "新建会话" in a
 * workspace, give them a useful nudge BEFORE they start:
 * - no prior sessions in this workspace → a short "新任务注意事项" checklist
 * - prior sessions exist → a suggestion grounded in those sessions' titles
 *   and recent conversation extracts (read-only, never writes).
 *
 * Design (user-confirmed): fires on EVERY new-session click (no rate limit —
 * 下载该插件的都是需要陪伴的用户), reads real session summaries, and the tip
 * shows inside the 大肥鱼 panel.
 * @module dsh-dafeiyu/host/session-tip
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { ReplySticker } from '../core/types.ts';
/** The runtime shape the /new-session-tip route binds to. */
export interface SessionTipService {
    tip(): Promise<{
        hasSessions: boolean;
        text: string;
        sessions: string[];
        sticker?: ReplySticker;
    }>;
}
/**
 * Create the new-session-tip service.
 * @param ctx - host context carrying sessionQuery / llm / agentDefaultModel / workspaceRegistry.
 * @returns the service for the route handler.
 */
export declare function createSessionTipService(ctx: unknown): SessionTipService;
/**
 * Build the `/new-session-tip` route. Read-only: lists sessions, reads titles
 * and recent extracts — never writes or deletes.
 */
export declare function makeSessionTipRoutes(deps: {
    service: SessionTipService;
}): WebRoute[];
