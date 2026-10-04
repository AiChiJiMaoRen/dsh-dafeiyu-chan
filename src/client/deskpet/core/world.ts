import { behavior } from '../config/behavior.ts'
import type { ComposerRect, DeskpetPosition, DeskpetWorld } from '../types.ts'

export function makeWorld(rect: ComposerRect): DeskpetWorld {
  return {
    left: rect.anchorLeft - rect.entryLeft + behavior.geometry.worldPadding,
    right: rect.anchorRight - rect.entryLeft - behavior.geometry.worldPadding,
    groundY: rect.anchorTop - rect.entryTop,
    worldTop: rect.anchorTop - rect.entryTop - behavior.geometry.petHeight,
    petWidth: behavior.geometry.petWidth,
    petHeight: behavior.geometry.petHeight,
  }
}

export function clampPosition(world: DeskpetWorld, position: DeskpetPosition): DeskpetPosition {
  const minX = world.left + world.petWidth / 2
  const maxX = world.right - world.petWidth / 2
  return {
    centerX: Math.max(minX, Math.min(maxX, position.centerX)),
    footY: Math.max(world.worldTop, Math.min(world.groundY, position.footY)),
  }
}

export function centerPosition(world: DeskpetWorld): DeskpetPosition {
  return { centerX: (world.left + world.right) / 2, footY: world.groundY }
}