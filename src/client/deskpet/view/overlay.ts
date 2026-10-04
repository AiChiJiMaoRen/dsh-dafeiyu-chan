import { behavior } from '../config/behavior.ts'
import { copy } from '../config/copy.ts'
import { watchDeskpetAnchors } from '../environment/anchors.ts'
import { loadStorage, saveStorage } from '../environment/storage.ts'
import { clampPosition, centerPosition, makeWorld } from '../core/world.ts'
import { stepFalling } from '../core/physics.ts'
import { transition } from '../core/stateMachine.ts'
import { createDeskpetEventBus, type DeskpetEvent } from '../core/events.ts'
import { createPerformanceDirector, type PerformanceDirector } from '../core/performance.ts'
import type { DeskpetAnchor, DeskpetPosition, DeskpetState, DeskpetWorld } from '../types.ts'
import { showBubble, type ConversationBubble } from './bubble.ts'
import { wait } from './fx.ts'
import { createSprite } from './sprite.ts'
import { createClipLayer, loadClipSpecs, watchClipAssetVersion, type ClipSpec } from './clips.ts'
import type { CharacterVariant } from '../environment/settings.ts'

export type DeskpetController = {
  setEnabled(enabled: boolean): void
  setAnchor(anchor: DeskpetAnchor): void
  isEnabled(): boolean
  emit(event: DeskpetEvent): void
  showReply(reply: { text: string; userText: string; startedAt: number; thought?: string }): void
  dispose(): void
}

type DeskpetGlobal = typeof globalThis & {
  __dafeiyuDeskpetController?: DeskpetController
}

const styles = `
.dafeiyu-deskpet{position:fixed;inset:0;overflow:visible;pointer-events:none;z-index:${behavior.display.zIndex};user-select:none}
.dafeiyu-deskpet-sprite{position:absolute;z-index:1;display:block;padding:0;border:0;background:transparent;color:#fff;cursor:grab;font:24px/1 system-ui,sans-serif;pointer-events:auto;touch-action:none;transition:opacity ${behavior.timing.transitionFade}ms ease,filter ${behavior.timing.transitionFade}ms ease}
.dafeiyu-deskpet-sprite:active{cursor:grabbing}
.dafeiyu-deskpet-sprite[data-atlas="ready"]{background:transparent;box-shadow:none}
.dafeiyu-deskpet-sprite[data-atlas="ready"] .dafeiyu-deskpet-canvas{filter:drop-shadow(0 3px 6px rgba(19,38,93,.36))}
.dafeiyu-deskpet-sprite[data-animation="cry"]{filter:saturate(.75) brightness(1.1)}
.dafeiyu-deskpet-bubbles{position:absolute;z-index:3;pointer-events:none}
.dafeiyu-deskpet-canvas{display:block;width:100%;height:100%;user-select:none;backface-visibility:hidden}
.dafeiyu-deskpet-bubble{position:absolute;box-sizing:border-box;width:fit-content;min-width:${behavior.bubble.minWidth}px;max-width:min(${behavior.bubble.maxWidth}px,calc(100vw - ${behavior.bubble.viewportPadding}px));padding:8px 11px;border:1px solid rgba(44,67,134,.28);border-radius:10px;background:#fff;color:#24356e;font:12px/1.45 system-ui,"Microsoft YaHei",sans-serif;overflow-wrap:anywhere;word-break:break-word;white-space:normal;box-shadow:0 3px 12px rgba(32,46,98,.18);pointer-events:none;transform:translate(-50%,-100%)}
.dafeiyu-deskpet-bubble::after{position:absolute;left:calc(50% + var(--dafeiyu-tail-offset, 0px));bottom:-6px;width:10px;height:10px;border-right:1px solid rgba(44,67,134,.28);border-bottom:1px solid rgba(44,67,134,.28);background:#fff;content:"";transform:translateX(-50%) rotate(45deg)}
.dafeiyu-deskpet-bubble.thought{border-style:dashed;background:rgba(255,255,255,.86);font-style:italic}
.dafeiyu-deskpet-bubble.thought::before{position:absolute;top:-9px;left:9px;color:#6b80c7;content:"思考中";font-size:10px;font-style:normal}
.dafeiyu-deskpet-conversation{padding:0;overflow:hidden}
.dafeiyu-deskpet-thought{padding:8px 11px 7px;background:rgba(31,45,73,.045);border-bottom:1px solid rgba(44,67,134,.13)}
.dafeiyu-deskpet-thought-label{color:#89909d;font-size:10px;line-height:1.35}
.dafeiyu-deskpet-thought-copy{margin-top:3px;color:#8a919e;font-size:11px;line-height:1.45}
.dafeiyu-deskpet-answer{padding:9px 11px 10px;color:#24356e;font-size:12px;line-height:1.55;white-space:pre-wrap}

`

