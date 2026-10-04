/**
 * 桌宠（DeskPet）host 半端：给 client 提供记忆快照 + 桌宠开关持久化。
 *
 * 职责（对应规格 §5.0 environment / §5.5 / §5.7）：
 * - 记忆快照：从 `~/.dsh/whale-memory.json` 读出 deskpet 需要的
 *   { progressLog, currentFocus, mood } 子集，供桌宠记忆相关能力读取，
 *   零新增读取（与 0.0.1 共用 loadMemory，不重复实现）。
 * - 开关持久化：桌宠「放到桌面上」开关状态存入
 *   `~/.dsh/dafeiyu-deskpet-settings.json`，跨刷新/跨浏览器保留。
 *
 * 纯 Node fs，无其他 dsh 依赖——与 host/memory.ts 一样可独立编译。
 * @module dsh-dafeiyu/host/deskpet
 */
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver';
/** 桌宠开关（schema 版本化，便于后续加字段迁移）。 */
export interface DeskpetSettings {
    schema: number;
    /** 桌宠「放到桌面上」是否开启。 */
    enabled: boolean;
    /** 桌宠所跟随的输入框：主输入框或左侧栏 dock。 */
    anchor: 'composer' | 'dock';
    /** 当前人物或旧版人物资源。 */
    characterVariant: 'current' | 'legacy';
    /** 是否把主输入框/dock 的发送同步给鲸鱼娘对话。 */
    syncWithWhale: boolean;
}
/** 桌宠记忆能力要读的子集（client 见 src/client/deskpet/types.ts MemorySnapshot）。 */
export interface DeskpetMemorySnapshot {
    progressLog: Array<{
        text?: string;
        kind?: 'progress' | 'todo';
    }>;
    currentFocus?: string;
    mood?: 'blah' | 'okay' | 'up';
}
/** Route handler 依赖。 */
export interface DeskpetServiceDeps {
    service: DeskpetService;
}
/** 路由暴露的 service 面。 */
export interface DeskpetService {
    /** 记忆快照（不写，只读）。 */
    memory(): Promise<DeskpetMemorySnapshot>;
    getSettings(): Promise<DeskpetSettings>;
    /** 局部更新开关（enabled 缺省则不改）。 */
    setSettings(partial: {
        enabled?: boolean;
        anchor?: 'composer' | 'dock';
        characterVariant?: 'current' | 'legacy';
        syncWithWhale?: boolean;
    }): Promise<DeskpetSettings>;
}
/** 桌宠开关配置文件路径（与 whale-memory 分开，互不污染）。 */
export declare function deskpetSettingsPath(): string;
/** 用户桌宠资产落地区：~/.dsh/dsh-dafeiyu/deskpet-assets（管线/脚本可直接写入）。 */
export declare function deskpetAssetsDir(): string;
/** 首次 / 损坏时的默认：关闭（保持 0.0.1 原行为，不擅自塞桌宠）。 */
export declare function defaultDeskpetSettings(): DeskpetSettings;
/** 读取开关（容错：缺失/损坏回落默认，绝不抛）。 */
export declare function loadDeskpetSettings(file?: string): Promise<DeskpetSettings>;
/** 持久化开关（原子式：写 tmp 再覆盖）。 */
export declare function saveDeskpetSettings(settings: DeskpetSettings, file?: string): Promise<void>;
/**
 * 读 whale 记忆并挑出 deskpet 需要的子集（永远不抛，失败回落空快照）。
 * 复用 0.0.1 的 loadMemory —— 单一数据源，不重复实现读取。
 */
export declare function readDeskpetMemory(): Promise<DeskpetMemorySnapshot>;
/** 组装 service（与 createDafeiyuService 同级，供 apply 注入 routes）。 */
export declare function createDeskpetService(): DeskpetService;
/**
 * 桌宠路由族：
 * - GET/PUT {prefix}/settings       → 桌宠开关持久化（{ settings }）
 * - GET/HEAD {prefix}/assets/<file> → 桌宠媒体资产静态服务（视频/精灵表/元数据）
 * 记忆快照复用 /api/dsh-dafeiyu/memory（已裹 `{ memory }` 形状），不在本族重复。
 */
export declare function makeDeskpetRoutes(deps: DeskpetServiceDeps): WebRoute[];
