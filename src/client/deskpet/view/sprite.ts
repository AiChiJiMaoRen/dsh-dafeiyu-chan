import { behavior } from '../config/behavior.ts'
import type { DeskpetAnimation } from '../types.ts'

/**
 * 桌宠「身体」（真实鲸鱼娘基准体）。
 *
 * The body and every action share one 256px canvas.  The clip player owns
 * the pixels; this element only provides the stable drag/focus hit target.
 *
 * 目录锚定目标选择：
 * - 身体尺寸 = `(targetCharPx / charHeightNorm) * 256`（≈131×131），角色脚落在
 *   `behavior.clips.feetFromBottomPx` 之上 → 与 clip 层共用同一套尺寸/贴底数学，
 *   片段在身体正上方播放时不可感知切换（不闪）。
 * - 各状态暂无专属片段 → `setAnimation` 保留接口但暂不换图（所有状态都显示 base）。
 *
 * @module dsh-dafeiyu/client/deskpet/view/sprite
 */

export function createSprite(): { root: HTMLElement; canvas: HTMLCanvasElement; setAnimation: (animation: DeskpetAnimation) => void } {
  const root = document.createElement('div')
  const canvas = document.createElement('canvas')
  root.setAttribute('role', 'button')
  root.tabIndex = 0
  root.className = 'dafeiyu-deskpet-sprite'
  root.setAttribute('aria-label', '大肥鱼桌宠')
  canvas.className = 'dafeiyu-deskpet-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  canvas.width = 256
  canvas.height = 256
  root.appendChild(canvas)

  // 身体尺寸：与片段一致的 256 画布缩放 → 角色 60px 展示、贴底。
  const s = behavior.clips.targetCharPx / 120
  const w = Math.max(1, Math.round(256 * s))
  const h = Math.max(1, Math.round(256 * s))
  root.style.width = `${w}px`
  root.style.height = `${h}px`

  root.dataset.atlas = 'ready'
  const setAnimation = (_animation: DeskpetAnimation): void => {
    root.dataset.animation = 'idle'
  }
  setAnimation('idle')
  return { root, canvas, setAnimation }
}
