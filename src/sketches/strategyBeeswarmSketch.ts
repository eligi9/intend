import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { intentLabelNames } from '../utils/intentLabels'
import { createTimelineModel } from '../utils/timelineScale'
import type { TimelineEvent } from './authorTimelineSketch'

interface StrategyBeeswarmSketchState {
  events?: TimelineEvent[]
  minPaddingX?: number
  paddingXRatio?: number
  selectedLabels: IntentLabelKey[]
  setHoveredStatement: (payload: HoveredBeeswarmStatement | null) => void
  setPositionedEvents?: (payload: PositionedBeeswarmEvent[]) => void
  statements: IntentRecord[]
}

interface BeeswarmPoint {
  date: Date
  id: string
  label: string
  record: IntentRecord
  subLabel: IntentLabelKey
  strategyLabel: IntentLabelKey
  strategyName: string
  x: number
  y: number
}

interface BeeswarmNode extends SimulationNodeDatum {
  date: Date
  id: string
  label: string
  record: IntentRecord
  subLabel: IntentLabelKey
  strategyLabel: IntentLabelKey
  strategyName: string
  targetX: number
  x: number
  y: number
}

export interface HoveredBeeswarmStatement {
  anchorText: string | null
  author: string
  date: string
  id: string
  statement: string
  strategy: string
  xRatio: number
  yRatio: number
}

export interface HoveredBeeswarmEvent {
  date: string
  description: string
  direction: 'down' | 'up'
  id: string
  label: string
  sourceName: string
  sourceUrl: string
  xRatio: number
  yRatio: number
}

export type PositionedBeeswarmEvent = HoveredBeeswarmEvent

const MS_PER_DAY = 24 * 60 * 60 * 1000
const TIMELINE_START_DATE = new Date(2023, 9, 1)

const strategyLineColors: Partial<Record<IntentLabelKey, [number, number, number]>> = {
  enemy_image: [255, 92, 120],
  just_cause: [214, 103, 255],
  individual_needs: [99, 136, 255],
  rhetorical_foreclosure: [134, 183, 118],
}

const strategyGroups = intentTaxonomy.flatMap((group) =>
  group.parentLabel
    ? [
        {
          childLabels: group.childLabels,
          superLabel: group.parentLabel,
        },
      ]
    : [],
)

