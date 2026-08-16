import type { SlotsService } from '@deepseek-ai/dsh-client-ui-slots'
import { PEEK_HEAD_SRC } from './avatar'

type ClientContext = {
  slots: SlotsService
  effect?: (fn: () => (() => void) | void, name?: string) => void
}

type MemoryEntry = { text: string; kind: 'progress' | 'todo' }
type WhaleMemory = { currentFocus?: string; progressLog?: MemoryEntry[] }
type UiState = { open: boolean; greeted: boolean; persistent: boolean; loading: boolean; memory?: WhaleMemory }

export const inject = ['slots']

const API = '/api/dsh-dafeiyu'

/** 鲸鱼娘主动消息展示后自动收起对话框的延迟（差不多够读完的时长；常驻后不生效）。 */
const AUTO_CLOSE_MS = 8000

const styles = `
[data-dsh-dafeiyu-entry],.dfy-panel{--dfy-base:var(--dsw-specific-sidebar-fill,#19191b);--dfy-surface:var(--dsw-alias-bg-layer-2,#222225);--dfy-line:var(--dsw-alias-border-l2,rgba(255,255,255,.11));--dfy-text:var(--dsw-alias-label-primary,#f2f2f3);--dfy-muted:var(--dsw-alias-label-secondary,#a3a4aa);--dfy-faint:var(--dsw-alias-label-tertiary,#777980);--dfy-accent:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#5e9cff)}
[data-dsh-dafeiyu-entry]{position:relative;display:block;width:100%;height:66px;box-sizing:border-box;padding:0 9px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}
.dfy-dock{position:absolute;inset:17px 9px 4px;display:flex;align-items:center;min-width:0;padding:0 11px 0 54px;border:1px solid var(--dfy-line);border-radius:10px;background:color-mix(in srgb,var(--dfy-surface) 78%,transparent);transition:background .18s,border-color .18s,border-radius .18s}.dfy-dock::before{position:absolute;top:0;bottom:0;left:54px;width:1px;background:color-mix(in srgb,var(--dfy-line) 70%,transparent);content:""}
[data-dsh-dafeiyu-entry]:hover .dfy-dock{background:var(--dfy-surface);border-color:color-mix(in srgb,var(--dfy-line) 70%,var(--dfy-accent))}[data-dsh-dafeiyu-entry][data-open] .dfy-dock{border-top-color:transparent;border-radius:0 0 10px 10px;background:var(--dfy-base)}
.dfy-peek{position:absolute;z-index:3;top:3px;left:15px;width:47px;height:51px;overflow:hidden;border:1px solid color-mix(in srgb,var(--dfy-line) 70%,#fff);border-radius:16px 16px 11px 11px;background:#d9d4c8;box-shadow:0 4px 10px rgba(0,0,0,.18);transition:transform .2s ease,opacity .16s}.dfy-peek img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.14) translateY(4px)}[data-dsh-dafeiyu-entry]:hover .dfy-peek{transform:translateY(-2px)}[data-dsh-dafeiyu-entry][data-open] .dfy-peek{opacity:.64;transform:translateY(3px) scale(.92)}
.dfy-dock-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:2px;padding-left:7px}.dfy-dock-copy strong{overflow:hidden;color:var(--dfy-text);font-size:11px;font-weight:600;line-height:1;white-space:nowrap;text-overflow:ellipsis}.dfy-dock-copy span{overflow:hidden;color:var(--dfy-faint);font-size:10px;line-height:1;white-space:nowrap;text-overflow:ellipsis}.dfy-dock-key{display:grid;width:20px;height:20px;flex:0 0 auto;margin-left:8px;place-items:center;border:1px solid color-mix(in srgb,var(--dfy-accent) 34%,transparent);border-radius:7px;background:color-mix(in srgb,var(--dfy-accent) 12%,transparent);color:var(--dfy-accent);font-size:11px;line-height:1;transition:background .16s,border-color .16s}[data-dsh-dafeiyu-entry]:hover .dfy-dock-key{border-color:color-mix(in srgb,var(--dfy-accent) 62%,transparent);background:color-mix(in srgb,var(--dfy-accent) 22%,transparent)}
.dfy-panel{position:fixed;z-index:10000;display:flex;flex-direction:column;box-sizing:border-box;min-height:270px;max-height:min(540px,calc(100vh - 105px));overflow:hidden;border:1px solid var(--dfy-line);border-bottom:0;border-radius:12px 12px 0 0;background:var(--dfy-base);box-shadow:0 -12px 28px rgba(0,0,0,.09);opacity:0;pointer-events:none;transform:translateY(7px);transform-origin:left bottom;transition:opacity .16s,transform .18s ease,visibility .18s;visibility:hidden}.dfy-panel[data-open]{opacity:1;pointer-events:auto;transform:translateY(0);visibility:visible}
.dfy-head{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding:12px 13px 11px;border-bottom:1px solid var(--dfy-line)}.dfy-portrait{width:44px;height:48px;overflow:hidden;flex:0 0 auto;border-radius:13px 13px 9px 9px;background:#d9d4c8}.dfy-portrait img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.16) translateY(4px)}.dfy-title{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.dfy-title strong{color:var(--dfy-text);font-size:13px;font-weight:620;line-height:1}.dfy-title span{color:var(--dfy-muted);font-size:10px;line-height:1}.dfy-close{display:grid;width:24px;height:24px;padding:0;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--dfy-faint);cursor:pointer}.dfy-close:hover{background:var(--dfy-surface);color:var(--dfy-text)}
.dfy-memory{margin:0 13px;padding:9px 0;border-bottom:1px solid color-mix(in srgb,var(--dfy-line) 72%,transparent);color:var(--dfy-muted);font-size:11px;line-height:1.5}.dfy-memory[hidden]{display:none}.dfy-memory-label{margin-right:5px;color:var(--dfy-accent)}
.dfy-notes{display:flex;flex:1 1 auto;flex-direction:column;gap:13px;min-height:102px;padding:14px 13px 10px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--dfy-line) 88%,transparent) transparent}.dfy-empty{margin:auto 0;color:var(--dfy-faint);font-size:11px;line-height:1.6;text-align:center}.dfy-message{max-width:100%;animation:dfy-in .18s ease both}.dfy-message[data-role="whale"]{padding-left:10px;border-left:1px solid color-mix(in srgb,var(--dfy-accent) 68%,transparent)}.dfy-message[data-role="user"]{align-self:flex-end;max-width:88%;text-align:right}.dfy-message-meta{margin-bottom:4px;color:var(--dfy-faint);font-size:10px;line-height:1}.dfy-message-copy{color:var(--dfy-text);font-size:12px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}.dfy-message[data-role="user"] .dfy-message-copy{color:color-mix(in srgb,var(--dfy-text) 88%,var(--dfy-accent))}.dfy-sticker{display:block;max-width:148px;max-height:148px;margin-top:6px;border-radius:10px;border:1px solid color-mix(in srgb,var(--dfy-line) 78%,transparent);object-fit:contain;filter:saturate(.94) brightness(.98);box-shadow:0 2px 8px rgba(0,0,0,.16)}
.dfy-action-row{display:flex;flex:0 0 auto;padding:7px 13px 4px;border-top:1px solid var(--dfy-line)}.dfy-quick{display:inline-flex;align-items:center;gap:5px;padding:3px 0;border:0;background:transparent;color:var(--dfy-muted);font:inherit;font-size:11px;cursor:pointer}.dfy-quick:hover:not(:disabled){color:var(--dfy-text)}.dfy-quick:disabled{cursor:wait;opacity:.54}
.dfy-compose{display:flex;align-items:center;flex:0 0 auto;gap:7px;padding:7px 9px 9px;background:var(--dfy-base)}.dfy-input{display:block;min-width:0;flex:1;padding:8px 5px;border:0;outline:0;background:transparent;color:var(--dfy-text);font:inherit;font-size:12px;line-height:1.4}.dfy-input::placeholder{color:var(--dfy-faint)}.dfy-input:focus{color:var(--dfy-text)}.dfy-send{display:grid;width:30px;height:30px;flex:0 0 auto;padding:0;place-items:center;border:0;border-radius:8px;background:transparent;color:var(--dfy-accent);cursor:pointer}.dfy-send:hover:not(:disabled){background:color-mix(in srgb,var(--dfy-accent) 12%,transparent)}.dfy-send:disabled{cursor:wait;opacity:.45}
/* Translucent refinement: preserve the original dark DSH surface, then reveal its depth. */
.dfy-dock{background:color-mix(in srgb,var(--dfy-surface) 58%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 8px 22px rgba(0,0,0,.2);-webkit-backdrop-filter:blur(13px) saturate(108%);backdrop-filter:blur(13px) saturate(108%)}
[data-dsh-dafeiyu-entry]:hover .dfy-dock{background:color-mix(in srgb,var(--dfy-surface) 70%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 10px 26px rgba(0,0,0,.24)}[data-dsh-dafeiyu-entry][data-open] .dfy-dock{background:color-mix(in srgb,var(--dfy-base) 60%,transparent)}
.dfy-panel{background:color-mix(in srgb,var(--dfy-base) 62%,transparent);border-color:color-mix(in srgb,var(--dfy-line) 86%,rgba(255,255,255,.12));box-shadow:inset 0 1px 0 rgba(255,255,255,.075),0 -14px 34px rgba(0,0,0,.24);-webkit-backdrop-filter:blur(18px) saturate(108%);backdrop-filter:blur(18px) saturate(108%)}
.dfy-head{background:rgba(255,255,255,.018)}.dfy-action-row{background:rgba(0,0,0,.035)}.dfy-compose{background:rgba(0,0,0,.035)}.dfy-input{background:rgba(255,255,255,.025);border-radius:8px}.dfy-input:focus{background:rgba(255,255,255,.04)}.dfy-send{background:rgba(255,255,255,.035);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
@keyframes dfy-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.dfy-panel,.dfy-peek,.dfy-dock{transition:none}.dfy-message{animation:none}}
`

