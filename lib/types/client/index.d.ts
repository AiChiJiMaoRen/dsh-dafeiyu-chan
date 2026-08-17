import type { SlotsService } from '@deepseek-ai/dsh-client-ui-slots';
type ClientContext = {
    slots: SlotsService;
    effect?: (fn: () => (() => void) | void, name?: string) => void;
};
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
export type { ClientContext };
