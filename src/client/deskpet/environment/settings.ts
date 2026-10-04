/**
 * 桌宠开关的 host 接线（client 端）：读/写后端 `GET/PUT /api/dsh-dafeiyu/deskpet/settings`。
 * 开关持久化保存在 `~/.dsh/dafeiyu-deskpet-settings.json`（见 host/deskpet.ts），
 * 跨刷新/跨浏览器保留；接口不可用时回退关闭（不擅自开桌宠）。
 *
 * 缓存：进程内记一次，避免反复 GET。（对应规格 §5.5/§5.7）
 * @module dsh-dafeiyu/client/deskpet/environment/settings
 */

import type { DeskpetAnchor } from '../types.ts'

export type CharacterVariant = 'current' | 'legacy'
export type DeskpetSettings = { enabled: boolean; anchor: DeskpetAnchor; characterVariant: CharacterVariant; syncWithWhale: boolean }

let cached: DeskpetSettings | undefined
let pending: Promise<DeskpetSettings> | undefined

/** 读当前开关：true=开。接口失败/未配置一律 false（保持 0.0.1 原行为）。 */
export function loadSettings(): Promise<DeskpetSettings> {
  if (cached !== undefined) return Promise.resolve(cached)
  if (pending) return pending
  pending = fetch('/api/dsh-dafeiyu/deskpet/settings', { method: 'GET' })
    .then((response) => response.json() as Promise<{ ok?: boolean; value?: { settings?: { enabled?: boolean; anchor?: string; characterVariant?: string; syncWithWhale?: boolean } } }>)
    .then((payload) => {
      const settings = payload.value?.settings
      cached = payload.ok === true ? {
        enabled: settings?.enabled === true,
        anchor: settings?.anchor === 'dock' ? 'dock' : 'composer',
        // 只使用旧版人物：不再接受 current，一律 legacy。
        characterVariant: 'legacy',
        syncWithWhale: settings?.syncWithWhale !== false,
      } : { enabled: false, anchor: 'composer', characterVariant: 'legacy', syncWithWhale: true }
      return cached
    })
    .catch(() => {
      cached = { enabled: false, anchor: 'composer', characterVariant: 'legacy', syncWithWhale: true }
      return cached
    })
    .finally(() => { pending = undefined })
  return pending as Promise<DeskpetSettings>
}

export function loadEnabled(): Promise<boolean> { return loadSettings().then((settings) => settings.enabled) }

/** 写入开关：true=开。返回是否写成功（网络失败返回 false，但不抛）。 */
export function saveSettings(partial: Partial<DeskpetSettings>): Promise<boolean> {
  cached = {
    ...(cached ?? { enabled: true, anchor: 'composer', characterVariant: 'legacy', syncWithWhale: true }),
    ...partial,
    anchor: partial.anchor === 'dock' ? 'dock' : (partial.anchor ?? cached?.anchor ?? 'composer'),
    characterVariant: 'legacy',
    syncWithWhale: partial.syncWithWhale ?? cached?.syncWithWhale ?? true,
  }
  return fetch('/api/dsh-dafeiyu/deskpet/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(partial),
  })
    .then((response) => response.json() as Promise<{ ok?: boolean }>)
    .then((payload) => payload.ok === true)
    .catch(() => false)
}

export function saveEnabled(enabled: boolean): Promise<boolean> { return saveSettings({ enabled }) }

/** 只使用旧版人物（保留导出以兼容旧调用点）。 */
export function preferredCharacterVariant(): CharacterVariant {
  return 'legacy'
}

/** 已无切换需求；保留为 no-op 以兼容旧调用点。 */
export function rememberCharacterVariant(_variant: CharacterVariant): void {
  try { window.localStorage.setItem('dafeiyu-character-variant', 'legacy') } catch { /* optional cache */ }
}