function postJson<T>(path: string, payload: Record<string, unknown>): Promise<T | null> {
  return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload ?? {}) })
    .then((response) => response.json())
    .catch(() => null)
}

function sidebarRoot(): HTMLElement | undefined {
  const column = document.querySelector<HTMLElement>('[data-pane="sidebar"], [class*="sidebarCol"]')
  if (!column) return undefined
  // 侧栏列根：logoRow 的父级就是整列。logoRow 在当前 shell 位于**顶部**（品牌+折叠键），
  // 底部区域是 footArea；定位必须用底部锚点，否则面板的 bottom 偏移计算会把面板顶到左上角。
  const logoRow = column.querySelector<HTMLElement>('[class*="logoRow"]')
  return (logoRow?.parentElement || column.firstElementChild || undefined) as HTMLElement | undefined
}

/**
 * 把鱼条插到导航列**最底部、设置区上方**：当前 shell 的底部区域类名含 `footArea`
 * （CSS-module 词根稳定，hash 前缀可变化），鱼条插在它**之前**（= 工作区列表之下、设置之上）；
 * 放在 footArea 之后会跑到「设置」下面显得太贴底。找不到时直接 append 根末尾兜底。
 */
function placeEntry(root: HTMLElement, entry: HTMLElement): void {
  if (entry.parentElement === root) return
  const foot = root.querySelector<HTMLElement>('[class*="footArea"]')
  root.insertBefore(entry, foot ?? null)
}