export function createStrategyBeeswarmSketch(container: HTMLElement, state: StrategyBeeswarmSketchState) {
  let resizeObserver: ResizeObserver | null = null
  let positionedEventsKey = '__initial__'
  let beeswarmLayoutKey = ''
  let beeswarmNodes: BeeswarmNode[] = []
  let beeswarmSimulation: Simulation<BeeswarmNode, undefined> | null = null

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
      const parsedEvents = (state.events ?? [])
        .map((event) => ({ event, date: parseEventDate(event.date) }))
        .filter((item): item is { event: TimelineEvent; date: Date } => item.date !== null)
      const model = createTimelineModel(state.statements, TIMELINE_START_DATE)
      const visibleEvents = parsedEvents.filter(
        ({ date }) => date >= model.startDate && date <= model.endDate,
      )
      const paddingX = Math.max(state.minPaddingX ?? 42, p.width * (state.paddingXRatio ?? 0.05))
      const topPadding = Math.max(34, p.height * 0.08)
      const eventSpace = visibleEvents.length > 0 ? 78 : 28
      const axisY = p.height - eventSpace
      const swarmTop = topPadding
      const swarmBottom = axisY - Math.max(28, p.height * 0.08)
      const swarmCenterY = swarmTop + (swarmBottom - swarmTop) / 2
      const drawableWidth = p.width - paddingX * 2
      const range = Math.max(MS_PER_DAY, model.endDate.getTime() - model.startDate.getTime())
      const rawPoints = model.points.flatMap((point) =>
        getActiveStrategyPoints(point.record).map((strategy) => ({
          date: point.date,
          id: `${point.record.id}:${strategy.label}`,
          label: point.label,
          record: point.record,
          strategyLabel: strategy.superLabel,
          strategyName: intentLabelNames[strategy.label],
          subLabel: strategy.label,
          x: paddingX + point.ratio * drawableWidth,
        })),
      )
      const nextBeeswarmLayoutKey = [
        p.width,
        p.height,
        model.startDate.getTime(),
        model.endDate.getTime(),
        rawPoints.map((point) => `${point.id}:${Math.round(point.x)}`).join('|'),
      ].join(':')

      if (nextBeeswarmLayoutKey !== beeswarmLayoutKey) {
        beeswarmLayoutKey = nextBeeswarmLayoutKey
        const layout = createBeeswarmLayout(rawPoints, swarmCenterY, swarmTop, swarmBottom, axisY)
        beeswarmNodes = layout.nodes
        beeswarmSimulation = layout.simulation
      }

      if (beeswarmSimulation && beeswarmSimulation.alpha() > 0.012) {
        for (let tick = 0; tick < 2; tick += 1) {
          beeswarmSimulation.tick()
        }

        beeswarmNodes.forEach((node) => {
          node.x = Math.min(p.width - paddingX, Math.max(paddingX, node.x))
          node.y = Math.min(swarmBottom, Math.max(swarmTop, node.y))
        })
      }

      const points = beeswarmNodes.map((node) => ({
        date: node.date,
        id: node.id,
        label: node.label,
        record: node.record,
        subLabel: node.subLabel,
        strategyLabel: node.strategyLabel,
        strategyName: node.strategyName,
        x: node.x,
        y: node.y,
      }))
      const events = visibleEvents.map(({ event, date }) => ({
        date,
        event,
        x: paddingX + ((date.getTime() - model.startDate.getTime()) / range) * drawableWidth,
        y: axisY + 42,
      }))
      const hoveredPoint =
        points.find((point) => p.dist(p.mouseX, p.mouseY, point.x, point.y) <= 11) ?? null

      p.cursor(hoveredPoint ? p.HAND : p.ARROW)
      state.setHoveredStatement(
        hoveredPoint
          ? {
              anchorText: getAnchorText(hoveredPoint.record, hoveredPoint.subLabel),
              author: hoveredPoint.record.author,
              date: hoveredPoint.label,
              id: hoveredPoint.id,
              statement: hoveredPoint.record.statement,
              strategy: hoveredPoint.strategyName,
              xRatio: hoveredPoint.x / p.width,
              yRatio: hoveredPoint.y / p.height,
          }
          : null,
      )

      p.clear()
      p.background(48, 48, 48)

      drawAxis(p, model.ticks, paddingX, drawableWidth, axisY, swarmTop)

      events.forEach((event) => {
        drawEventAnchor(p, event.x, axisY, event.y)
      })

      if (state.setPositionedEvents) {
        const positionedEvents = events.map((event) => ({
          date: formatIsoDate(event.event.date, event.event.endDate),
          description: event.event.description,
          direction: 'up' as const,
          id: event.event.id,
          label: event.event.label,
          sourceName: event.event.sourceName,
          sourceUrl: event.event.sourceUrl,
          xRatio: event.x / p.width,
          yRatio: event.y / p.height,
        }))
        const nextKey = positionedEvents
          .map((event) => `${event.id}:${event.xRatio.toFixed(4)}:${event.yRatio.toFixed(4)}`)
          .join('|')

        if (nextKey !== positionedEventsKey) {
          positionedEventsKey = nextKey
          state.setPositionedEvents(positionedEvents)
        }
      }

      points.forEach((point) => {
        const hovered = hoveredPoint?.id === point.id
        const matchesHoveredLabel = !hoveredPoint || point.subLabel === hoveredPoint.subLabel
        const color = getPointColor(point.strategyLabel)
        const hasActiveFilters = state.selectedLabels.length > 0
        const visible = !hasActiveFilters || state.selectedLabels.includes(point.strategyLabel)
        const highlighted = visible && matchesHoveredLabel
        const fillColor = highlighted ? color ?? [245, 243, 238] : [245, 243, 238]

        p.stroke(48, 48, 48, highlighted ? 230 : 105)
        p.strokeWeight(hovered ? 2.5 : 1.8)
        p.fill(fillColor[0], fillColor[1], fillColor[2], highlighted ? 235 : 42)
        p.circle(point.x, point.y, hovered ? 15 : 11)
      })
    }
  }

  return new p5(sketch, container)
}

