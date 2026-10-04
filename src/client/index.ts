import { PEEK_HEAD_SRC } from './avatar.ts'
import { mountDeskpet, type DeskpetController } from './deskpet/view/overlay.ts'
import { loadSettings, saveSettings } from './deskpet/environment/settings.ts'
import type { DeskpetAnchor } from './deskpet/types.ts'

type SlotsService = {
  inject(name: string, callback: () => unknown): (() => void) | void
  register(options: unknown, component?: unknown): () => void
}

type ClientContext = {
  slots: SlotsService
  effect?: (fn: () => (() => void) | void, name?: string) => void
}

type WhaleMemory = { currentFocus?: string; progressLog?: Array<{ text: string; kind: 'progress' | 'todo' }> }
type ChatReply = { text?: string; thought?: string; memory?: WhaleMemory }

export const inject = ['slots']

const API = '/api/dsh-dafeiyu'
const COMPOSER_CARD = '[data-composer-card]'
const COMPOSER_INPUT = `${COMPOSER_CARD} textarea`
const DOCK_INPUT = '[data-dfy-dock-input]'

const styles = `
[data-dsh-dafeiyu-entry]{--dfy-base:var(--dsw-specific-sidebar-fill,#19191b);--dfy-surface:var(--dsw-alias-bg-layer-2,#222225);--dfy-line:var(--dsw-alias-border-l2,rgba(255,255,255,.11));--dfy-text:var(--dsw-alias-label-primary,#f2f2f3);--dfy-faint:var(--dsw-alias-label-tertiary,#777980);--dfy-accent:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#5e9cff);position:relative;display:block;width:100%;height:66px;box-sizing:border-box;padding:0 9px;border:0;background:transparent;color:inherit;font:inherit;text-align:left}
.dfy-dock{position:absolute;inset:13px 9px 4px;display:flex;align-items:center;min-width:0;padding:0 7px 0 50px;border:1px solid var(--dfy-line);border-radius:10px;background:color-mix(in srgb,var(--dfy-surface) 58%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 8px 22px rgba(0,0,0,.2);transition:background .18s,border-color .18s;backdrop-filter:blur(13px) saturate(108%)}
.dfy-dock::before{position:absolute;top:0;bottom:0;left:49px;width:1px;background:color-mix(in srgb,var(--dfy-line) 70%,transparent);content:""}
[data-dsh-dafeiyu-entry]:focus-within .dfy-dock,[data-dsh-dafeiyu-entry]:hover .dfy-dock{background:color-mix(in srgb,var(--dfy-surface) 70%,transparent);border-color:color-mix(in srgb,var(--dfy-line) 70%,var(--dfy-accent))}
.dfy-peek{position:absolute;z-index:3;top:8px;left:14px;width:40px;height:43px;overflow:hidden;border:1px solid color-mix(in srgb,var(--dfy-line) 70%,#fff);border-radius:13px 13px 10px 10px;background:#d9d4c8;box-shadow:0 4px 10px rgba(0,0,0,.18);transition:transform .2s ease}
.dfy-peek img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.14) translateY(4px)}
[data-dsh-dafeiyu-entry]:hover .dfy-peek{transform:translateY(-2px)}
.dfy-dock-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px;padding-left:7px}.dfy-dock-copy strong{overflow:hidden;color:var(--dfy-text);font-size:10px;font-weight:650;letter-spacing:.04em;line-height:14px;white-space:nowrap;text-overflow:ellipsis}
.dfy-dock-input{display:block;width:100%;height:21px;min-height:21px;max-height:38px;resize:none;overflow-y:auto;padding:0;border:0;outline:0;background:transparent;color:var(--dfy-text);font-family:system-ui,"Microsoft YaHei",sans-serif;font-size:13px;font-weight:450;line-height:21px}.dfy-dock-input::placeholder{color:var(--dfy-faint);opacity:.88}.dfy-dock-input:focus::placeholder{opacity:.48}
.dfy-dock-key{display:grid;width:28px;height:28px;flex:0 0 auto;margin-left:7px;place-items:center;border:1px solid color-mix(in srgb,var(--dfy-accent) 32%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dfy-accent) 8%,transparent);color:var(--dfy-accent);cursor:pointer;line-height:1}.dfy-dock-key svg{display:block;width:15px;height:15px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.8}.dfy-dock-key:hover{background:color-mix(in srgb,var(--dfy-accent) 18%,transparent)}
.dfy-settings{position:absolute;right:9px;bottom:68px;z-index:10;width:214px;padding:12px;border:1px solid var(--dfy-line);border-radius:9px;background:var(--dfy-surface);box-shadow:0 10px 30px rgba(0,0,0,.3);color:var(--dfy-text);font-size:11px}.dfy-settings[hidden]{display:none}.dfy-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;color:var(--dfy-text);font-size:12px;font-weight:600}.dfy-settings-close{width:22px;height:22px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dfy-faint);cursor:pointer;font-size:15px;line-height:1}.dfy-settings-close:hover{background:rgba(255,255,255,.08);color:var(--dfy-text)}.dfy-settings-row{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--dfy-faint)}.dfy-settings-row input{accent-color:var(--dfy-accent)}.dfy-settings-section{margin-top:12px;padding-top:10px;border-top:1px solid var(--dfy-line)}.dfy-settings-label{display:block;margin-bottom:7px;color:var(--dfy-faint)}.dfy-settings-option{display:flex;align-items:center;gap:7px;margin-top:6px;color:var(--dfy-text);cursor:pointer}.dfy-settings-option input{margin:0}
`

