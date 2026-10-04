import { behavior } from '../config/behavior.ts'

export type FallingState = { footY: number; velocity: number }

export function stepFalling(state: FallingState, elapsedMs: number, groundY: number): FallingState & { landed: boolean } {
  const elapsed = Math.min(elapsedMs / 1000, behavior.physics.frameDeltaMax)
  const velocity = Math.min(state.velocity + behavior.physics.gravity * elapsed, behavior.physics.maxVelocity)
  const footY = state.footY + velocity * elapsed
  return footY >= groundY ? { footY: groundY, velocity: 0, landed: true } : { footY, velocity, landed: false }
}