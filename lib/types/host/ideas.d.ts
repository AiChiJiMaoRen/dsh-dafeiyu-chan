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
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { IdeasReply } from '../core/types.ts';
/** The runtime shape the ideas route binds to. */
export interface IdeasService {
    ideas(): Promise<IdeasReply>;
}
/**
 * A minimal persona-driven LLM call for the ideas feature (provider/model
 * resolved like the chat gateway, streamed once, tolerating absence/failure).
 * @param ctx - host context carrying llm + agentDefaultModel.
 * @returns an async callLlm that reads provider/model then streams one reply.
 */
export declare function makeLlmCall(ctx: unknown): (userText: string) => Promise<string | null>;
/**
 * Create the ideas service binding the route handlers to.
 * @param ctx - host context carrying workspaceRegistry (for the current root).
 * @param gateway - optional LLM caller; defaults to a persona-driven stream call.
 * @returns the service object for the `/ideas` handler.
 */
export declare function createIdeasService(ctx: unknown, gateway?: (userText: string) => Promise<string | null>): IdeasService;
/**
 * Build the `/ideas` route. Strictly read-only: reads workspace heads + draft
 * notes, never writes or deletes. GET-less; only POST with an optional body.
 * @param deps - the ideas service created in apply.
 * @returns the exact route list (currently one entry).
 */
export declare function makeIdeasRoutes(deps: {
    service: IdeasService;
}): WebRoute[];