function postJson<T>(path: string, payload: Record<string, unknown>): Promise<T | null> {
  return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    .then((response) => response.json() as Promise<T>)
    .catch(() => null)
}

function sidebarRoot(): HTMLElement | undefined {
  const column = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]')
  if (!column) return undefined
  const logoRow = column.querySelector<HTMLElement>('[class*="logoRow"]')
  return (logoRow?.parentElement || column.firstElementChild || undefined) as HTMLElement | undefined
}

function placeEntry(root: HTMLElement, entry: HTMLElement): void {
  if (entry.parentElement === root) return
  root.insertBefore(entry, root.querySelector<HTMLElement>('[class*="footArea"]') ?? null)
}

function isComposerInput(target: EventTarget | null): target is HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement && target.matches(COMPOSER_INPUT)
}

function isDockInput(target: EventTarget | null): target is HTMLTextAreaElement {
  return target instanceof HTMLTextAreaElement && target.matches(DOCK_INPUT)
}

function composerText(card: Element | null): string {
  return card?.querySelector<HTMLTextAreaElement>('textarea')?.value.trim() ?? ''
}

function isComposerSend(target: EventTarget | null): boolean {
  const button = target instanceof Element ? target.closest<HTMLButtonElement>('button[aria-label]') : null
  if (!button || !button.closest(COMPOSER_CARD)) return false
  return /^(发送|send|提交|submit)$/i.test(button.getAttribute('aria-label')?.trim() ?? '')
}

