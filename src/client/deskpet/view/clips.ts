/**
 * Canvas clip player for the deskpet.
 *
 * Sheets are decoded once and rendered one cell at a time. Idle and actions
 * intentionally share one fixed-size canvas so the character returns to the
 * established single-layer handoff behaviour after an action finishes.
 */
import { behavior } from '../config/behavior.ts'
import type { CharacterVariant } from '../environment/settings.ts'

export type ClipSpec = {
  clip: string
  assetVersion: string
  sheetUrl: string
  charHeightNorm: number
  frames: number
  fps: number
  cell: number
  columns: number
  displayScale?: number
}

type LifeJsonClip = {
  clip?: string
  char_height_norm?: number
  sheet?: string
  frames?: number
  fps?: number
  cell?: number
  columns?: number
  display_scale?: number
}

type LifeJsonPayload = { asset_version?: string | number; clips?: LifeJsonClip[] }
const ASSETS_ROOT = '/api/dsh-dafeiyu/deskpet/assets'
const NORMALIZED_CHAR_HEIGHT = 120
type LoadedClip = LifeJsonClip & { clip: string; sheet: string; frames: number; fps: number; cell: number; columns?: number; char_height_norm: number }
const specsPromises = new Map<CharacterVariant, Promise<ClipSpec[]>>()

export function loadClipSpecs(variant: CharacterVariant = 'current'): Promise<ClipSpec[]> {
  const cached = specsPromises.get(variant)
  if (cached) return cached
  const promise = fetch(`${ASSETS_ROOT}/life.json?variant=${encodeURIComponent(variant)}`, { cache: 'no-store' })
    .then((response) => { if (!response.ok) throw new Error('life.json not ok'); return response.json() as Promise<LifeJsonPayload> })
    .then((payload) => ({ assetVersion: String(payload.asset_version ?? 'v4'), clips: (payload.clips ?? []) as LoadedClip[] }))
    .then(({ assetVersion, clips }) => clips
      .filter((clip): clip is LoadedClip => typeof clip.clip === 'string' && typeof clip.sheet === 'string' && Number.isFinite(clip.frames) && clip.frames > 0 && Number.isFinite(clip.fps) && clip.fps > 0 && Number.isFinite(clip.cell) && clip.cell > 0 && Number.isFinite(clip.char_height_norm) && clip.char_height_norm > 0)
      .map((clip) => ({
        clip: clip.clip,
        assetVersion,
        // The host serves the original sheet bytes.  Do not add layout/canvas
        // query parameters here: those belonged to the old second-layer
        // renderer and made the browser cache a transformed response that
        // could not be decoded reliably.
        sheetUrl: `${ASSETS_ROOT}/${clip.sheet}?variant=${encodeURIComponent(variant)}&rev=${encodeURIComponent(assetVersion)}`,
        charHeightNorm: clip.char_height_norm,
        frames: Math.floor(clip.frames),
        fps: clip.fps,
        cell: Math.floor(clip.cell),
        columns: Math.max(1, Math.floor(clip.columns ?? clip.frames)),
        displayScale: Number.isFinite(clip.display_scale) && clip.display_scale! > 0 ? clip.display_scale : 1,
      })))
    .catch(() => [] as ClipSpec[])
  specsPromises.set(variant, promise)
  return promise
}

/**
 * Imported assets update life.json, but an existing controller keeps the
 * original clip list in memory. Poll only this small manifest and ask the
 * caller to remount after a real version change. Failed requests are ignored
 * so a local host restart never interrupts the current character.
 */
export function watchClipAssetVersion(assetVersion: string, onChanged: (nextVersion: string) => void, variant: CharacterVariant = 'current', intervalMs = 30_000): () => void {
  let stopped = false
  let checking = false
  const check = async (): Promise<void> => {
    if (stopped || checking) return
    checking = true
    try {
      const response = await fetch(`${ASSETS_ROOT}/life.json?variant=${encodeURIComponent(variant)}`, { cache: 'no-store' })
      if (!response.ok) return
      const payload = await response.json() as LifeJsonPayload
      const nextVersion = String(payload.asset_version ?? 'v4')
      if (!stopped && nextVersion !== assetVersion) {
        stopped = true
        onChanged(nextVersion)
      }
    } catch {
      // Keep the mounted character alive while the local host is restarting.
    } finally {
      checking = false
    }
  }
  const timer = window.setInterval(() => { void check() }, intervalMs)
  return () => {
    stopped = true
    window.clearInterval(timer)
  }
}

export type ClipLayer = {
  layer: HTMLElement
  preload(specs: ClipSpec[]): void
  playLoop(spec: ClipSpec, centerX: number, footY: number): Promise<boolean>
  playOnce(spec: ClipSpec, centerX: number, footY: number): Promise<boolean>
  stop(hide?: boolean): void
  isPlaying(): boolean
  canShow(spec: ClipSpec): boolean
  setPosition(centerX: number, footY: number): void
  onFrame?: (clip: string, frame: number, total: number) => void
  onDecode?: (clip: string, ok: boolean, width: number, height: number) => void
}

