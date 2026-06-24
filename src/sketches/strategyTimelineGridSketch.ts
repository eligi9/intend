import p5 from 'p5'
import type { StrategyTimelineGridSketchState } from '../types/strategyBeeswarm'
import { setupResizableP5Canvas } from '../utils/p5Canvas'

const EVENT_LABEL_HEIGHT = 34
const EVENT_LABEL_LINE_HEIGHT = 13
const EVENT_LABEL_WIDTH = 156

interface PositionedGridEvent {
  date: string
  label: string
  x: number
  y: number
}

export function createStrategyTimelineGridSketch(
  container: HTMLElement,
  state: StrategyTimelineGridSketchState,
) {
  let cleanupCanvas: (() => void) | null = null

  const sketch = (p: p5) => {
    cleanupCanvas = setupResizableP5Canvas(p, container, {
      fallbackHeightRatio: 0.46,
      minHeight: 280,
    })

    p.remove = ((remove) => () => {
      cleanupCanvas?.()
      remove()
    })(p.remove.bind(p))

    p.draw = () => {
      const range = state.endDate.getTime() - state.startDate.getTime()
      const eventY = p.height - 60
      const events = getPositionedEvents(state, range, p.width, eventY)

      p.clear()
      p.background(48, 48, 48)
      drawDivisions(p, state, range)
      drawEventAnchors(p, events)
      drawEvents(p, events)
    }
  }

  return new p5(sketch, container)
}

function drawDivisions(p: p5, state: StrategyTimelineGridSketchState, range: number) {
  const divisionWidth = p.width / state.divisions

  p.textAlign(p.LEFT, p.TOP)
  p.textSize(12)

  for (let index = 0; index < state.divisions; index += 1) {
    const x = index * divisionWidth
    const labelDate = new Date(state.startDate.getTime() + (index / state.divisions) * range)

    p.stroke(245, 243, 238, 36)
    p.strokeWeight(1)
    p.line(x, 0, x, p.height)

    p.noStroke()
    p.fill(245, 243, 238, 150)
    p.push()
    p.translate(x + 4, p.height - 18)
    p.rotate(-p.HALF_PI)
    p.text(formatMonthLabel(labelDate), 0, 0)
    p.pop()
  }
}

function drawEventAnchors(
  p: p5,
  events: PositionedGridEvent[],
) {
  events.forEach((event) => {
    p.stroke(245, 243, 238, 76)
    p.strokeWeight(2)
    p.line(event.x, 0, event.x, Math.min(p.height, event.y + EVENT_LABEL_HEIGHT))
  })
}

function drawEvents(p: p5, events: PositionedGridEvent[]) {
  p.textSize(12)
  p.textStyle(p.BOLD)

  events.forEach((event) => {
    const alignRight = event.x > p.width * 0.86
    const textX = alignRight ? event.x - 8 : event.x + 8
    const textWidth = alignRight ? Math.min(EVENT_LABEL_WIDTH, Math.max(72, event.x - 16)) : EVENT_LABEL_WIDTH

    p.noStroke()
    p.fill(245, 243, 238, 240)
    p.textAlign(alignRight ? p.RIGHT : p.LEFT, p.TOP)
    p.text(event.date, textX, event.y, textWidth)

    p.textStyle(p.NORMAL)
    p.fill(245, 243, 238, 220)
    p.text(event.label, textX, event.y + EVENT_LABEL_LINE_HEIGHT, textWidth)
    p.textStyle(p.BOLD)
  })

  p.textStyle(p.NORMAL)
}

function getPositionedEvents(
  state: StrategyTimelineGridSketchState,
  range: number,
  width: number,
  y: number,
) {
  return state.events
    .map((event) => {
      const date = parseEventDate(event.date)
      if (!date) return null

      return {
        date: formatIsoDate(event.date, event.endDate),
        label: event.label,
        x: ((date.getTime() - state.startDate.getTime()) / range) * width,
        y,
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
}

function parseEventDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatIsoDate(date: string, endDate?: string) {
  const start = formatEventDate(date)
  return endDate ? `${start} - ${formatEventDate(endDate)}` : start
}

function formatMonthLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)

  return `${month}/${year}`
}

function formatEventDate(date: string) {
  const parsed = parseEventDate(date)

  if (!parsed) return date

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(parsed)
}
