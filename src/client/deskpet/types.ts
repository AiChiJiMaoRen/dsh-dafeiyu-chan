export type DeskpetAnimation = 'idle' | 'held' | 'run' | 'sit' | 'cry' | 'stand' | 'sleep' | 'poke'
export type DeskpetState = 'idle' | 'dragged' | 'atTop' | 'falling' | 'landing' | 'sleep' | 'slack' | 'running'
export type DeskpetAnchor = 'composer' | 'dock'

export type ComposerRect = {
  entryLeft: number
  entryTop: number
  anchorLeft: number
  anchorRight: number
  anchorTop: number
  anchorWidth: number
  anchorHeight: number
}

export type DeskpetWorld = {
  left: number
  right: number
  groundY: number
  worldTop: number
  petWidth: number
  petHeight: number
}

export type DeskpetPosition = { centerX: number; footY: number }
export type DeskpetStats = { dragged: number; poked: number }

export type DeskpetStorage = {
  schema: number
  nicknames: Array<{ value: string; source: string }>
  stats: DeskpetStats
  pos?: { x: number }
}

export type MemorySnapshot = {
  currentFocus?: string
  mood?: 'blah' | 'okay' | 'up'
  progressLog?: Array<{ text?: string; kind?: 'progress' | 'todo' }>
}
