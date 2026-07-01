import p5 from 'p5'
import type { StrategyTimelineGridSketchState } from '../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineEvent } from '../types/timeline'
import { readCanvasBaseColors, type CanvasBaseColors } from '../utils/colorTokens'
import { setupResizableP5Canvas } from '../utils/p5Canvas'

const EVENT_LABEL_LINE_HEIGHT = 16
const EVENT_LABEL_PADDING_X = 8
const EVENT_LABEL_PADDING_Y = 6
const EVENT_LABEL_WIDTH = 108
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
  const colors = readCanvasBaseColors()
  let cleanupCanvas: (() => void) | null = null
  let hoveredTimelineEvent: PositionedGridEvent | null = null

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
      hoveredTimelineEvent = hoveredEvent

      p.cursor(hoveredEvent ? p.HAND : p.ARROW)
      state.setHoveredEvent(createHoverPayload(hoveredEvent, p.width, p.height))
      p.clear()
      p.background(...colors.background)
      drawDivisions(p, state, colors)
      drawEventAnchors(p, events, hoveredEvent, colors)
      drawEvents(p, events, hoveredEvent, colors)
    }

    p.mouseClicked = () => {
      const sourceUrl = hoveredTimelineEvent?.event.sourceUrl
      if (!sourceUrl) return

      window.open(sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return new p5(sketch, container)
}

function drawDivisions(p: p5, state: StrategyTimelineGridSketchState, colors: CanvasBaseColors) {
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

    p.stroke(...colors.text, 36)
    p.strokeWeight(1)
    p.line(x, 0, x, p.height)

    p.noStroke()
    p.fill(...colors.text, 150)
    p.push()
    p.translate(x + 4, p.height - 18)
    p.rotate(-p.HALF_PI)
    p.text(formatMonthLabel(labelDate), 0, 0)
    p.pop()
  }

  p.stroke(...colors.text, 36)
  p.strokeWeight(1)
  p.line(p.width, 0, p.width, p.height)
}

function drawEventAnchors(
  p: p5,
  events: PositionedGridEvent[],
  hoveredEvent: PositionedGridEvent | null,
  colors: CanvasBaseColors,
) {
  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id

    p.stroke(...colors.text, hovered ? 170 : 76)
    p.strokeWeight(1)
    p.line(event.x, 0, event.x, p.height)
  })
}

function drawEvents(
  p: p5,
  events: PositionedGridEvent[],
  hoveredEvent: PositionedGridEvent | null,
  colors: CanvasBaseColors,
) {
  p.textStyle(p.BOLD)

  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id
    const textX = getEventTextX(event)
    const labelLines = getEventLabelLines(p, event)
    const labelHeight = getEventLabelHeight(labelLines)

    p.noStroke()
    if (hovered) {
      const fillWidth = getEventLabelWidth(p, event, labelLines)

      p.fill(...colors.text, 255)
      p.rect(
        event.x,
        event.y - EVENT_LABEL_PADDING_Y,
        fillWidth + EVENT_LABEL_PADDING_X + (textX - event.x),
        labelHeight + EVENT_LABEL_PADDING_Y * 2,
        0,
        6,
        6,
        0,
      )
    }

    const textColor = hovered ? colors.ink : colors.text

    p.fill(textColor[0], textColor[1], textColor[2], hovered ? 255 : 240)
    p.textSize(EVENT_DATE_FONT_SIZE)
    p.textAlign(p.LEFT, p.TOP)
    p.text(event.date, textX, event.y, EVENT_LABEL_WIDTH)

    p.textStyle(p.NORMAL)
    p.fill(textColor[0], textColor[1], textColor[2], hovered ? 255 : 220)
    p.textSize(EVENT_LABEL_FONT_SIZE)
    labelLines.forEach((line, index) => {
      p.text(line, textX, event.y + EVENT_LABEL_LINE_HEIGHT * (index + 1), EVENT_LABEL_WIDTH)
    })
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
      const monthOffset = getCalendarMonthOffset(state.startDate, date)
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

  return events.find((event) => isEventLabelHovered(p, event)) ?? null
}

function isEventLabelHovered(p: p5, event: PositionedGridEvent) {
  const textX = getEventTextX(event)
  const labelLines = getEventLabelLines(p, event)
  const labelHeight = getEventLabelHeight(labelLines)
  const fillWidth = getEventLabelWidth(p, event, labelLines)

  return (
    p.mouseX >= event.x &&
    p.mouseX <= event.x + fillWidth + EVENT_LABEL_PADDING_X + (textX - event.x) &&
    p.mouseY >= event.y - EVENT_LABEL_PADDING_Y &&
    p.mouseY <= event.y + labelHeight + EVENT_LABEL_PADDING_Y
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

function getEventLabelWidth(p: p5, event: PositionedGridEvent, labelLines: string[]) {
  p.textStyle(p.BOLD)
  p.textSize(EVENT_DATE_FONT_SIZE)
  const dateWidth = p.textWidth(event.date)

  p.textStyle(p.NORMAL)
  p.textSize(EVENT_LABEL_FONT_SIZE)
  const labelWidth = Math.max(...labelLines.map((line) => p.textWidth(line)))

  return Math.min(EVENT_LABEL_WIDTH, Math.max(dateWidth, labelWidth))
}

function getEventLabelLines(p: p5, event: PositionedGridEvent) {
  p.textStyle(p.NORMAL)
  p.textSize(EVENT_LABEL_FONT_SIZE)

  return wrapText(p, event.label, EVENT_LABEL_WIDTH)
}

function getEventLabelHeight(labelLines: string[]) {
  return EVENT_LABEL_LINE_HEIGHT * (labelLines.length + 1)
}

function wrapText(p: p5, text: string, maxWidth: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (currentLine && p.textWidth(nextLine) > maxWidth) {
      lines.push(currentLine)
      currentLine = word
      return
    }

    currentLine = nextLine
  })

  if (currentLine) lines.push(currentLine)
  return lines
}

function getCalendarMonthOffset(startDate: Date, date: Date) {
  const monthOffset =
    (date.getFullYear() - startDate.getFullYear()) * 12 +
    date.getMonth() -
    startDate.getMonth()
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const dayOffset = (date.getDate() - 1) / daysInMonth

  return monthOffset + dayOffset
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
