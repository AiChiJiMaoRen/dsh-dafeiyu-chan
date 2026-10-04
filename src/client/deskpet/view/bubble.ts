import { behavior } from '../config/behavior.ts'

export type BubbleHandle = {
  element: HTMLElement
  dismiss(): void
}

export type ConversationBubble = {
  thought: string
  elapsedSeconds: number
  answer: string
}

export function showBubble(host: HTMLElement, content: string | ConversationBubble, thought = false): BubbleHandle {
  const bubble = document.createElement('div')
  const isConversation = typeof content !== 'string'
  bubble.className = isConversation
    ? 'dafeiyu-deskpet-bubble dafeiyu-deskpet-conversation'
    : thought ? 'dafeiyu-deskpet-bubble thought' : 'dafeiyu-deskpet-bubble'
  if (isConversation) {
    const thoughtBlock = document.createElement('div')
    thoughtBlock.className = 'dafeiyu-deskpet-thought'
    const label = document.createElement('div')
    label.className = 'dafeiyu-deskpet-thought-label'
    label.textContent = `已思考（用时 ${Math.max(1, content.elapsedSeconds)} 秒）`
    const thoughtText = document.createElement('div')
    thoughtText.className = 'dafeiyu-deskpet-thought-copy'
    thoughtText.textContent = `• ${content.thought}`
    const answer = document.createElement('div')
    answer.className = 'dafeiyu-deskpet-answer'
    answer.textContent = content.answer
    thoughtBlock.append(label, thoughtText)
    bubble.append(thoughtBlock, answer)
  } else {
    bubble.textContent = thought ? `（思考中） ${content}` : content
  }
  bubble.style.zIndex = String(thought ? behavior.display.bubbleZIndex : behavior.display.zIndex)
  bubble.setAttribute('role', 'status')
  host.appendChild(bubble)
  const visibleFor = isConversation
    ? Math.min(18000, Math.max(6500, 4400 + content.answer.length * 55))
    : behavior.timing.bubbleVisible
  const timer = window.setTimeout(() => bubble.remove(), visibleFor)
  return {
    element: bubble,
    dismiss(): void {
      window.clearTimeout(timer)
      bubble.remove()
    },
  }
}