function buildUi(): { dispose(): void } {
  const style = document.createElement('style')
  style.setAttribute('data-dsh-dafeiyu-styles', '')
  style.textContent = styles
  document.head.appendChild(style)

  const entry = document.createElement('div')
  entry.setAttribute('data-dsh-dafeiyu-entry', '')
  entry.setAttribute('role', 'region')
  entry.setAttribute('aria-label', '大肥鱼')
  entry.title = '大肥鱼'
  entry.innerHTML = `<span class="dfy-peek" aria-hidden="true"><img src="${PEEK_HEAD_SRC}" alt="" /></span><span class="dfy-dock"><span class="dfy-dock-copy"><strong>大肥鱼</strong><textarea data-dfy-dock-input class="dfy-dock-input" rows="1" maxlength="4000" placeholder="和大肥鱼说话…" aria-label="和大肥鱼说话"></textarea></span><button class="dfy-dock-key" type="button" data-dfy-settings-toggle aria-label="大肥鱼设置" title="设置"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.15.08a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.73v.18a2 2 0 0 1-1 1.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.15.08a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.73v-.18a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></button></span><div class="dfy-settings" data-dfy-settings hidden><div class="dfy-settings-head"><span>大肥鱼设置</span><button class="dfy-settings-close" type="button" data-dfy-settings-close aria-label="关闭设置">×</button></div><label class="dfy-settings-row"><span>显示桌宠</span><input type="checkbox" data-dfy-setting-enabled /></label><label class="dfy-settings-row"><span>主输入框同步鲸鱼娘</span><input type="checkbox" data-dfy-setting-sync /></label><div class="dfy-settings-section"><span class="dfy-settings-label">桌宠位置</span><label class="dfy-settings-option"><input type="radio" name="dfy-deskpet-anchor" value="composer" data-dfy-setting-anchor />主输入框上方</label><label class="dfy-settings-option"><input type="radio" name="dfy-deskpet-anchor" value="dock" data-dfy-setting-anchor />左侧栏输入框上方</label></div></div>`
  const settings = entry.querySelector<HTMLElement>('[data-dfy-settings]')!
  const settingsToggle = entry.querySelector<HTMLButtonElement>('[data-dfy-settings-toggle]')!
  const settingsClose = entry.querySelector<HTMLButtonElement>('[data-dfy-settings-close]')!
  const enabledInput = entry.querySelector<HTMLInputElement>('[data-dfy-setting-enabled]')!
  const anchorInputs = Array.from(entry.querySelectorAll<HTMLInputElement>('[data-dfy-setting-anchor]'))
  // 只使用旧版人物（用户决定）：不再提供人物切换开关，固定 legacy 变体。
  const deskpet = mountDeskpet(entry, 'legacy')
  const syncInput = entry.querySelector<HTMLInputElement>('[data-dfy-setting-sync]')!
  let syncWithWhale = true
  let disposed = false
  let lastSubmission: { text: string; at: number } | undefined
  let queuedTurn = Promise.resolve()
  void loadSettings().then((settingsValue) => {
    if (disposed) return
    deskpet.setAnchor(settingsValue.anchor)
    syncWithWhale = settingsValue.syncWithWhale
  })

  const showReply = (text: string, userText: string, startedAt: number, thought?: string): void => {
    deskpet.showReply({ text, userText, startedAt, thought })
  }

  const requestChat = (text: string, startedAt: number): void => {
    queuedTurn = queuedTurn
      .catch(() => undefined)
      .then(async () => {
        if (disposed) return
        deskpet.emit({ type: 'reply-start' })
        const response = await postJson<{ ok: boolean; value?: ChatReply }>(`${API}/chat`, { text })
        if (disposed) return
        if (response?.ok && response.value?.text) {
          deskpet.emit({ type: 'reply-done' })
          showReply(response.value.text, text, startedAt, response.value.thought)
          return
        }
        deskpet.emit({ type: 'reply-error' })
        showReply('呜…本鱼刚才没接住这句话。你再叫我一次嘛。', text, startedAt)
      })
  }

  const submit = (raw: string): void => {
    const text = raw.trim()
    const now = Date.now()
    if (!text || (lastSubmission?.text === text && now - lastSubmission.at < 700)) return
    lastSubmission = { text, at: now }
    deskpet.emit({ type: 'message-sent', textLength: text.length })
    if (syncWithWhale) requestChat(text, now)
  }

  const greet = (): void => {
    const startedAt = Date.now()
    postJson<{ ok: boolean; value?: { greeting?: string } }>(`${API}/bootstrap`, {}).then((response) => {
      if (disposed) return
      showReply(response?.ok ? response.value?.greeting || '本鱼在呢，杂鱼。' : '本鱼在呢，杂鱼。', '你点了点大肥鱼', startedAt)
    })
  }

  const onInput = (event: Event): void => {
    if (isDockInput(event.target)) {
      const text = event.target.value.trim()
      deskpet.emit(text ? { type: 'typing-start', textLength: text.length } : { type: 'typing-stop' })
      return
    }
    if (!isComposerInput(event.target)) return
    const text = event.target.value.trim()
    deskpet.emit(text ? { type: 'typing-start', textLength: text.length } : { type: 'typing-stop' })
  }
  const onKeyDown = (event: KeyboardEvent): void => {
    if (isDockInput(event.target) && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault()
      const text = event.target.value
      event.target.value = ''
      deskpet.emit({ type: 'typing-stop' })
      submit(text)
      return
    }
    if (!isComposerInput(event.target) || event.key !== 'Enter' || event.shiftKey || event.isComposing) return
    submit(event.target.value)
  }
  const onClick = (event: MouseEvent): void => {
    if (!isComposerSend(event.target)) return
    submit(composerText((event.target as Element).closest(COMPOSER_CARD)))
  }
  const onNewSessionClick = (event: MouseEvent): void => {
    const button = event.target instanceof Element
      ? event.target.closest<HTMLElement>('button[aria-label="新建会话"], button[aria-label^="在“"], button[aria-label*="新建会话"]')
      : null
    if (!button) return
    const startedAt = Date.now()
    deskpet.emit({ type: 'new-session' })
    postJson<{ ok: boolean; value?: { text?: string } }>(`${API}/new-session-tip`, {}).then((response) => {
      if (disposed) return
      showReply(response?.ok ? response.value?.text || '诶，新建会话啦？慢慢来。' : '诶，新建会话啦？慢慢来。', '你新建了会话', startedAt)
    })
  }

  const onSettingsToggle = (): void => {
    settings.hidden = !settings.hidden
    if (!settings.hidden) {
      void loadSettings().then((settingsValue) => {
        if (disposed) return
        enabledInput.checked = settingsValue.enabled
        syncInput.checked = settingsValue.syncWithWhale
        anchorInputs.forEach((input) => { input.checked = input.value === settingsValue.anchor })
      })
    }
  }
  const onSettingsClose = (): void => { settings.hidden = true }
  const onEnabledChange = (): void => {
    const enabled = enabledInput.checked
    deskpet.setEnabled(enabled)
    void saveSettings({ enabled })
  }
  const onAnchorChange = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value
    if (value !== 'composer' && value !== 'dock') return
    const anchor = value as DeskpetAnchor
    deskpet.setAnchor(anchor)
    void saveSettings({ anchor })
  }
  const onSyncChange = (): void => {
    syncWithWhale = syncInput.checked
    void saveSettings({ syncWithWhale })
  }
  const onEntryClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('textarea,button,[data-dfy-settings]')) return
    greet()
  }

  entry.addEventListener('click', onEntryClick)
  settingsToggle.addEventListener('click', onSettingsToggle)
  settingsClose.addEventListener('click', onSettingsClose)
  enabledInput.addEventListener('change', onEnabledChange)
  syncInput.addEventListener('change', onSyncChange)
  anchorInputs.forEach((input) => input.addEventListener('change', onAnchorChange))
  document.addEventListener('input', onInput, true)
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('click', onClick, true)
  document.addEventListener('click', onNewSessionClick, true)
  const tryPlace = (): void => {
    const root = sidebarRoot()
    if (root && !root.contains(entry)) placeEntry(root, entry)
  }
  const observer = new MutationObserver(tryPlace)
  observer.observe(document.body, { childList: true, subtree: true })
  tryPlace()

  return {
    dispose(): void {
      disposed = true
      entry.removeEventListener('click', onEntryClick)
      settingsToggle.removeEventListener('click', onSettingsToggle)
      settingsClose.removeEventListener('click', onSettingsClose)
      enabledInput.removeEventListener('change', onEnabledChange)
      syncInput.removeEventListener('change', onSyncChange)
      anchorInputs.forEach((input) => input.removeEventListener('change', onAnchorChange))
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('click', onNewSessionClick, true)
      observer.disconnect()
      deskpet.dispose()
      style.remove()
      entry.remove()
    },
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect?.(() => {
    try {
      return buildUi().dispose
    } catch (error) {
      console.warn('[dsh-dafeiyu] ui mount failed:', error)
      return undefined
    }
  }, '@dsh-external/dsh-dafeiyu-chan: mount')

  ctx.effect?.(() => {
    try {
      return ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action',
        id: '@dsh-external/dsh-dafeiyu-chan-sidebar',
        label: () => '大肥鱼',
        component: () => ({ render() { return null } }),
      }))
    } catch (error) {
      console.warn('[dsh-dafeiyu] slot register failed:', error)
      return undefined
    }
  }, '@dsh-external/dsh-dafeiyu-chan: slot')
}

export type { ClientContext, DeskpetController }