export function createClipLayer(layer: HTMLElement): ClipLayer {
  const canvas = layer.querySelector<HTMLCanvasElement>('canvas')
  if (!canvas) throw new Error('deskpet clip layer requires its single canvas')
  const context = canvas.getContext('2d')
  const sheets = new Map<string, HTMLImageElement>()
  const loadPromises = new Map<string, Promise<boolean>>()
  let current: ClipSpec | undefined
  let playing = false
  let raf = 0
  let generation = 0
  let startedAt = 0
  let lastPainted = -1
  let looping = false
  let onFrameRef: ((clip: string, frame: number, total: number) => void) | undefined
  let onDecodeRef: ((clip: string, ok: boolean, width: number, height: number) => void) | undefined

  const ensureLoaded = (spec: ClipSpec): Promise<boolean> => {
    let image = sheets.get(spec.sheetUrl)
    if (!image) {
      image = new Image()
      image.alt = ''
      image.decoding = 'async'
      image.draggable = false
      sheets.set(spec.sheetUrl, image)
    }
    const existing = loadPromises.get(spec.sheetUrl)
    if (existing) return existing
    // A successfully decoded sheet is reusable. Failed images have
    // naturalWidth=0 and are deliberately retried below.
    if (image.complete && image.naturalWidth > 0) return Promise.resolve(true)
    const promise = new Promise<boolean>((resolve) => {
      const finish = (ok: boolean): void => {
        loadPromises.delete(spec.sheetUrl)
        onDecodeRef?.(spec.clip, ok, image.naturalWidth, image.naturalHeight)
        resolve(ok)
      }
      image.addEventListener('load', () => finish(image.naturalWidth > 0), { once: true })
      image.addEventListener('error', () => finish(false), { once: true })
      image.src = spec.sheetUrl
      if (image.complete) finish(image.naturalWidth > 0)
    })
    loadPromises.set(spec.sheetUrl, promise)
    return promise
  }
  const preload = (specs: ClipSpec[]): void => { for (const spec of specs) void ensureLoaded(spec) }
  const scaleFor = (spec: ClipSpec): number => (behavior.clips.targetCharPx / NORMALIZED_CHAR_HEIGHT) * (spec.displayScale ?? 1)
  const applyLayout = (spec: ClipSpec, centerX: number, footY: number): void => {
    const scale = scaleFor(spec)
    const size = Math.max(1, Math.round(spec.cell * scale))
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size
      canvas.height = size
      canvas.style.width = `${size}px`
      canvas.style.height = `${size}px`
      layer.style.width = `${size}px`
      layer.style.height = `${size}px`
    }
    layer.style.left = `${Math.round(centerX - size / 2)}px`
    layer.style.top = `${Math.round(footY - size + behavior.clips.feetFromBottomPx * scale)}px`
  }
  const paint = (spec: ClipSpec, image: HTMLImageElement, index: number): void => {
    if (!context) return
    const bounded = Math.max(0, Math.min(spec.frames - 1, index))
    context.imageSmoothingEnabled = true
    const sourceX = (bounded % spec.columns) * spec.cell
    const sourceY = Math.floor(bounded / spec.columns) * spec.cell
    context.globalCompositeOperation = 'copy'
    context.drawImage(image, sourceX, sourceY, spec.cell, spec.cell, 0, 0, canvas.width, canvas.height)
    context.globalCompositeOperation = 'source-over'
    if (bounded !== lastPainted) { lastPainted = bounded; onFrameRef?.(spec.clip, bounded, spec.frames) }
  }
  const stop = (hide = false): void => {
    generation += 1
    if (raf) window.cancelAnimationFrame(raf)
    raf = 0
    playing = false
    looping = false
    if (hide) { current = undefined; layer.style.opacity = '0'; layer.style.display = 'none' }
  }
  const play = async (spec: ClipSpec, centerX: number, footY: number, loop: boolean): Promise<boolean> => {
    generation += 1
    if (raf) window.cancelAnimationFrame(raf)
    raf = 0
    playing = false
    looping = loop
    const token = generation
    const loaded = await ensureLoaded(spec)
    if (!loaded || token !== generation) return false
    const image = sheets.get(spec.sheetUrl)
    if (!image) return false
    current = spec
    lastPainted = -1
    applyLayout(spec, centerX, footY)
    layer.style.display = 'block'
    layer.style.opacity = '1'
    paint(spec, image, 0)
    playing = true
    startedAt = performance.now()
    const frameMs = 1000 / spec.fps
    const tick = (now: number): void => {
      if (!playing || current !== spec || token !== generation) return
      const frameIndex = Math.floor((now - startedAt) / frameMs)
      if (frameIndex >= spec.frames) {
        if (!looping) { paint(spec, image, spec.frames - 1); playing = false; raf = 0; return }
        startedAt += spec.frames * frameMs
      }
      paint(spec, image, looping ? frameIndex % spec.frames : frameIndex)
      raf = window.requestAnimationFrame(tick)
    }
    raf = window.requestAnimationFrame(tick)
    return true
  }

  return {
    layer,
    preload,
    playLoop: (spec, centerX, footY) => play(spec, centerX, footY, true),
    playOnce: (spec, centerX, footY) => play(spec, centerX, footY, false),
    stop,
    isPlaying: () => playing,
    canShow: (spec) => { const image = sheets.get(spec.sheetUrl); return Boolean(image?.complete && image.naturalWidth > 0) },
    setPosition: (centerX, footY) => { if (current) applyLayout(current, centerX, footY) },
    get onFrame() { return onFrameRef },
    set onFrame(fn) { onFrameRef = fn },
    get onDecode() { return onDecodeRef },
    set onDecode(fn) { onDecodeRef = fn },
  }
}
