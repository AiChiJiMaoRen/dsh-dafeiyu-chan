import copyJson from './copy.json' with { type: 'json' }

export type IdleBubble = {
  id: string
  text: string
  weight: number
  nightOnly?: boolean
}

export type ThoughtPersona = 'adult' | 'workspace' | 'failure' | 'food' | 'care' | 'engineering' | 'general'

export const copy = copyJson as {
  idleBubbles: IdleBubble[]
  grab: string
  cry: string
  top: string
  landing: { eatRun: string; slack: string; rewrite: string }
  poke: string
  pokeVariant: string
  sleep: string
  wake: string
  thoughtPrefix: string
  thoughtSuffix: string
  thoughtPersonas: Record<ThoughtPersona, string[]>
  constraints: { '测完叫我': number; '千问': number; idleBubbleMaxLength: number }
}

export type DeskpetCopy = typeof copy
