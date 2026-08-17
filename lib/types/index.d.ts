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
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
export declare const name = "@dsh-external/dsh-dafeiyu-chan";
export declare const inject: string[];
/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
    /** Reply channel: 'rule' (offline, zero wiring) or 'llm' (LLM persona replies). */
    replyChannel?: 'rule' | 'llm';
    /** When true, announce the whale to every agent via the system-prompt band. */
    announceToAgent?: boolean;
    /** Master switch for the plugin. */
    enabled?: boolean;
}
export declare const Config: z<Schemastery.ObjectS<{
    replyChannel: z<string, string>;
    announceToAgent: z<boolean, boolean>;
    enabled: z<boolean, boolean>;
}>, Schemastery.ObjectT<{
    replyChannel: z<string, string>;
    announceToAgent: z<boolean, boolean>;
    enabled: z<boolean, boolean>;
}>>;
/** Model-facing announcement: the whale companion is present and how to use it. */
export declare const DAFEIYU_GUIDANCE = "\u672C\u673A\u5DF2\u5B89\u88C5 dsh-dafeiyu-chan \u63D2\u4EF6\uFF08\u5927\u80A5\u9C7C\u00B7\u9CB8\u9C7C\u5A18\u966A\u4F34\u770B\u677F\u5A18\uFF09\uFF1A\u5DE6\u4FA7\u680F\u6700\u5E95\u90E8\u7684\u4E00\u6761\u300C\u5927\u80A5\u9C7C\u300D\u9C7C\u6807\uFF0C\u70B9\u51FB\u5C55\u5F00\u4E00\u4E2A dsh \u98CE\u7684\u804A\u5929\u5BF9\u8BDD\u6846\u3002\u5979\u4F1A\u4EE5\u9CB8\u9C7C\u5A18\u4EBA\u8BBE\u966A\u4F60\u5520\u55D1\uFF08\u4FCF\u76AE\u3001\u6709\u9AA8\u5934\u3001\u62A4\u77ED\uFF0C\u79F0\u547C\u4F60\u4E3A\u300C\u6742\u9C7C\u300D\uFF09\uFF0C\u80FD\u63A5\u4F4F\u4F60\u5F53\u524D\u5DE5\u4F5C\u4F1A\u8BDD\u7684\u4E0A\u4E0B\u6587\u505A\u7B80\u5355\u7684\u4EE3\u7801/\u6587\u4EF6/\u6574\u7406\u7C7B\u5C0F\u6D3B\uFF0C\u5E76\u901A\u8FC7 ~/.dsh/whale-memory.json \u8BB0\u4F4F\u4F60\u7684\u5FC3\u60C5\u4E0E\u5173\u6CE8\u70B9\uFF08\u56FA\u5B9A\u79F0\u547C\uFF0C\u4E0D\u8DDF\u9879\u76EE\u7ED1\uFF09\u3002\u4F60\u63D0\u5230\u300C\u5927\u80A5\u9C7C / \u9CB8\u9C7C\u5A18 / \u966A\u804A / \u770B\u677F\u5A18\u300D\u65F6\u5373\u6307\u672C\u63D2\u4EF6\uFF0C\u53EF\u8BA9\u5B83\u5728\u5BF9\u8BDD\u91CC\u534F\u52A9\u3002";
/**
 * Mount the 大肥鱼 data service, routes, and announcement.
 * @param ctx - host plugin context carrying webServer/workspaceRegistry/systemPrompt.
 * @param config - resolved plugin config (schema defaults applied by the loader).
 */
export declare function apply(ctx: Context, config?: Config): void;
