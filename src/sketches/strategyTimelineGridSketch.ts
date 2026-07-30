import p5 from 'p5'
import type { StrategyTimelineGridSketchState } from '../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineEvent } from '../types/timeline'
import {
  readCanvasBaseColors,
  readCssColorRgba,
  type RgbaColor,
} from '../utils/colorTokens'
import { readCssLengthTokenInPixels, readCssToken } from '../utils/cssTokens'
import { setP5Cursor, setupResizableP5Canvas } from '../utils/p5Canvas'
import {
  formatShortIsoDate,
  formatTimelineMonthLabel,
  getCalendarMonthOffset,
  parseIsoDate,
} from '../utils/time'

const EVENT_LABEL_PADDING_X = 8
const EVENT_LABEL_WIDTH = 108
const EVENT_UNDERLINE_GAP = 4
const EVENT_UNDERLINE_OFFSET = 3
const EVENT_DATE_FONT_SIZE_TOKEN = '--font-size-0'
const EVENT_LABEL_FONT_SIZE_TOKEN = '--font-size-0'
const EVENT_LABEL_LINE_HEIGHT_TOKEN = '--line-height-0'
const EVENT_LABEL_GAP_TOKEN = '--space-half'
const EVENT_LABEL_PADDING_Y_TOKEN = '--space-1'
const MONTH_LABEL_FILTER_GAP_TOKEN = '--space-1'
const MONTH_LABEL_FONT_SIZE_TOKEN = '--font-size-0'
const TIMELINE_FILTER_HEIGHT_TOKEN = '--space-8'

interface EventTypography {
  date: number
  fontFamily: string
  gap: number
  label: number
  lineHeight: number
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
  const eventTypography = readEventTypography()
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
      const hoveredEvent = checkEventHover(p, events, eventTypography)
      hoveredTimelineEvent = hoveredEvent

      p.textFont(eventTypography.fontFamily)
      setP5Cursor(p, container, Boolean(hoveredEvent?.event.sourceUrl))
      state.setHoveredEvent(createHoverPayload(hoveredEvent, p.width, p.height))
      p.clear()
      p.background(...colors.background)
      drawDivisions(
        p,
        state,
        blackTones,
        monthLabelFont,
        eventTypography.fontFamily,
        filterHeight,
      )
      drawEventAnchors(p, events, hoveredEvent, blackTones)
      drawEvents(p, events, hoveredEvent, blackTones, eventTypography)
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
  blackTones: TimelineBlackTones,
  monthLabelFont: p5.Font,
  fontFamily: string,
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
    p.text(formatTimelineMonthLabel(labelDate), 0, 0)
    p.pop()
  }

  p.stroke(...blackTones.gridLine)
  p.strokeWeight(1)
  p.line(p.width, 0, p.width, p.height)
  p.textFont(fontFamily)
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
  blackTones: TimelineBlackTones,
  fontSizes: EventTypography,
) {
  p.textStyle(p.BOLD)

  events.forEach((event) => {
    const hovered = hoveredEvent?.event.id === event.event.id
    const textX = getEventTextX(event)
    const labelLines = getEventLabelLines(event)
    const labelHeight = getEventLabelHeight(labelLines, fontSizes)
    const underlineWidth = getEventLabelWidth(p, event, labelLines, fontSizes)

    p.noStroke()
    p.fill(...blackTones.black)
    p.textFont(fontSizes.fontFamily)
    p.textStyle(p.BOLD)
    p.textSize(fontSizes.date)
    p.textAlign(p.LEFT, p.TOP)
    p.text(event.date, textX, event.y, EVENT_LABEL_WIDTH)

    p.textFont(fontSizes.fontFamily)
    p.textStyle(p.NORMAL)
    if (hovered) {
      p.fill(...blackTones.black)
    } else {
      p.fill(...blackTones.black80)
    }
    p.textSize(fontSizes.label)
    labelLines.forEach((line, index) => {
      p.text(
        line,
        textX,
        event.y + fontSizes.date + fontSizes.gap + fontSizes.lineHeight * index,
      )
    })

    const underlineY = event.y + labelHeight + EVENT_UNDERLINE_OFFSET

    p.stroke(...blackTones.black)
    p.strokeWeight(1)
    p.line(textX, underlineY, textX + underlineWidth, underlineY)

    if (hovered) {
      p.line(
        textX,
        underlineY + EVENT_UNDERLINE_GAP,
        textX + underlineWidth,
        underlineY + EVENT_UNDERLINE_GAP,
      )
    }

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
      const date = parseIsoDate(event.date)
      if (!date) return null
      const monthOffset = getCalendarMonthOffset(state.startDate, date)
      const x = clamp(monthOffset, 0, state.divisions) * divisionWidth

      return {
        date: formatShortIsoDate(event.date),
        event,
        label: event.label,
        x,
        y,
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
}

function checkEventHover(
  p: p5,
  events: PositionedGridEvent[],
  typography: EventTypography,
) {
  if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return null

  return events.find((event) => isEventLabelHovered(p, event, typography)) ?? null
}

function isEventLabelHovered(p: p5, event: PositionedGridEvent, fontSizes: EventTypography) {
  const textX = getEventTextX(event)
  const labelLines = getEventLabelLines(event)
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
  fontSizes: EventTypography,
) {
  p.textFont(fontSizes.fontFamily)
  p.textStyle(p.BOLD)
  p.textSize(fontSizes.date)
  const dateWidth = p.textWidth(event.date)

  p.textFont(fontSizes.fontFamily)
  p.textStyle(p.NORMAL)
  p.textSize(fontSizes.label)
  const labelWidth = Math.max(...labelLines.map((line) => p.textWidth(line)))

  return Math.max(dateWidth, labelWidth)
}

function getEventLabelLines(event: PositionedGridEvent) {
  return [event.label]
}

function readEventTypography(): EventTypography {
  return {
    date: readCssLengthTokenInPixels(EVENT_DATE_FONT_SIZE_TOKEN),
    fontFamily: readPrimaryFontFamily('--font-sans'),
    gap: readCssLengthTokenInPixels(EVENT_LABEL_GAP_TOKEN),
    label: readCssLengthTokenInPixels(EVENT_LABEL_FONT_SIZE_TOKEN),
    lineHeight: readCssLengthTokenInPixels(EVENT_LABEL_LINE_HEIGHT_TOKEN),
    paddingY: readCssLengthTokenInPixels(EVENT_LABEL_PADDING_Y_TOKEN),
  }
}

function readPrimaryFontFamily(token: string) {
  return readCssToken(token).split(',')[0]?.trim().replace(/^['"]|['"]$/g, '') || 'sans-serif'
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

function getEventLabelHeight(labelLines: string[], fontSizes: EventTypography) {
  const labelTextHeight = Math.max(1, labelLines.length) * fontSizes.lineHeight

  return fontSizes.date + fontSizes.gap + labelTextHeight
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
