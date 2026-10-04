export function wait(duration: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

export async function moveTo(update: (progress: number) => void, duration: number): Promise<void> {
  const started = performance.now()
  await new Promise<void>((resolve) => {
    const frame = (now: number): void => {
      const progress = Math.min((now - started) / duration, 1)
      update(progress)
      if (progress >= 1) resolve()
      else window.requestAnimationFrame(frame)
    }
    window.requestAnimationFrame(frame)
  })
}