/**
 * The /api/dsh-dafeiyu route family: bootstrap, chat, bubble.
 *
 * Loopback-only trust fence (mirrors dsh-ssh): these routes can trigger reply
 * generation, so LAN-exposed dsh deployments must not serve them.
 * @module dsh-dafeiyu/host/routes
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
import type { DafeiyuService } from './service.ts';
import { type IdeasService } from './ideas.ts';
import { type SessionTipService } from './session-tip.ts';
export type { ReplyGateway } from './service.ts';
/** Path prefix for every dafeiyu route. */
export declare const API_PREFIX = "/api/dsh-dafeiyu";
/** Route handler deps. */
export interface DafeiyuRoutesDeps {
    service: DafeiyuService;
}
/** Deps for the `/ideas` route. */
export interface DafeiyuIdeasDeps {
    ideasService: IdeasService;
}
/** Deps for the `/new-session-tip` route. */
export interface DafeiyuSessionTipDeps {
    sessionTipService: SessionTipService;
}
/**
 * Build every /api/dsh-dafeiyu route.
 * @param deps - the services created in apply.
 * @returns the exact routes.
 */
export declare function makeRoutes(deps: DafeiyuRoutesDeps & DafeiyuIdeasDeps & DafeiyuSessionTipDeps): WebRoute[];
