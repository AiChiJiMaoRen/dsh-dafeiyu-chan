import { behavior } from '../config/behavior.ts'
import type { ComposerRect, DeskpetAnchor } from '../types.ts'

function readElementRect(element: Element | null): DOMRect | undefined {
  const rect = element?.getBoundingClientRect()
  return rect && rect.width > 0 && rect.height > 0 ? rect : undefined
}

function selectorFor(anchorMode: DeskpetAnchor): string {
  return anchorMode === 'dock' ? `${behavior.environment.entrySelector} .dfy-dock` : behavior.environment.composerSelector
}

export function readDeskpetAnchors(anchorMode: DeskpetAnchor = 'composer'): ComposerRect | undefined {
  const selector = selectorFor(anchorMode)
  const anchor = readElementRect(document.querySelector(selector))
  if (!anchor) return undefined
  return {
    // The deskpet host is fixed to the viewport, so its coordinate origin is
    // also the viewport origin. Keep ComposerRect compatible with the physics
    // helpers while anchoring to dsh's real composer instead of the old panel.
    entryLeft: 0,
    entryTop: 0,
    anchorLeft: anchor.left,
    anchorRight: anchor.right,
    anchorTop: anchor.top,
    anchorWidth: anchor.width,
    anchorHeight: anchor.height,
  }
}

export function watchDeskpetAnchors(onChange: (rect: ComposerRect | undefined) => void, anchorMode: DeskpetAnchor = 'composer'): () => void {
  let warned = false
  let observedComposer: Element | undefined
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(() => notify()) : undefined
  const notify = (): void => {
    const selector = selectorFor(anchorMode)
    const composer = document.querySelector(selector)
    if (composer !== observedComposer) {
      if (observedComposer) resizeObserver?.unobserve(observedComposer)
      observedComposer = composer ?? undefined
      if (observedComposer) resizeObserver?.observe(observedComposer)
    }
    const rect = readDeskpetAnchors(anchorMode)
    if (!rect && !warned) {
      warned = true
      console.warn('[dsh-dafeiyu] deskpet anchor self-check failed:', selector)
    }
    if (rect) warned = false
    onChange(rect)
  }
  const mutationObserver = new MutationObserver(notify)
  mutationObserver.observe(document.body, { childList: true, subtree: true })
  window.addEventListener('resize', notify)
  window.addEventListener('scroll', notify, true)
  notify()
  return (): void => {
    resizeObserver?.disconnect()
    mutationObserver.disconnect()
    window.removeEventListener('resize', notify)
    window.removeEventListener('scroll', notify, true)
  }
}
