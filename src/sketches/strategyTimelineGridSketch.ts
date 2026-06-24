import p5 from 'p5'
import type {
  PositionedStrategyTimelineEvent,
  StrategyTimelineGridSketchState,
} from '../types/strategyBeeswarm'
import type { TimelineDomain, TimelineEvent } from '../types/timeline'

const EVENT_LABEL_HEIGHT = 34

export function createStrategyTimelineGridSketch(
  container: HTMLElement,
  state: StrategyTimelineGridSketchState,
) {
  let resizeObserver: ResizeObserver | null = null
  let positionedEventsKey = '__initial__'

  const getCanvasSize = () => {
    const bounds = container.getBoundingClientRect()

    return {
      width: Math.max(320, Math.floor(bounds.width || container.clientWidth || window.innerWidth)),
      height: Math.max(280, Math.floor(bounds.height || container.clientHeight || window.innerHeight * 0.46)),
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
      const domain = getTimelineDomain(state.startDate, state.endDate)
      const range = getTimeRange(domain)
      const eventY = p.height - 60
      const events = getPositionedEvents(state.events, domain, p.width, eventY)

      p.clear()
      p.background(48, 48, 48)
      drawDivisions(p, domain, range, state.divisions)
      drawEventAnchors(p, events)
      syncPositionedEvents(p, events, state.setPositionedEvents, (nextKey) => {
        positionedEventsKey = nextKey
      }, positionedEventsKey)
    }
  }

  return new p5(sketch, container)
}

function drawDivisions(p: p5, domain: TimelineDomain, range: number, divisions: number) {
  const divisionCount = Math.max(1, Math.floor(divisions))
  const divisionWidth = p.width / divisionCount

  p.textAlign(p.LEFT, p.TOP)
  p.textSize(12)

  for (let index = 0; index < divisionCount; index += 1) {
    const x = index * divisionWidth
    const nextX = index === divisionCount - 1 ? p.width : x + divisionWidth
    const labelDate = getDateAtRatio(index / divisionCount, domain, range)

    p.noStroke()
    p.fill(245, 243, 238, index % 2 === 0 ? 9 : 4)
    p.rect(x, 0, nextX - x, p.height)

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
  events: Array<{ x: number; y: number }>,
) {
  events.forEach((event) => {
    p.stroke(245, 243, 238, 76)
    p.strokeWeight(2)
    p.line(event.x, 0, event.x, Math.min(p.height, event.y + EVENT_LABEL_HEIGHT))
  })
}

function syncPositionedEvents(
  p: p5,
  events: Array<PositionedStrategyTimelineEvent & { x: number; y: number }>,
  setPositionedEvents: (payload: PositionedStrategyTimelineEvent[]) => void,
  setKey: (key: string) => void,
  currentKey: string,
) {
  const positionedEvents = events.map(({ x, y, ...event }) => ({
    ...event,
    xRatio: x / p.width,
    yRatio: y / p.height,
  }))
  const nextKey = positionedEvents
    .map((event) => `${event.id}:${event.xRatio.toFixed(4)}:${event.yRatio.toFixed(4)}`)
    .join('|')

  if (nextKey !== currentKey) {
    setKey(nextKey)
    setPositionedEvents(positionedEvents)
  }
}

function getPositionedEvents(
  events: TimelineEvent[],
  domain: TimelineDomain,
  width: number,
  y: number,
) {
  const range = getTimeRange(domain)

  return events
    .map((event) => {
      const date = parseEventDate(event.date)

      if (!date) return null

      const xRatio = getDateRatio(date, domain, range)

      return {
        date: formatIsoDate(event.date, event.endDate),
        description: event.description,
        direction: 'up' as const,
        id: event.id,
        label: event.label,
        sourceName: event.sourceName,
        sourceUrl: event.sourceUrl,
        x: xRatio * width,
        xRatio,
        y,
        yRatio: 0,
      }
    })
    .filter((event): event is NonNullable<typeof event> => event !== null)
}

function getDateRatio(date: Date, domain: TimelineDomain, range = getTimeRange(domain)) {
  return Math.min(1, Math.max(0, (date.getTime() - domain.startDate.getTime()) / range))
}

function getDateAtRatio(ratio: number, domain: TimelineDomain, range = getTimeRange(domain)) {
  return new Date(domain.startDate.getTime() + ratio * range)
}

function getTimelineDomain(startDate: Date, endDate: Date): TimelineDomain {
  return { startDate, endDate }
}

function getTimeRange(domain: TimelineDomain) {
  return Math.max(1, domain.endDate.getTime() - domain.startDate.getTime())
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