function icon(name: 'sparkle' | 'send' | 'close'): string {
  const icons = {
    sparkle: '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"><path d="M8 1.8c.45 3.78 1.92 5.95 5.5 6.2-3.58.25-5.05 2.42-5.5 6.2C7.55 10.42 6.08 8.25 2.5 8 6.08 7.75 7.55 5.58 8 1.8Z"/></svg>',
    send: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2.2 7.6 11.2-4.5-4.5 11.2-1.6-4.1-5.1-2.6Z"/><path d="m7.3 10.2 2.4-2.4"/></svg>',
    close: '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="m4 4 8 8M12 4l-8 8"/></svg>',
  }
  return icons[name]
}

function buildUi(state: UiState): { dispose(): void } {
  const style = document.createElement('style')
  style.setAttribute('data-dsh-dafeiyu-styles', '')
  style.textContent = styles
  document.head.appendChild(style)

  const entry = document.createElement('button')
  entry.type = 'button'
  entry.setAttribute('data-dsh-dafeiyu-entry', '')
  entry.setAttribute('aria-label', '和大肥鱼聊天')
  entry.title = '大肥鱼 · 想说点什么？'
  entry.innerHTML = `<span class="dfy-peek" aria-hidden="true"><img src="${PEEK_HEAD_SRC}" alt="" /></span><span class="dfy-dock"><span class="dfy-dock-copy"><strong>大肥鱼</strong><span data-dfy-dock-copy>想和我说什么？</span></span><span class="dfy-dock-key" aria-hidden="true">→</span></span>`

  const panel = document.createElement('section')
  panel.className = 'dfy-panel'
  panel.setAttribute('aria-label', '大肥鱼私密便签')
  panel.innerHTML = `<header class="dfy-head"><span class="dfy-portrait" aria-hidden="true"><img src="${PEEK_HEAD_SRC}" alt="" /></span><span class="dfy-title"><strong>大肥鱼</strong><span>你的小看板娘</span></span><button class="dfy-close" type="button" aria-label="收起大肥鱼">${icon('close')}</button></header><div class="dfy-memory" hidden></div><div class="dfy-notes" role="log" aria-live="polite"><p class="dfy-empty">今天也可以从一句碎碎念开始。</p></div><div class="dfy-action-row"><button class="dfy-quick" type="button" title="让我看看工作区和草稿，给你几个下一步的点子">${icon('sparkle')} 给我个点子</button></div><div class="dfy-compose"><textarea class="dfy-input" rows="1" placeholder="想和大肥鱼说什么？" aria-label="给大肥鱼的消息"></textarea><button class="dfy-send" type="button" aria-label="发送消息">${icon('send')}</button></div>`

  const close = panel.querySelector<HTMLButtonElement>('.dfy-close')!
  const notes = panel.querySelector<HTMLElement>('.dfy-notes')!
  const memory = panel.querySelector<HTMLElement>('.dfy-memory')!
  const ideas = panel.querySelector<HTMLButtonElement>('.dfy-quick')!
  const input = panel.querySelector<HTMLTextAreaElement>('.dfy-input')!
  const send = panel.querySelector<HTMLButtonElement>('.dfy-send')!
  const dockCopy = entry.querySelector<HTMLElement>('[data-dfy-dock-copy]')!

  const setBusy = (busy: boolean): void => { send.disabled = busy }
  const positionPanel = (): void => {
    if (!state.open || !entry.isConnected) return
    const rect = entry.getBoundingClientRect()
    // 元素未布局/不可见（left/top/width 全 0）时不定位——否则面板会跑到左上角。
    if (rect.width === 0 || rect.height === 0 || (rect.left === 0 && rect.top === 0)) return
    const left = Math.max(9, rect.left + 9)
    panel.style.left = `${left}px`
    panel.style.width = `${Math.max(160, Math.min(rect.width - 18, window.innerWidth - left - 8))}px`
    panel.style.bottom = `${Math.max(8, window.innerHeight - (rect.top + 17))}px`
  }
  const resizeInput = (): void => {
    input.style.height = 'auto'
    input.style.height = `${Math.min(input.scrollHeight, 72)}px`
  }
  const renderMemory = (): void => {
    const focus = state.memory?.currentFocus?.trim()
    const latest = state.memory?.progressLog?.[0]?.text?.trim()
    const note = focus || latest
    memory.hidden = !note
    if (!note) return
    memory.replaceChildren()
    const label = document.createElement('span')
    label.className = 'dfy-memory-label'
    label.textContent = focus ? '我记得：' : '上次你说：'
    memory.append(label, document.createTextNode(note))
  }
  // ── 主动消息自动收起：鲸鱼娘主动说的话（开场白/点子/护航提示）展示一会儿后，
  // 整个对话框自动收起（回到侧栏鱼标，跟点关闭一样）；用户发出第一条聊天消息后
  // 进入「常驻」——对话框不再自动收起。正在打字时不收（顺延）。
  let autoCloseTimer: number | undefined
  const armAutoClose = (): void => {
    if (state.persistent) return
    window.clearTimeout(autoCloseTimer)
    autoCloseTimer = window.setTimeout(() => {
      if (!state.open || state.persistent) return
      // 光标悬停在对话框上 → 顺延（移开后由 pointerleave 重新计时）
      if (panel.matches(':hover')) {
        armAutoClose()
        return
      }
      // 输入框有内容（正在打字）→ 顺延，别把用户的半句话收走。
      // 不用 activeElement 判断：open() 会自动聚焦输入框，会误判为「在打字」导致永不收起。
      if (input.value.trim() !== '') {
        armAutoClose()
        return
      }
      state.open = false
      render()
    }, AUTO_CLOSE_MS)
  }
  // 光标悬停 = 正在看：暂停倒计时；移开后再给完整时间重新计。
  panel.addEventListener('pointerenter', () => { window.clearTimeout(autoCloseTimer) })
  panel.addEventListener('pointerleave', () => { if (state.open && !state.persistent) armAutoClose() })
  const enterPersistent = (): void => {
    if (state.persistent) return
    state.persistent = true
    window.clearTimeout(autoCloseTimer)
  }
  const addMessage = (role: 'whale' | 'user', text: string): void => {
    notes.querySelector('.dfy-empty')?.remove()
    const message = document.createElement('article')
    message.className = 'dfy-message'
    message.dataset.role = role
    const meta = document.createElement('div')
    meta.className = 'dfy-message-meta'
    meta.textContent = role === 'whale' ? '大肥鱼' : '你'
    const copy = document.createElement('div')
    copy.className = 'dfy-message-copy'
    copy.textContent = text
    message.append(meta, copy)
    notes.appendChild(message)
    notes.scrollTop = notes.scrollHeight
  }
  // 表情：塞进上一条鲸鱼消息的同一气泡（文字+表情一起出现，不再单独成条）；
  // 没有可用气泡时才兜底建独立消息。URL 由 host 静态路由提供。
  const addSticker = (file: string): void => {
    const img = document.createElement('img')
    img.className = 'dfy-sticker'
    img.src = `${API}/stickers/${encodeURIComponent(file)}`
    img.alt = '表情'
    // 不设 loading="lazy"：面板打开前图片要已就绪（与文字一起出现），
    // lazy 可能推迟解码导致文字先出现、图片后补，看起来「不跟图」。
    const last = notes.lastElementChild
    if (last instanceof HTMLElement && last.classList.contains('dfy-message') && last.dataset.role === 'whale') {
      last.appendChild(img)
    } else {
      const wrap = document.createElement('article')
      wrap.className = 'dfy-message'
      wrap.dataset.role = 'whale'
      wrap.appendChild(img)
      notes.appendChild(wrap)
    }
    notes.scrollTop = notes.scrollHeight
  }
  const render = (focusInput = false): void => {
    entry.toggleAttribute('data-open', state.open)
    panel.toggleAttribute('data-open', state.open)
    dockCopy.textContent = state.open ? '在这里，慢慢说。' : '想和我说什么？'
    positionPanel()
    if (state.open && focusInput) window.setTimeout(() => input.focus(), 90)
  }
  const open = (focusInput = true): void => {
    // 首次打开：先生成开场白（文字+表情一起就绪），再打开对话框——
    // 面板不空开、图片打开前已加载好，计时也从内容上屏后才开始。
    if (state.loading) return
    if (state.greeted) {
      // 重新打开：内容已经在面板里，立即打开并开始自动收起计时
      state.open = true
      render(focusInput)
      armAutoClose()
      return
    }
    state.loading = true
    state.greeted = true
    setBusy(true)
    dockCopy.textContent = '正在冒泡泡…'
    postJson<{ ok: boolean; value?: { greeting?: string; memory?: WhaleMemory; sticker?: { file?: string }; stickers?: string[] } }>(`${API}/bootstrap`, {}).then((response) => {
      state.loading = false
      setBusy(false)
      if (response?.ok && response.value) {
        state.memory = response.value.memory
        renderMemory()
        addMessage('whale', response.value.greeting || '本鱼在啦。今天想聊点什么？')
        if (response.value.sticker?.file) addSticker(response.value.sticker.file)
        // 预加载全部表情：随机挑到哪张都是浏览器已缓存的，显示即瞬。
        const files = Array.isArray(response.value.stickers) ? response.value.stickers : []
        for (const file of files) {
          const pre = new Image()
          pre.src = `${API}/stickers/${encodeURIComponent(file)}`
        }
      } else {
        addMessage('whale', '本鱼在啦。今天想聊点什么？')
      }
      // 内容真正渲染后才打开 + 才开始自动收起计时
      state.open = true
      render(focusInput)
      armAutoClose()
      postJson<{ ok: boolean; value?: { isNewProject?: boolean } }>(`${API}/ideas`, {}).then((ideasResponse) => {
        if (ideasResponse?.ok && ideasResponse.value?.isNewProject) addMessage('whale', '诶，这里像是个新地盘。想要起步点子的话，点下面「给我个点子」就好。')
      })
    })
  }
  const fetchIdeas = (): void => {
    ideas.disabled = true
    ideas.innerHTML = `${icon('sparkle')} 正在翻小本本…`
    setBusy(true)
    postJson<{ ok: boolean; value?: { isNewProject?: boolean; ideas?: string[]; note?: string } }>(`${API}/ideas`, {}).then((response) => {
      ideas.disabled = false
      ideas.innerHTML = `${icon('sparkle')} 给我个点子`
      setBusy(false)
      if (!response?.ok || !response.value) return addMessage('whale', '呜…本鱼的脑瓜短路了一下，待会儿再叫我想想嘛。')
      const list = Array.isArray(response.value.ideas) ? response.value.ideas : []
      if (response.value.isNewProject) addMessage('whale', '诶，这里像是个新地盘。我先记下几个起步点子：')
      if (list.length === 0) return addMessage('whale', '本鱼暂时没翻到特别好的点子，等你多写一点再叫我。')
      for (const idea of list) addMessage('whale', String(idea))
      if (response.value.note) addMessage('whale', `（${response.value.note}）`)
    })
  }
  const sendTurn = (): void => {
    const text = input.value.trim()
    if (!text || send.disabled) return
    // 用户开口 → 常驻模式：对话框不再自动收起
    enterPersistent()
    addMessage('user', text)
    input.value = ''
    resizeInput()
    setBusy(true)
    postJson<{ ok: boolean; value?: { text?: string; memory?: WhaleMemory; sticker?: { file?: string; mood?: string } } }>(`${API}/chat`, { text }).then((response) => {
      setBusy(false)
      if (response?.ok && response.value) {
        state.memory = response.value.memory
        renderMemory()
        addMessage('whale', response.value.text || '唔，本鱼听着呢。')
        if (response.value.sticker?.file) addSticker(response.value.sticker.file)
      } else {
        addMessage('whale', '呜…本鱼现在连不上，稍后再和我说一次好不好？')
      }
    })
  }

  entry.addEventListener('click', () => { if (state.open) { state.open = false; render() } else open() })
  close.addEventListener('click', () => { state.open = false; render() })
  ideas.addEventListener('click', fetchIdeas)
  send.addEventListener('click', sendTurn)
  input.addEventListener('input', resizeInput)
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendTurn() } })
  window.addEventListener('resize', positionPanel)
  window.addEventListener('scroll', positionPanel, true)

  document.body.appendChild(panel)
  const tryPlace = (): void => {
    const root = sidebarRoot()
    if (root && !root.contains(entry)) placeEntry(root, entry)
    positionPanel()
  }
  const observer = new MutationObserver(tryPlace)
  observer.observe(document.body, { childList: true, subtree: true })
  tryPlace()
  render()

  const onNewSessionClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement | null
    const button = target?.closest<HTMLElement>('button[aria-label="新建会话"], button[aria-label^="在“"], button[aria-label*="新建会话"]')
    if (!button) return
    if (state.loading) return
    state.loading = true
    state.greeted = true
    setBusy(true)
    dockCopy.textContent = '正在冒泡泡…'
    postJson<{ ok: boolean; value?: { text?: string; sticker?: { file?: string } } }>(`${API}/new-session-tip`, {}).then((response) => {
      state.loading = false
      setBusy(false)
      // 提示生成完再打开（与开场白同策略：不空开、计时从内容上屏后开始）
      addMessage('whale', response?.ok ? response.value?.text || '诶，新建会话啦？想好要做什么了吗？' : '诶，新建会话啦？想好要做什么了吗？')
      // 提示也带表情（与文字同一气泡）
      if (response?.ok && response.value?.sticker?.file) addSticker(response.value.sticker.file)
      state.open = true
      render(false)
      armAutoClose()
    })
  }
  document.addEventListener('click', onNewSessionClick, true)

  return { dispose(): void {
    document.removeEventListener('click', onNewSessionClick, true)
    window.removeEventListener('resize', positionPanel)
    window.removeEventListener('scroll', positionPanel, true)
    observer.disconnect()
    style.remove()
    entry.remove()
    panel.remove()
  } }
}

export function apply(ctx: ClientContext): void {
  const state: UiState = { open: false, greeted: false, persistent: false, loading: false }
  ctx.effect?.(() => {
    try { return buildUi(state).dispose } catch (error) { console.warn('[dsh-dafeiyu] ui mount failed:', error); return undefined }
  }, '@dsh-external/dsh-dafeiyu-chan: mount')
  ctx.effect?.(() => {
    try {
      return ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
        name: 'sidebar.footer.action', id: '@dsh-external/dsh-dafeiyu-chan-sidebar', label: () => '大肥鱼', component: () => ({ render() { return null } }),
      }))
    } catch (error) { console.warn('[dsh-dafeiyu] slot register failed:', error); return undefined }
  }, '@dsh-external/dsh-dafeiyu-chan: slot')
}

export type { ClientContext }