export function mountDeskpet(entry: HTMLElement, characterVariant: CharacterVariant = 'legacy'): DeskpetController {
  // HMR/reload can call apply again without giving the old client instance a
  // chance to finish its timers. Dispose that instance first so old CSS
  // performances cannot keep rotating/dimming a second character underneath.
  const global = globalThis as DeskpetGlobal
  global.__dafeiyuDeskpetController?.dispose()
  // Also remove instances created by an older bundle, which did not publish a
  // controller on globalThis. Removing the old host/style makes hard reloads
  // and package HMR visually idempotent.
  document.querySelectorAll<HTMLElement>('.dafeiyu-deskpet').forEach((node) => node.remove())
  document.querySelectorAll<HTMLStyleElement>('style[data-dafeiyu-deskpet]').forEach((node) => node.remove())
  const style = document.createElement('style')
  style.dataset.dafeiyuDeskpet = 'true'
  style.textContent = styles
  document.head.appendChild(style)
  const host = document.createElement('div')
  host.className = 'dafeiyu-deskpet'
  host.setAttribute('aria-live', 'polite')
  const bubbleHost = document.createElement('div')
  bubbleHost.className = 'dafeiyu-deskpet-bubbles'
  const sprite = createSprite()
  host.append(sprite.root)
  // One visible canvas: idle and actions are painted into the same sprite.
  const clipLayer = createClipLayer(sprite.root)
  const eventBus = createDeskpetEventBus()
  clipLayer.onFrame = (clip, frame, total): void => {
    setDebug(`clips: ${clipSpecs.map(s => s.clip).join(' ')}\npick: ${clip} frame ${frame}/${total}`)
  }
  clipLayer.onDecode = (clip, ok, width, height): void => {
    logDebug(`decode: ${clip} ok=${ok} size=${width}x${height}`)
  }
  host.append(bubbleHost)
  // idle 是唯一的常驻身体；其余片段临时接管同一 canvas。
  let clipSpecs: ClipSpec[] = []
  let allClipSpecs: ClipSpec[] = []
  let idleSpec: ClipSpec | undefined
  let clipActive = false
  let idleRunning = false
  let idleStarting = false
  let stopAssetVersionWatch = (): void => undefined
  void loadClipSpecs(characterVariant).then((specs) => {
    idleSpec = specs.find((spec) => spec.clip === 'idle')
    allClipSpecs = specs
    // Every installed animated clip except the permanent idle loop and the
    // one-frame base fallback is eligible for ambient rotation. Previously
    // this list was hard-coded to jump + ice_dance, which made other clips
    // silently load into life.json but never play.
    const removedClips = new Set(['stretch', 'lanyao', 'feed'])
    clipSpecs = specs.filter((spec) => spec.clip !== 'idle' && spec.clip !== 'base' && !removedClips.has(spec.clip) && spec.frames > 1)
    // Preload the actions that can be selected by the ambient director. The
    // image loader is shared and reports decode dimensions, so the larger
    // 5120x4864 ice-dance sheet is handled without a second visual layer.
    const startupClips = [idleSpec, ...clipSpecs].filter((spec): spec is ClipSpec => Boolean(spec))
    clipLayer.preload(startupClips)
    logDebug(`mount: idle=${idleSpec?.clip ?? 'none'} actions=${clipSpecs.map(s => s.clip).join(',')} preload=${startupClips.map(s => s.clip).join(',')}`)
    setDebug(`idle: ${idleSpec?.clip ?? 'MISSING'}\nactions: ${clipSpecs.map(s => s.clip).join(' ') || 'NONE'}`)
    const assetVersion = specs[0]?.assetVersion
    if (assetVersion) {
      stopAssetVersionWatch = watchClipAssetVersion(assetVersion, (nextVersion) => {
        logDebug(`asset-version changed: ${assetVersion} -> ${nextVersion}; remounting`)
        window.location.reload()
      }, characterVariant)
    }
    startIdle()
    schedulePerf(5000)
  })
  document.body.appendChild(host)

  const storage = loadStorage()
  // 桌宠默认常驻显示，不提供用户侧收起开关，也不随面板开合销毁。
  let enabled = true
  let disposed = false

  let state: DeskpetState = 'idle'
  let world: DeskpetWorld | undefined
  let position: DeskpetPosition = { centerX: 0, footY: 0 }
  let fallingVelocity = 0
  let fallingFrame: number | undefined
  let fallingLastTime = 0
  let bubbleTimer: number | undefined
  let anchorMode: DeskpetAnchor = 'composer'
  let stopWatching: () => void = () => undefined
  let sleepTimer: number | undefined
  let perfTimer: number | undefined
  let bubbleCleanup: (() => void) | undefined
  let bubbleElement: HTMLElement | undefined
  let clickTimer: number | undefined
  let lastPointerUp = 0
  let pointerId: number | undefined
  let pointerOffsetX = 0
  let pointerOffsetFootY = 0
  let dragging = false
  let topMessageAt = 0
  let sequence = 0
  let nextClipIndex = 0
  let clipPriority = 0
  let performanceDirector: PerformanceDirector | undefined
  const recentThoughts: string[] = []
  // ── 调试角标：实时显示浏览器看到的片段清单 + 上次选中/播放状态──
  const debugBadge = document.createElement('div')
  debugBadge.className = 'dafeiyu-deskpet-debug'
  debugBadge.style.cssText = 'position:absolute;top:0;left:0;z-index:99;background:rgba(0,0,0,.7);color:#fff;font:11px/1.4 monospace;padding:2px 6px;border-radius:4px;pointer-events:none;white-space:pre'
  debugBadge.hidden = true
  host.appendChild(debugBadge)
  const setDebug = (text: string): void => { debugBadge.textContent = text }
  // 调试日志：写到宿主文件 ~/.dsh/dsh-dafeiyu/deskpet-debug.log（排查片段播放，读日志即知）。
  const logDebug = (message: string): void => {
    fetch('/api/dsh-dafeiyu/deskpet/debug-log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message }),
    }).catch(() => {})
  }
  const setState = (next: DeskpetState): void => {
    state = next
    sprite.root.dataset.state = next
  }
  const renderBubble = (): void => {
    if (!world || !bubbleElement?.isConnected) return
    const edgePadding = behavior.geometry.worldPadding
    const bubbleWidthLimit = Math.min(behavior.bubble.maxWidth, Math.max(behavior.bubble.minWidth, window.innerWidth - behavior.bubble.viewportPadding))
    bubbleElement.style.maxWidth = `${bubbleWidthLimit}px`
    const bubbleWidth = bubbleElement.getBoundingClientRect().width
    const minCenter = world.left + bubbleWidth / 2 + edgePadding
    const maxCenter = world.right - bubbleWidth / 2 - edgePadding
    const bubbleCenter = minCenter <= maxCenter
      ? Math.max(minCenter, Math.min(maxCenter, position.centerX))
      : (world.left + world.right) / 2
    bubbleHost.style.left = `${bubbleCenter}px`
    bubbleElement.style.setProperty('--dafeiyu-tail-offset', `${position.centerX - bubbleCenter}px`)
  }
  const render = (): void => {
    if (!world) return
    position = clampPosition(world, position)
    // 身体（base 基准体）：按实际显示尺寸居中 + 贴底（与片段层同一套数学：256 画布 × 缩放）。
    const rw = sprite.root.offsetWidth || world.petWidth
    const rh = sprite.root.offsetHeight || world.petHeight
    const s = rw / 256
    const feetFromBottom = behavior.clips.feetFromBottomPx * s
    sprite.root.style.left = `${position.centerX - rw / 2}px`
    sprite.root.style.top = `${position.footY - rh + feetFromBottom}px`
    // 气泡：放在真实角色的头顶上方。
    // The sprite root is a square transport canvas; the visible character is
    // centered in its lower half. Anchor bubbles to the normalized character
    // head instead of the transparent canvas top.
    bubbleHost.style.top = `${position.footY - behavior.clips.targetCharPx - behavior.geometry.worldPadding}px`
    if (clipLayer.isPlaying()) clipLayer.setPosition(position.centerX, position.footY)
    renderBubble()
  }
  const clearBubble = (): void => {
    bubbleCleanup?.()
    bubbleCleanup = undefined
    bubbleElement = undefined
  }
  const say = (text: string, thought = false): void => {
    clearBubble()
    const handle = showBubble(bubbleHost, text, thought)
    bubbleElement = handle.element
    bubbleCleanup = handle.dismiss
    renderBubble()
  }
  const fakeThought = (userText: string, answer: string): string => {
    const visible = `${userText}\n${answer}`
    // This is deliberately a local character line, chosen only from visible
    // text. It never asks the model for, or approximates, hidden reasoning.
    const persona = /R18|18禁|成人|色情|涩涩|肉文|荤段子|黄色|H文|H模式/i.test(userText)
      ? 'adult'
      : /文件夹|文件|目录|工作区|项目/.test(visible) || /dsh/.test(userText) && /文件|目录|文件夹|项目/.test(visible)
        ? 'workspace'
        : /报错|错误|失败|不行|卡住|崩了|bug/i.test(visible)
          ? 'failure'
          : /饿|吃饭|夜宵|午饭|晚饭|摆烂|摸鱼/.test(visible)
            ? 'food'
            : /累|烦|崩溃|难过|emo|焦虑|不想活/.test(visible)
              ? 'care'
              : /改|代码|功能|实现|接口|编译|构建|脚本|需求|开发/.test(visible)
                ? 'engineering'
                : 'general'
    const options = copy.thoughtPersonas[persona]
    let hash = 0
    for (const char of visible) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    const start = options.length > 0 ? hash % options.length : 0
    const candidate = options.find((_, index) => !recentThoughts.includes(options[(start + index) % options.length]))
      ?? options[start]
      ?? copy.thoughtPersonas.general[0]
    recentThoughts.push(candidate)
    if (recentThoughts.length > 4) recentThoughts.shift()
    return candidate
  }
  const generatedThought = (value: string | undefined): string | undefined => {
    const cleaned = value?.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!cleaned || cleaned.length < 4 || cleaned.length > 40) return undefined
    if (/首先|其次|然后|因为|所以|分析|推理|步骤|总结|计划|工具调用|系统提示|chain[- ]of[- ]thought|让我思考|我来分析/i.test(cleaned)) return undefined
    if (recentThoughts.includes(cleaned)) return undefined
    recentThoughts.push(cleaned)
    if (recentThoughts.length > 4) recentThoughts.shift()
    return cleaned
  }
  const showReply = (reply: { text: string; userText: string; startedAt: number; thought?: string }): void => {
    const content: ConversationBubble = {
      thought: generatedThought(reply.thought) ?? fakeThought(reply.userText, reply.text),
      elapsedSeconds: Math.max(1, Math.ceil((Date.now() - reply.startedAt) / 1000)),
      answer: reply.text,
    }
    clearBubble()
    const handle = showBubble(bubbleHost, content)
    bubbleElement = handle.element
    bubbleCleanup = handle.dismiss
    renderBubble()
  }
  const savePosition = (): void => {
    if (!world) return
    const span = Math.max(world.right - world.left, 1)
    storage.pos = { x: (position.centerX - world.left) / span }
    saveStorage(storage)
  }
  // 旧的待机台词气泡：用户要求关掉旧演出设计 → 不再自动冒待机台词。
  const scheduleBubble = (): void => {
    window.clearTimeout(bubbleTimer)
    return
  }
  // 旧的趴睡（身体晃动+变暗）：用户要求关掉 → 不再自动入睡。
  const scheduleSleep = (): void => {
    window.clearTimeout(sleepTimer)
    return
  }
  const wake = (): void => {
    if (state !== 'sleep') return
    setState(transition(state, 'wake'))
    sprite.setAnimation('idle')
    sprite.root.style.animation = ''
    say(copy.wake)
    scheduleBubble()
  }
  const activity = (): void => {
    if (!enabled) return
    wake()
    scheduleSleep()
  }
  // ── 编导演出：待机不再原地站着，随机演出一套小动作（每 7~16s 一次） ──
  const clearPerf = (): void => {
    sprite.root.style.animation = ''
  }
  // The processed idle video is the normal on-screen body. base.webp is only
  // a loading/failure fallback, never the normal standby visual.
  const startIdle = (): void => {
    // Anchor/resize callbacks can arrive while an action is waiting for its
    // first decoded frame. Starting idle here would increment the shared
    // canvas generation and cancel that action before it paints frame 0.
    if (clipActive || !idleSpec || !world || disposed || !enabled || idleRunning || idleStarting) return
    idleStarting = true
    void clipLayer.playLoop(idleSpec, position.centerX, position.footY).then((started) => {
      idleStarting = false
      idleRunning = started && !disposed
    })
  }
  // ── 真实动作片段播放：同一 canvas 直接切帧，播完回到循环 idle。──
  const endClip = (): void => {
    clipActive = false
    clipPriority = 0
    idleRunning = false
    idleStarting = false
    // Stop the current action without hiding the shared canvas, then repaint
    // idle immediately so an interrupted action never exposes base.webp.
    clipLayer.stop()
    startIdle()
    if (!disposed) schedulePerf(9000)
  }
  const showClip = async (spec: ClipSpec, priority = 10): Promise<void> => {
    clipActive = true
    clipPriority = priority
    // playOnce cancels the idle RAF on the shared canvas; keep the state flag
    // in sync so the idle loop is restarted after the action completes.
    idleRunning = false
    idleStarting = false
    setDebug(`clips: ${clipSpecs.map(s => s.clip).join(' ')}\npick: ${spec.clip} loading`)
    const started = await clipLayer.playOnce(spec, position.centerX, position.footY)
    if (disposed || !clipActive) return
    if (!started) {
      logDebug(`showClip bail: ${spec.clip} could not decode`)
      setDebug(`clips: ${clipSpecs.map(s => s.clip).join(' ')}\npick: ${spec.clip} BAIL`)
      endClip()
      return
    }
    logDebug(`showClip start: ${spec.clip}`)
    await wait(Math.max(0, spec.frames / spec.fps * 1000))
    if (disposed || !clipActive || state !== 'idle') return
    clipActive = false
    clipPriority = 0
    clipLayer.stop()
    idleRunning = false
    idleStarting = false
    startIdle()
    if (!disposed) schedulePerf(9000)
  }
  const requestClip = (clip: string, priority: number): boolean => {
    if (!enabled || disposed || !world || state !== 'idle' || dragging) return false
    const spec = allClipSpecs.find((candidate) => candidate.clip === clip)
    if (!spec) return false
    if (clipActive) {
      if (clipPriority >= priority) return false
      endClip()
    }
    void showClip(spec, priority)
    return true
  }
  performanceDirector = createPerformanceDirector(eventBus, {
    startClip: requestClip,
    say,
  })
  const performShow = (): void => {
    if (!enabled || disposed || state !== 'idle' || !world) return
    // A stale timer can fire after an action has started (for example after
    // an anchor/HMR callback). Never let it replace the current action.
    if (clipActive) {
      logDebug('performShow skip: action already playing')
      return
    }
    if (performanceDirector?.isBusy()) return
    // idle stays on screen continuously; only non-idle clips are performances.
    if (clipSpecs.length > 0) {
      const spec = clipSpecs[nextClipIndex % clipSpecs.length]
      logDebug(`performShow pick: ${spec.clip} (specs=${clipSpecs.map(s => s.clip).join(',')})`)
      const accepted = performanceDirector?.request({ clip: spec.clip, priority: 'ambient', dedupeKey: `ambient-${spec.clip}` }) ?? false
      if (accepted) nextClipIndex += 1
      return
    }
    startIdle()
  }
  const schedulePerf = (delay?: number): void => {
    window.clearTimeout(perfTimer)
    if (!enabled || disposed) return
    const ready = clipSpecs.length > 0 && Boolean(world) && state === 'idle'
    const nextDelay = delay ?? (ready ? 9000 : 500)
    perfTimer = window.setTimeout(() => {
      performShow()
      // A running action owns the timer until its completion path schedules
      // the next cooldown, so longer clips cannot drop the next action.
      if (!disposed && !clipActive) schedulePerf()
    }, nextDelay)
  }
  const onComposerChange = (rect: Parameters<typeof makeWorld>[0] | undefined): void => {
    if (!rect) {
      world = undefined
      host.hidden = true
      return
    }
    const nextWorld = makeWorld(rect)
    const previousWorld = world
    world = nextWorld
    host.hidden = !enabled
    if (previousWorld && storage.pos && state === 'idle') {
      position.centerX = nextWorld.left + Math.max(0, Math.min(1, storage.pos.x)) * (nextWorld.right - nextWorld.left)
      position.footY = nextWorld.groundY
    } else if (!previousWorld) {
      position = storage.pos ? { centerX: nextWorld.left + Math.max(0, Math.min(1, storage.pos.x)) * (nextWorld.right - nextWorld.left), footY: nextWorld.groundY } : centerPosition(nextWorld)
    }
    render()
    startIdle()
  }
  const setAnchor = (nextAnchor: DeskpetAnchor): void => {
    if (anchorMode === nextAnchor || disposed) return
    anchorMode = nextAnchor
    stopWatching()
    stopWatching = watchDeskpetAnchors(onComposerChange, anchorMode)
  }
  const finishFalling = (): void => {
    if (!world) return
    if (fallingFrame !== undefined) window.cancelAnimationFrame(fallingFrame)
    fallingFrame = undefined
    setState(transition(state, 'land'))
    void landingSequence()
  }
  const fallFrame = (now: number): void => {
    if (!world || state !== 'falling') return
    const elapsed = fallingLastTime === 0 ? 0 : now - fallingLastTime
    fallingLastTime = now
    const next = stepFalling({ footY: position.footY, velocity: fallingVelocity }, elapsed, world.groundY)
    position.footY = next.footY
    fallingVelocity = next.velocity
    render()
    if (next.landed) finishFalling()
    else fallingFrame = window.requestAnimationFrame(fallFrame)
  }
  const startFalling = (): void => {
    if (!world) return
    setState(transition(state, 'release'))
    fallingVelocity = 0
    fallingLastTime = 0
    fallingFrame = window.requestAnimationFrame(fallFrame)
  }
  const landingSequence = (): void => {
    sequence += 1
    clearBubble()
    setState('idle')
    sprite.setAnimation('idle')
    sprite.root.style.opacity = '1'
    sprite.root.style.animation = ''
    sprite.root.style.filter = ''
    savePosition()
    startIdle()
    schedulePerf(250)
  }
  const poke = (): void => {
    if (state !== 'idle') return
    storage.stats.poked += 1
    saveStorage(storage)
    sprite.setAnimation('poke')
    say(Math.random() * 100 < behavior.weights.pokeVariant ? copy.pokeVariant : copy.poke)
    window.setTimeout(() => {
      if (state === 'idle') {
        sprite.setAnimation('idle')
        startIdle()
      }
    }, behavior.timing.pokeDuration)
    activity()
  }
  const onSpriteKeyDown = (event: KeyboardEvent): void => {
    if (!enabled || (event.key !== 'Enter' && event.key !== ' ')) return
    event.preventDefault()
    event.stopPropagation()
    if (state === 'sleep') wake()
    poke()
  }
  const onPointerDown = (event: PointerEvent): void => {
    if (!enabled || state === 'landing' || state === 'running' || state === 'falling') return
    if (state === 'sleep') wake()
    // 真实动作片段播放中 → 立即打断（可随时拖走）。
    if (clipActive) endClip()
    pointerId = event.pointerId
    pointerOffsetX = event.clientX - position.centerX
    pointerOffsetFootY = event.clientY - position.footY
    dragging = false
    sprite.root.setPointerCapture(event.pointerId)
    activity()
  }
  const onPointerMove = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId || !world || !enabled) return
    const distance = Math.hypot(event.clientX - (position.centerX + pointerOffsetX), event.clientY - (position.footY + pointerOffsetFootY))
    if (!dragging && distance >= behavior.interaction.dragThreshold) {
      dragging = true
      window.clearTimeout(clickTimer)
      clickTimer = undefined
      lastPointerUp = 0
      storage.stats.dragged += 1
      saveStorage(storage)
      setState(transition(state, 'grab'))
      sprite.setAnimation('held')
      say(copy.grab)
    }
    if (!dragging) return
    position = clampPosition(world, { centerX: event.clientX - pointerOffsetX, footY: event.clientY - pointerOffsetFootY })
    if (state === 'dragged' && position.footY <= world.worldTop) {
      setState(transition(state, 'top'))
      if (Date.now() - topMessageAt >= behavior.interaction.topMessageCooldown) {
        topMessageAt = Date.now()
        say(copy.top)
      }
    } else if (state === 'atTop' && position.footY > world.worldTop) {
      setState('dragged')
    }
    render()
  }
  const onPointerUp = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return
    pointerId = undefined
    if (sprite.root.hasPointerCapture(event.pointerId)) sprite.root.releasePointerCapture(event.pointerId)
    if (dragging) {
      dragging = false
      savePosition()
      startFalling()
      return
    }
    const now = Date.now()
    if (now - lastPointerUp <= behavior.interaction.doubleClickWindow) {
      window.clearTimeout(clickTimer)
      clickTimer = undefined
      lastPointerUp = 0
      // Double-click remains a quiet interaction; it no longer emits the obsolete fixed bubble.
      activity()
      return
    }
    lastPointerUp = now
    clickTimer = window.setTimeout(() => {
      clickTimer = undefined
      lastPointerUp = 0
      poke()
    }, behavior.interaction.doubleClickWindow)
  }
  const isDeskpetArea = (target: EventTarget | null): boolean => target instanceof Node && (entry.contains(target) || host.contains(target))
  // 挡住从桌宠冒上来的 click：桌宠内的点/双击/拖拽全部由 pointer 事件驱动，
  // 原生 click 只是指落/拖拽的合成副产物——若不拦截，会冒泡到 entry 的
  // click 处理器，触发「面板展开」（长时间拖住桌宠就开面板的 BUG 根源）。
  const onClick = (event: MouseEvent): void => {
    event.stopPropagation()
    event.preventDefault()
  }
  const onGlobalPointerDown = (event: PointerEvent): void => {
    if (isDeskpetArea(event.target)) activity()
  }
  const onKeyDown = (event: KeyboardEvent): void => { if (isDeskpetArea(event.target)) activity() }
  const onInput = (event: Event): void => { if (isDeskpetArea(event.target)) activity() }
  const onWheel = (event: WheelEvent): void => { if (isDeskpetArea(event.target)) activity() }
  const onScroll = (event: Event): void => { if (isDeskpetArea(event.target)) activity() }
  const setEnabled = (nextEnabled: boolean): void => {
    enabled = nextEnabled
    if (enabled) {
      if (!document.body.contains(host)) document.body.appendChild(host)
      host.hidden = !world
      render()
      scheduleBubble()
      scheduleSleep()
      startIdle()
      schedulePerf()
    } else {
      window.clearTimeout(bubbleTimer)
      window.clearTimeout(sleepTimer)
      window.clearTimeout(perfTimer)
      window.clearTimeout(clickTimer)
      clickTimer = undefined
      lastPointerUp = 0
      if (fallingFrame !== undefined) window.cancelAnimationFrame(fallingFrame)
      clearBubble()
      clearPerf()
      endClip()
      host.remove()
    }
  }

  sprite.root.addEventListener('keydown', onSpriteKeyDown)
  sprite.root.addEventListener('pointerdown', onPointerDown)
  sprite.root.addEventListener('pointermove', onPointerMove)
  sprite.root.addEventListener('pointerup', onPointerUp)
  sprite.root.addEventListener('pointercancel', onPointerUp)
  sprite.root.addEventListener('click', onClick)
  document.addEventListener('pointerdown', onGlobalPointerDown, true)
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('input', onInput, true)
  document.addEventListener('wheel', onWheel, true)
  document.addEventListener('scroll', onScroll, true)

  stopWatching = watchDeskpetAnchors(onComposerChange, anchorMode)
  sprite.setAnimation('idle')
  setState('idle')
  scheduleBubble()
  scheduleSleep()
  schedulePerf()

  const controller: DeskpetController = {
    setEnabled,
    setAnchor,
    isEnabled(): boolean { return enabled },
    emit(event: DeskpetEvent): void { eventBus.emit(event) },
    showReply,
    dispose(): void {
      disposed = true
      sequence += 1
      performanceDirector?.dispose()
      eventBus.dispose()
      stopAssetVersionWatch()
      stopWatching()
      window.clearTimeout(bubbleTimer)
      window.clearTimeout(sleepTimer)
      window.clearTimeout(perfTimer)
      window.clearTimeout(clickTimer)
      if (fallingFrame !== undefined) window.cancelAnimationFrame(fallingFrame)
      clearBubble()
      clearPerf()
      clipLayer.stop(true)
      endClip()
      sprite.root.removeEventListener('keydown', onSpriteKeyDown)
      sprite.root.removeEventListener('pointerdown', onPointerDown)
      sprite.root.removeEventListener('pointermove', onPointerMove)
      sprite.root.removeEventListener('pointerup', onPointerUp)
      sprite.root.removeEventListener('pointercancel', onPointerUp)
      sprite.root.removeEventListener('click', onClick)
      document.removeEventListener('pointerdown', onGlobalPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('input', onInput, true)
      document.removeEventListener('wheel', onWheel, true)
      document.removeEventListener('scroll', onScroll, true)
      style.remove()
      host.remove()
    },
  }
  global.__dafeiyuDeskpetController = controller
  return controller
}
