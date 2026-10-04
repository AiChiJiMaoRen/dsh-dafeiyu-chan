import type { DeskpetState } from '../types.ts'

export type DeskpetEvent = 'grab' | 'top' | 'release' | 'land' | 'sleep' | 'wake' | 'finish' | 'slackRelease'

export function transition(state: DeskpetState, event: DeskpetEvent): DeskpetState {
  if (event === 'grab' && (state === 'idle' || state === 'sleep' || state === 'slack')) return 'dragged'
  if (event === 'top' && state === 'dragged') return 'atTop'
  if (event === 'release' && (state === 'dragged' || state === 'atTop')) return 'falling'
  if (event === 'land' && state === 'falling') return 'landing'
  if (event === 'sleep' && state === 'idle') return 'sleep'
  if (event === 'wake' && (state === 'sleep' || state === 'slack')) return 'idle'
  if (event === 'slackRelease' && state === 'slack') return 'idle'
  if (event === 'finish' && state === 'landing') return 'idle'
  return state
}