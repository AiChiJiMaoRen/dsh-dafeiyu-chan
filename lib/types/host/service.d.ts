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
import type { Context } from '@deepseek-ai/cordis';
import type { ChatBootstrap, ChatReply, WhaleMemory } from '../core/types.ts';
import { type Tone } from './stickers.ts';
/** Route family dependencies. */
export interface DafeiyuServiceDeps {
    workspaceRegistry: {
        list(): Array<{
            path: string;
        }>;
    };
    workspacePath?: string;
}
/** The runtime shape the route handlers bind to. */
export interface DafeiyuService {
    bootstrap(): Promise<ChatBootstrap>;
    memory(): Promise<WhaleMemory>;
    chat(text: string): Promise<ChatReply>;
    bubble(): Promise<{
        text: string;
    } | null>;
}
/** One gateway reply. Sticker selection is intentionally paused. */
export interface GatewayReply {
    text: string;
    thought?: string;
}
/** Functions the chat route calls to produce a reply — swappable by channel. */
export interface ReplyGateway {
    /** Produce one whale reply to a user turn. Must never throw. */
    reply(input: {
        text: string;
        memory: WhaleMemory;
        workspace: string | null;
        stickers: string[];
        tone?: Tone;
    }): Promise<GatewayReply>;
    /** Produce a fresh, on-the-fly opening line (no reused templates) for the panel. Must never throw. */
    greeting(input: {
        memory: WhaleMemory;
        workspace: string | null;
    }): Promise<string>;
}
/** 从用户一句话推断语境标签（决定表情选图倾向）。 */
export declare function inferTone(text: string): Tone;
/** Fallback reply gateway used when the LLM channel is unavailable. */
export declare const RULE_REPLY_GATEWAY: ReplyGateway;
/**
 * Build a persona-driven LLM reply gateway using `ctx.llm.stream(...)` — one
 * one-shot non-streaming-completed call with the 大肥鱼 system prompt. Falls
 * back to the rule gateway when the LLM service or a default model is absent.
 * @param ctx - host context carrying llm + agentDefaultModel.
 * @returns a reply gateway that never throws.
 */
export declare function createLlmReplyGateway(ctx: Context): ReplyGateway;
/**
 * Create the service the routes bind to.
 * @param ctx - context carrying workspaceRegistry.
 * @param gateway - reply generator (inject the chosen channel).
 * @returns the service object for the route handlers.
 */
export declare function createDafeiyuService(ctx: Context, gateway?: ReplyGateway): {
    memory(): Promise<WhaleMemory>;
    /** Greeting payload retained for the sidebar entry bubble. */
    bootstrap(): Promise<ChatBootstrap>;
    /** One chat turn: update memory, call the gateway, distill memory, persist, return. */
    chat(text: string): Promise<ChatReply>;
    /** Null unless a proactive bubble is due (deny-rate limited). */
    bubble(): Promise<{
        text: string;
    } | null>;
};
