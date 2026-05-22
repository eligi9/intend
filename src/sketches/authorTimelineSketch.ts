import p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { createTimelineModel } from '../utils/timelineScale'

interface AuthorTimelineSketchState {
  statements: IntentRecord[]
  selectedLabels: IntentLabelKey[]
  setHoveredStatement: (payload: HoveredTimelineStatement | null) => void
}

export interface HoveredTimelineStatement {
  id: string
  date: string
  xRatio: number
  yRatio: number
}

interface TimelineCurve {
  id: string
  record: IntentRecord
  x: number
  y: number
  lift: number
}

const strategyLineColors: Partial<Record<IntentLabelKey, [number, number, number]>> = {
  enemy_image: [255, 92, 120],
  just_cause: [214, 103, 255],
  individual_needs: [99, 136, 255],
  rhetorical_foreclosure: [134, 183, 118],
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
      const axisY = p.height * 0.58
      const anchor = { x: p.width / 2, y: 0 }
      const drawableWidth = p.width - paddingX * 2
      const points = model.points.map((point) => ({
        ...point,
        x: paddingX + point.ratio * drawableWidth,
        y: axisY - point.stackIndex * Math.max(12, p.height * 0.045),
      }))
      const curves = points.map((point) => ({
        id: point.id,
        record: point.record,
        x: point.x,
        y: point.y,
        lift: p.map(Math.abs(anchor.x - point.x), 0, p.width / 2, p.height * 0.1, p.height * 0.22),
      }))

      const hovered =
        points.find((point) => p.dist(p.mouseX, p.mouseY, point.x, point.y) <= 10)?.id ??
        curves.find((curve) => isMouseNearCurve(p, curve, anchor, axisY))?.id ??
        null
      hoveredPointId = hovered
      p.cursor(hoveredPointId ? p.HAND : p.ARROW)
      const hoveredPoint = points.find((point) => point.id === hoveredPointId)
      state.setHoveredStatement(
        hoveredPoint
          ? {
              id: hoveredPoint.id,
              date: formatHoverDate(hoveredPoint.record.date),
              xRatio: hoveredPoint.x / p.width,
              yRatio: axisY / p.height,
            }
          : null,
      )

      p.clear()
      p.background(48, 48, 48)

      p.noFill()
      curves.forEach((curve) => {
        const hovered = hoveredPointId === curve.id
        const color = getCurveColor(curve.record, state.selectedLabels)
        const hasActiveFilters = state.selectedLabels.length > 0
        const alpha = hovered ? 190 : color ? 150 : hasActiveFilters ? 28 : 52
        p.stroke(color?.[0] ?? 245, color?.[1] ?? 243, color?.[2] ?? 238, alpha)
        p.strokeWeight(hovered ? 2.4 : 1.4)
        p.bezier(
          anchor.x,
          anchor.y,
          anchor.x,
          axisY - curve.lift,
          curve.x,
          axisY - curve.lift,
          curve.x,
          curve.y,
        )
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
        const color = getCurveColor(point.record, state.selectedLabels)
        p.noStroke()
        p.fill(color?.[0] ?? (hovered ? 255 : 245), color?.[1] ?? (hovered ? 255 : 243), color?.[2] ?? (hovered ? 255 : 238))
        p.circle(point.x, point.y, hovered ? 17 : 12)
      })

      p.noStroke()
      p.fill(245, 243, 238, 210)
      p.circle(anchor.x, anchor.y, 8)
    }
  }

  return new p5(sketch, container)
}

function getCurveColor(record: IntentRecord, selectedLabels: IntentLabelKey[]) {
  const matchingLabel = selectedLabels.find((label) => record[label] === 'yes')

  return matchingLabel ? strategyLineColors[matchingLabel] : null
}

function isMouseNearCurve(
  p: p5,
  curve: TimelineCurve,
  anchor: { x: number; y: number },
  axisY: number,
) {
  const threshold = 9
  const samples = 32

  for (let index = 0; index <= samples; index += 1) {
    const amount = index / samples
    const x = p.bezierPoint(anchor.x, anchor.x, curve.x, curve.x, amount)
    const y = p.bezierPoint(anchor.y, axisY - curve.lift, axisY - curve.lift, curve.y, amount)

    if (p.dist(p.mouseX, p.mouseY, x, y) <= threshold) return true
  }

  return false
}

function formatHoverDate(date: string) {
  const [day, month, year] = date.split('/')

  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year.slice(-2)}`
}