function createBeeswarmLayout(
  rawPoints: Array<Omit<BeeswarmPoint, 'y'>>,
  centerY: number,
  minY: number,
  maxY: number,
  startY: number,
) {
  const radius = 6.4
  const nodes: BeeswarmNode[] = rawPoints.map((point) => ({
    date: point.date,
    id: point.id,
    label: point.label,
    record: point.record,
    subLabel: point.subLabel,
    strategyLabel: point.strategyLabel,
    strategyName: point.strategyName,
    targetX: point.x,
    x: point.x + getDeterministicOffset(point.id, 18),
    y: startY - 12 + getDeterministicOffset(point.id, 24),
  }))
  const simulation = forceSimulation<BeeswarmNode>(nodes)
    .alpha(1)
    .alphaDecay(0.018)
    .velocityDecay(0.28)
    .force('x', forceX<BeeswarmNode>((node) => node.targetX).strength(0.22))
    .force('y', forceY<BeeswarmNode>(centerY).strength(0.075))
    .force('collide', forceCollide<BeeswarmNode>(radius + 1.2).strength(1).iterations(5))
    .stop()

  nodes.forEach((node) => {
    node.x = Math.min(rawPoints[rawPoints.length - 1]?.x ?? node.x, Math.max(rawPoints[0]?.x ?? node.x, node.x))
    node.y = Math.min(maxY, Math.max(minY, node.y))
  })

  return {
    nodes,
    simulation,
  }
}

function getDeterministicOffset(value: string, amplitude: number) {
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0)

  return ((hash % 101) / 100 - 0.5) * amplitude
}

function getAnchorText(record: IntentRecord, label: IntentLabelKey) {
  const anchorKey = `${label}_anchor` as keyof IntentRecord
  const anchor = record[anchorKey]

  return typeof anchor === 'string' && anchor.trim().length > 0 ? anchor : null
}

function getActiveStrategyPoints(record: IntentRecord) {
  return strategyGroups.flatMap((group) =>
    group.childLabels
      .filter((label) => record[label] === 'yes')
      .map((label) => ({
        label,
        superLabel: group.superLabel,
      })),
  )
}

function drawAxis(
  p: p5,
  ticks: Array<{ label: string; ratio: number }>,
  paddingX: number,
  drawableWidth: number,
  axisY: number,
  gridTop: number,
) {
  p.stroke(245, 243, 238, 112)
  p.strokeWeight(2)
  p.line(paddingX, axisY, p.width - paddingX, axisY)

  p.textAlign(p.CENTER, p.TOP)
  p.textSize(Math.max(10, p.width * 0.011))
  ticks.forEach((tick) => {
    const x = paddingX + tick.ratio * drawableWidth
    p.stroke(245, 243, 238, 38)
    p.strokeWeight(1)
    p.line(x, gridTop, x, axisY)
    p.stroke(245, 243, 238, 102)
    p.strokeWeight(2)
    p.line(x, axisY - 8, x, axisY + 8)
    p.noStroke()
    p.fill(245, 243, 238, 150)
    p.text(tick.label, x, axisY + 18)
  })
}

function drawEventAnchor(p: p5, x: number, axisY: number, iconY: number) {
  const color: [number, number, number] = [75, 224, 240]
  const iconTop = iconY - 15

  p.stroke(color[0], color[1], color[2], 210)
  p.strokeWeight(2)
  p.line(x, axisY, x, iconTop - 3)
  p.noStroke()
  p.fill(color[0], color[1], color[2], 235)
  p.circle(x, axisY, 10)
}

function getPointColor(label: IntentLabelKey) {
  return strategyLineColors[label] ?? [245, 243, 238]
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

function formatEventDate(date: string) {
  const parsed = parseEventDate(date)

  if (!parsed) return date

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed)
}
