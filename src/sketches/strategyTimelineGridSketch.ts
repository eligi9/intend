import p5 from 'p5'
import { baseColorRgb } from '../types/designTokens'
import type { StrategyTimelineGridSketchState } from '../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineEvent } from '../types/timeline'
import { setupResizableP5Canvas } from '../utils/p5Canvas'

const EVENT_LABEL_HEIGHT = 34
const EVENT_LABEL_LINE_HEIGHT = 16
const EVENT_LABEL_PADDING_X = 8
const EVENT_LABEL_PADDING_Y = 6
const EVENT_LABEL_WIDTH = 156
const EVENT_HOVER_DISTANCE = 8
const EVENT_DATE_FONT_SIZE = 14
const EVENT_LABEL_FONT_SIZE = 12.5
const MONTH_LABEL_FONT_SIZE = 14

interface PositionedGridEvent {
  date: string
  event: TimelineEvent
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
      const eventY = p.height - 136
      const events = getPositionedEvents(state, p.width, eventY)
      const hoveredEvent = checkEventHover(p, events)

      p.cursor(hoveredEvent ? p.HAND : p.ARROW)
      state.setHoveredEvent(createHoverPayload(hoveredEvent, p.width, p.height))
      p.clear()
      p.background(...baseColorRgb.background)
      drawDivisions(p, state)
      drawEventAnchors(p, events, hoveredEvent)
      drawEvents(p, events, hoveredEvent)
    }
  }

  return new p5(sketch, container)
}

function drawDivisions(p: p5, state: StrategyTimelineGridSketchState) {
  const divisionWidth = p.width / state.divisions

  p.textAlign(p.LEFT, p.TOP)
  p.textSize(MONTH_LABEL_FONT_SIZE)

  for (let index = 0; index < state.divisions; index += 1) {
    const x = index * divisionWidth
    const labelDate = new Date(
      state.startDate.getFullYear(),
      state.startDate.getMonth() + index,
      1,
    )

    p.stroke(...baseColorRgb.text, 36)
    p.strokeWeight(1)
    p.line(x, 0, x, p.height)

    p.noStroke()
    p.fill(...baseColorRgb.text, 150)
    p.push()
    p.translate(x + 4, p.height - 18)
    p.rotate(-p.HALF_PI)
    p.text(formatMonthLabel(labelDate), 0, 0)
    p.pop()
  }

  p.stroke(...baseColorRgb.text, 36)
  p.strokeWeight(1)
  p.line(p.width, 0, p.width, p.height)
}

function drawEventAnchors(
  p: p5,
  events: PositionedGridEvent[],
  hoveredEvent: PositionedGridEvent | null,
) {
  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id

    p.stroke(...baseColorRgb.text, hovered ? 170 : 76)
    p.strokeWeight(2)
    p.line(event.x, 0, event.x, p.height)
  })
}

function drawEvents(
  p: p5,
  events: PositionedGridEvent[],
  hoveredEvent: PositionedGridEvent | null,
) {
  p.textStyle(p.BOLD)

  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id
    const textX = getEventTextX(event)

    p.noStroke()
    if (hovered) {
      const fillWidth = getEventLabelWidth(p, event)

      p.fill(...baseColorRgb.text, 255)
      p.rect(
        event.x,
        event.y - EVENT_LABEL_PADDING_Y,
        fillWidth + EVENT_LABEL_PADDING_X + (textX - event.x),
        EVENT_LABEL_HEIGHT + EVENT_LABEL_PADDING_Y * 2,
        0,
        6,
        6,
        0,
      )
    }

    const textColor = hovered ? baseColorRgb.ink : baseColorRgb.text

    p.fill(textColor[0], textColor[1], textColor[2], hovered ? 255 : 240)
    p.textSize(EVENT_DATE_FONT_SIZE)
    p.textAlign(p.LEFT, p.TOP)
    p.text(event.date, textX, event.y, EVENT_LABEL_WIDTH)

    p.textStyle(p.NORMAL)
    p.fill(textColor[0], textColor[1], textColor[2], hovered ? 255 : 220)
    p.textSize(EVENT_LABEL_FONT_SIZE)
    p.text(event.label, textX, event.y + EVENT_LABEL_LINE_HEIGHT, EVENT_LABEL_WIDTH)
    p.textStyle(p.BOLD)
  })

  p.textStyle(p.NORMAL)
}

function getPositionedEvents(
  state: StrategyTimelineGridSketchState,
  width: number,
  y: number,
) {
  const divisionWidth = width / state.divisions

  return state.events
    .map((event) => {
      const date = parseEventDate(event.date)
      if (!date) return null
      const monthOffset = getMonthOffset(state.startDate, date)
      const x = clamp(monthOffset, 0, state.divisions) * divisionWidth

      return {
        date: formatIsoDate(event.date, event.endDate),
        event,
        label: event.label,
        x,
        y,
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
}

function checkEventHover(p: p5, events: PositionedGridEvent[]) {
  if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return null

  return events.find((event) => isEventLineHovered(p, event) || isEventLabelHovered(p, event)) ?? null
}

function isEventLineHovered(p: p5, event: PositionedGridEvent) {
  return Math.abs(p.mouseX - event.x) <= EVENT_HOVER_DISTANCE
}

function isEventLabelHovered(p: p5, event: PositionedGridEvent) {
  const textX = getEventTextX(event)

  return (
    p.mouseX >= textX &&
    p.mouseX <= textX + EVENT_LABEL_WIDTH &&
    p.mouseY >= event.y &&
    p.mouseY <= event.y + EVENT_LABEL_HEIGHT
  )
}

function createHoverPayload(
  event: PositionedGridEvent | null,
  width: number,
  height: number,
): HoveredTimelineEvent | null {
  if (!event) return null

  return {
    ...event.event,
    xRatio: event.x / width,
    yRatio: event.y / height,
  }
}

function getEventTextX(event: PositionedGridEvent) {
  return event.x + 8
}

function getEventLabelWidth(p: p5, event: PositionedGridEvent) {
  p.textStyle(p.BOLD)
  p.textSize(EVENT_DATE_FONT_SIZE)
  const dateWidth = p.textWidth(event.date)

  p.textStyle(p.NORMAL)
  p.textSize(EVENT_LABEL_FONT_SIZE)
  const labelWidth = p.textWidth(event.label)

  return Math.min(EVENT_LABEL_WIDTH, Math.max(dateWidth, labelWidth))
}

function getMonthOffset(startDate: Date, date: Date) {
  return (
    (date.getFullYear() - startDate.getFullYear()) * 12 +
    date.getMonth() -
    startDate.getMonth()
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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
