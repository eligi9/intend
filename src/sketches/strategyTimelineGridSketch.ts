import p5 from 'p5'
import type { StrategyTimelineGridSketchState } from '../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineEvent } from '../types/timeline'
import {
  readCanvasBaseColors,
  readCssColorRgba,
  type CanvasBaseColors,
  type RgbaColor,
} from '../utils/colorTokens'
import { readCssLengthTokenInPixels } from '../utils/cssTokens'
import { setupResizableP5Canvas } from '../utils/p5Canvas'

const EVENT_LABEL_LINE_HEIGHT = 16
const EVENT_LABEL_PADDING_X = 8
const EVENT_LABEL_WIDTH = 108
const EVENT_DATE_FONT_SIZE_TOKEN = '--font-size-0'
const EVENT_LABEL_FONT_SIZE_TOKEN = '--font-size-0'
const EVENT_LABEL_GAP_TOKEN = '--space-half'
const EVENT_LABEL_PADDING_Y_TOKEN = '--space-1'
const MONTH_LABEL_FILTER_GAP_TOKEN = '--space-1'
const MONTH_LABEL_FONT_SIZE_TOKEN = '--font-size-0'
const TIMELINE_FILTER_HEIGHT_TOKEN = '--space-8'

interface EventFontSizes {
  date: number
  gap: number
  label: number
  paddingY: number
}

interface TimelineBlackTones {
  black: RgbaColor
  black80: RgbaColor
  eventLineActive: RgbaColor
  eventLineInactive: RgbaColor
  gridLegend: RgbaColor
  gridLine: RgbaColor
}

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
  const blackTones = readTimelineBlackTones()
  const eventFontSizes = readEventFontSizes()
  const filterHeight = readCssLengthTokenInPixels(TIMELINE_FILTER_HEIGHT_TOKEN)
  let cleanupCanvas: (() => void) | null = null
  let hoveredTimelineEvent: PositionedGridEvent | null = null
  let monthLabelFont: p5.Font

  const sketch = (p: p5) => {
    p.preload = () => {
      monthLabelFont = p.loadFont('/fonts/Montserrat-Medium.ttf')
    }

    cleanupCanvas = setupResizableP5Canvas(p, container, {
      fallbackHeightRatio: 0.46,
      minHeight: 280,
    })

    p.remove = ((remove) => () => {
      cleanupCanvas?.()
      remove()
    })(p.remove.bind(p))

    p.draw = () => {
      const eventY = p.height - filterHeight - 120
      const events = getPositionedEvents(state, p.width, eventY)
      const hoveredEvent = checkEventHover(p, events)
      hoveredTimelineEvent = hoveredEvent

      p.textFont('Montserrat')
      p.cursor(hoveredEvent ? p.HAND : p.ARROW)
      state.setHoveredEvent(createHoverPayload(hoveredEvent, p.width, p.height))
      p.clear()
      p.background(...colors.background)
      drawDivisions(p, state, colors, blackTones, monthLabelFont, filterHeight)
      drawEventAnchors(p, events, hoveredEvent, blackTones)
      drawEvents(p, events, hoveredEvent, colors, blackTones, eventFontSizes)
    }

    p.mouseClicked = () => {
      const sourceUrl = hoveredTimelineEvent?.event.sourceUrl
      if (!sourceUrl) return

      window.open(sourceUrl, '_blank', 'noopener,noreferrer')
    }
  }

  return new p5(sketch, container)
}

function drawDivisions(
  p: p5,
  state: StrategyTimelineGridSketchState,
  colors: CanvasBaseColors,
  blackTones: TimelineBlackTones,
  monthLabelFont: p5.Font,
  filterHeight: number,
) {
  const divisionWidth = p.width / state.divisions
  const filterGap = readCssLengthTokenInPixels(MONTH_LABEL_FILTER_GAP_TOKEN)

  p.textFont(monthLabelFont)
  p.textAlign(p.LEFT, p.TOP)
  p.textSize(readCssLengthTokenInPixels(MONTH_LABEL_FONT_SIZE_TOKEN))
  p.textStyle(p.NORMAL)

  for (let index = 0; index < state.divisions; index += 1) {
    const x = index * divisionWidth
    const labelDate = new Date(
      state.startDate.getFullYear(),
      state.startDate.getMonth() + index,
      1,
    )

    p.stroke(...blackTones.gridLine)
    p.strokeWeight(1)
    p.line(x, 0, x, p.height)

    p.noStroke()
    p.fill(...blackTones.gridLegend)
    p.push()
    p.translate(x + 4, Math.max(0, p.height - filterHeight - filterGap))
    p.rotate(-p.HALF_PI)
    p.text(formatMonthLabel(labelDate), 0, 0)
    p.pop()
  }

  p.stroke(...blackTones.gridLine)
  p.strokeWeight(1)
  p.line(p.width, 0, p.width, p.height)
  p.textFont('Montserrat')
}

