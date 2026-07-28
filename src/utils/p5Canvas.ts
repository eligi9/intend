import type p5 from 'p5'

interface CanvasSizeOptions {
  fallbackHeightRatio: number
  minHeight: number
  minWidth?: number
}

function getP5CanvasSize(container: HTMLElement, options: CanvasSizeOptions) {
  const bounds = container.getBoundingClientRect()
  const minWidth = options.minWidth ?? 320

  return {
    width: Math.max(minWidth, Math.floor(bounds.width || container.clientWidth || window.innerWidth)),
    height: Math.max(
      options.minHeight,
      Math.floor(bounds.height || container.clientHeight || window.innerHeight * options.fallbackHeightRatio),
    ),
  }
}

export function setupResizableP5Canvas(
  p: p5,
  container: HTMLElement,
  options: CanvasSizeOptions,
) {
  const resize = () => {
    const { width, height } = getP5CanvasSize(container, options)
    p.resizeCanvas(width, height)
  }

  p.setup = () => {
    const { width, height } = getP5CanvasSize(container, options)
    p.createCanvas(width, height)
    p.pixelDensity(Math.min(window.devicePixelRatio, 2))
  }

  p.windowResized = resize

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  return () => {
    resizeObserver.disconnect()
  }
}

export function setP5Cursor(
  p: p5,
  container: HTMLElement,
  interactive: boolean,
) {
  const canvas = container.querySelector('canvas')
  const cursor = interactive ? 'pointer' : 'default'

  if (canvas && canvas.dataset.cursor !== cursor) {
    canvas.dataset.cursor = cursor
  }

  p.cursor(interactive ? p.HAND : p.ARROW)
}
