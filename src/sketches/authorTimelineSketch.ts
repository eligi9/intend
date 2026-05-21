import p5 from 'p5'
import type { IntentRecord } from '../types/intentData'
import { createTimelineModel } from '../utils/timelineScale'

interface AuthorTimelineSketchState {
  statements: IntentRecord[]
}

export function createAuthorTimelineSketch(container: HTMLElement, state: AuthorTimelineSketchState) {
  let resizeObserver: ResizeObserver | null = null
  let hoveredPointId: string | null = null

  const getCanvasSize = () => {
    const bounds = container.getBoundingClientRect()

    return {
      width: Math.max(320, Math.floor(bounds.width || container.clientWidth || window.innerWidth)),
      height: Math.max(260, Math.floor(bounds.height || container.clientHeight || window.innerHeight * 0.38)),
    }
  }

  const sketch = (p: p5) => {
    const resize = () => {
      const { width, height } = getCanvasSize()
      p.resizeCanvas(width, height)
    }

    p.setup = () => {
      const { width, height } = getCanvasSize()
      p.createCanvas(width, height)
      p.pixelDensity(Math.min(window.devicePixelRatio, 2))

      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(container)
    }

    p.windowResized = resize

    p.remove = ((remove) => () => {
      resizeObserver?.disconnect()
      remove()
    })(p.remove.bind(p))

    p.draw = () => {
      const model = createTimelineModel(state.statements)
      const paddingX = Math.max(42, p.width * 0.07)
      const axisY = p.height * 0.7
      const anchor = { x: p.width / 2, y: p.height * 0.08 }
      const drawableWidth = p.width - paddingX * 2
      const points = model.points.map((point) => ({
        ...point,
        x: paddingX + point.ratio * drawableWidth,
        y: axisY - point.stackIndex * Math.max(12, p.height * 0.045),
      }))

      hoveredPointId =
        points.find((point) => p.dist(p.mouseX, p.mouseY, point.x, point.y) <= 10)?.id ?? null

      p.clear()
      p.background(48, 48, 48)

      p.noFill()
      points.forEach((point) => {
        const hovered = hoveredPointId === point.id
        const lift = p.map(Math.abs(anchor.x - point.x), 0, p.width / 2, p.height * 0.18, p.height * 0.34)
        p.stroke(245, 243, 238, hovered ? 150 : 52)
        p.strokeWeight(hovered ? 2.4 : 1.4)
        p.bezier(anchor.x, anchor.y, anchor.x, axisY - lift, point.x, axisY - lift, point.x, point.y)
      })

      p.stroke(245, 243, 238, 112)
      p.strokeWeight(2)
      p.line(paddingX, axisY, p.width - paddingX, axisY)

      p.textAlign(p.CENTER, p.TOP)
      p.textSize(Math.max(10, p.width * 0.011))
      model.ticks.forEach((tick) => {
        const x = paddingX + tick.ratio * drawableWidth
        p.stroke(245, 243, 238, 102)
        p.line(x, axisY - 8, x, axisY + 8)
        p.noStroke()
        p.fill(245, 243, 238, 150)
        p.text(tick.label, x, axisY + 18)
      })

      points.forEach((point) => {
        const hovered = hoveredPointId === point.id
        p.noStroke()
        p.fill(hovered ? 255 : 245, hovered ? 255 : 243, hovered ? 255 : 238)
        p.circle(point.x, point.y, hovered ? 17 : 12)
      })

      p.noStroke()
      p.fill(245, 243, 238, 210)
      p.circle(anchor.x, anchor.y, 9)
    }
  }

  return new p5(sketch, container)
}