function drawEventAnchors(
  p: p5,
  events: PositionedGridEvent[],
  hoveredEvent: PositionedGridEvent | null,
  blackTones: TimelineBlackTones,
) {
  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id

    p.stroke(...(hovered ? blackTones.eventLineActive : blackTones.eventLineInactive))
    p.strokeWeight(1)
    p.line(event.x, 0, event.x, p.height)
  })
}

function drawEvents(
  p: p5,
  events: PositionedGridEvent[],
  hoveredEvent: PositionedGridEvent | null,
  colors: CanvasBaseColors,
  blackTones: TimelineBlackTones,
  fontSizes: EventFontSizes,
) {
  p.textStyle(p.BOLD)

  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id
    const textX = getEventTextX(event)
    const labelLines = getEventLabelLines(p, event, fontSizes)
    const labelHeight = getEventLabelHeight(labelLines, fontSizes)

    p.noStroke()
    if (hovered) {
      const fillWidth = getEventLabelWidth(p, event, labelLines, fontSizes)

      p.fill(...blackTones.black)
      p.rect(
        event.x,
        event.y - fontSizes.paddingY,
        fillWidth + EVENT_LABEL_PADDING_X + (textX - event.x),
        labelHeight + fontSizes.paddingY * 2,
        0,
        6,
        6,
        0,
      )
    }

    const textColor = hovered ? colors.white : colors.text

    if (hovered) {
      p.fill(textColor[0], textColor[1], textColor[2], 255)
    } else {
      p.fill(...blackTones.black)
    }
    p.textFont('Montserrat')
    p.textStyle(p.BOLD)
    p.textSize(fontSizes.date)
    p.textAlign(p.LEFT, p.TOP)
    p.text(event.date, textX, event.y, EVENT_LABEL_WIDTH)

    p.textFont('Montserrat')
    p.textStyle(p.NORMAL)
    if (hovered) {
      p.fill(textColor[0], textColor[1], textColor[2], 255)
    } else {
      p.fill(...blackTones.black80)
    }
    p.textSize(fontSizes.label)
    labelLines.forEach((line, index) => {
      p.text(
        line,
        textX,
        event.y + fontSizes.date + fontSizes.gap + EVENT_LABEL_LINE_HEIGHT * index,
        EVENT_LABEL_WIDTH,
      )
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
  const fontSizes = readEventFontSizes()
  const textX = getEventTextX(event)
  const labelLines = getEventLabelLines(p, event, fontSizes)
  const labelHeight = getEventLabelHeight(labelLines, fontSizes)
  const fillWidth = getEventLabelWidth(p, event, labelLines, fontSizes)

  return (
    p.mouseX >= event.x &&
    p.mouseX <= event.x + fillWidth + EVENT_LABEL_PADDING_X + (textX - event.x) &&
    p.mouseY >= event.y - fontSizes.paddingY &&
    p.mouseY <= event.y + labelHeight + fontSizes.paddingY
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

function getEventLabelWidth(
  p: p5,
  event: PositionedGridEvent,
  labelLines: string[],
  fontSizes: EventFontSizes,
) {
  p.textFont('Montserrat')
  p.textStyle(p.BOLD)
  p.textSize(fontSizes.date)
  const dateWidth = p.textWidth(event.date)

  p.textFont('Montserrat')
  p.textStyle(p.NORMAL)
  p.textSize(fontSizes.label)
  const labelWidth = Math.max(...labelLines.map((line) => p.textWidth(line)))

  return Math.min(EVENT_LABEL_WIDTH, Math.max(dateWidth, labelWidth))
}

function getEventLabelLines(p: p5, event: PositionedGridEvent, fontSizes: EventFontSizes) {
  p.textStyle(p.NORMAL)
  p.textSize(fontSizes.label)

  return wrapText(p, event.label, EVENT_LABEL_WIDTH)
}

function readEventFontSizes(): EventFontSizes {
  return {
    date: readCssLengthTokenInPixels(EVENT_DATE_FONT_SIZE_TOKEN),
    gap: readCssLengthTokenInPixels(EVENT_LABEL_GAP_TOKEN),
    label: readCssLengthTokenInPixels(EVENT_LABEL_FONT_SIZE_TOKEN),
    paddingY: readCssLengthTokenInPixels(EVENT_LABEL_PADDING_Y_TOKEN),
  }
}

function readTimelineBlackTones(): TimelineBlackTones {
  return {
    black: readCssColorRgba('var(--color-black)'),
    black80: readCssColorRgba('var(--color-black-80)'),
    eventLineActive: readCssColorRgba('var(--color-event-line-active)'),
    eventLineInactive: readCssColorRgba('var(--color-event-line-inactive)'),
    gridLegend: readCssColorRgba('var(--color-grid-legend)'),
    gridLine: readCssColorRgba('var(--color-grid-line)'),
  }
}

function getEventLabelHeight(labelLines: string[], fontSizes: EventFontSizes) {
  const labelTextHeight =
    Math.max(0, labelLines.length - 1) * EVENT_LABEL_LINE_HEIGHT + fontSizes.label

  return fontSizes.date + fontSizes.gap + labelTextHeight
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
  if (date.getMonth() !== 0) return month

  return `${month}/${String(date.getFullYear()).slice(-2)}`
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
