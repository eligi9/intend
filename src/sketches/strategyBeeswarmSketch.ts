import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import type {
  HoveredBeeswarmStatement,
  StrategyBeeswarmSketchState,
} from '../types/strategyBeeswarm'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { intentLabelNames, splitAnchors } from '../utils/intentLabels'
import { createTimelineModel } from '../utils/timelineScale'

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
  bandMaxY: number
  bandMinY: number
  date: Date
  id: string
  label: string
  record: IntentRecord
  subLabel: IntentLabelKey
  strategyLabel: IntentLabelKey
  strategyName: string
  targetX: number
  targetY: number
  x: number
  y: number
}

interface BeeswarmBand {
  id: IntentLabelKey
  maxY: number
  minY: number
  y: number
}

const strategyLineColors: Partial<Record<IntentLabelKey, [number, number, number]>> = {
  enemy_image: [255, 92, 120],
  just_cause: [214, 103, 255],
  individual_needs: [99, 136, 255],
  rhetorical_foreclosure: [134, 183, 118],
}

// Only child labels become dots. Each child label keeps a reference to its
// parent strategy so dots can be separated vertically by main label.
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
      const model = createTimelineModel(
        state.statements,
        state.timeDomain.startDate,
        state.timeDomain.endDate,
      )

      // X is the shared timeline domain. Y is reserved for four invisible
      // bands, one for each main strategy label.
      const paddingX = 0
      const topPadding = Math.max(96, p.height * 0.12)
      const eventSpace = 124
      const axisY = p.height - eventSpace
      const swarmTop = topPadding
      const swarmBottom = axisY - Math.max(28, p.height * 0.08)
      const bands = createBeeswarmBands(swarmTop, swarmBottom)
      const drawableWidth = p.width

      // One statement can produce multiple dots when it has multiple active
      // strategy sublabels. The dot is colored and grouped by the parent label.
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
        bands
          .map(
            (band) =>
              `${band.id}:${Math.round(band.y)}:${Math.round(band.minY)}:${Math.round(band.maxY)}`,
          )
          .join('|'),
        rawPoints.map((point) => `${point.id}:${Math.round(point.x)}`).join('|'),
      ].join(':')

      // d3-force is relatively expensive, so rebuild it only when the input
      // layout has actually changed.
      if (nextBeeswarmLayoutKey !== beeswarmLayoutKey) {
        beeswarmLayoutKey = nextBeeswarmLayoutKey
        const layout = createBeeswarmLayout(rawPoints, bands, swarmTop, swarmBottom)
        beeswarmNodes = layout.nodes
        beeswarmSimulation = layout.simulation
      }

      if (beeswarmSimulation && beeswarmSimulation.alpha() > 0.012) {
        for (let tick = 0; tick < 2; tick += 1) {
          beeswarmSimulation.tick()
        }

        // Keep nodes inside their own main-label band after every simulation tick.
        beeswarmNodes.forEach((node) => {
          node.x = Math.min(p.width - paddingX, Math.max(paddingX, node.x))
          node.y = Math.min(node.bandMaxY, Math.max(node.bandMinY, node.y))
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
      const hoveredPoint =
        points.find((point) => p.dist(p.mouseX, p.mouseY, point.x, point.y) <= 11) ?? null

      // Hover data is passed back to Vue so the tooltip can be real HTML
      // instead of text painted into the canvas.
      p.cursor(hoveredPoint ? p.HAND : p.ARROW)
      state.setHoveredStatement(
        hoveredPoint
          ? {
              anchorText: getAnchorText(hoveredPoint.record, hoveredPoint.subLabel),
              author: hoveredPoint.record.author,
              color: formatRgbColor(getPointColor(hoveredPoint.strategyLabel)),
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

      points.forEach((point) => {
        // Filtering and hover do not remove dots; they change emphasis.
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

// Splits the vertical drawing area into one invisible lane per main label.
function createBeeswarmBands(minY: number, maxY: number) {
  const bandGap = 18
  const usableHeight = Math.max(1, maxY - minY - bandGap * (strategyGroups.length - 1))
  const bandHeight = usableHeight / strategyGroups.length

  return strategyGroups.map((group, index) => {
    const bandMinY = minY + index * (bandHeight + bandGap)
    const bandMaxY = bandMinY + bandHeight

    return {
      id: group.superLabel,
      maxY: bandMaxY,
      minY: bandMinY,
      y: bandMinY + bandHeight / 2,
    }
  })
}

function createBeeswarmLayout(
  rawPoints: Array<Omit<BeeswarmPoint, 'y'>>,
  bands: BeeswarmBand[],
  minY: number,
  maxY: number,
) {
  const radius = 6.4
  // The fallback keeps the sketch robust if data arrives with an unknown label.
  const fallbackBand = {
    maxY,
    minY,
    y: minY + (maxY - minY) / 2,
  }
  const bandByLabel = new Map(bands.map((band) => [band.id, band]))
  const nodes: BeeswarmNode[] = rawPoints.map((point) => {
    const band = bandByLabel.get(point.strategyLabel) ?? fallbackBand

    // targetX is the date on the timeline. targetY is the center of the
    // point's main-label lane.
    return {
      bandMaxY: band.maxY,
      bandMinY: band.minY,
      date: point.date,
      id: point.id,
      label: point.label,
      record: point.record,
      subLabel: point.subLabel,
      strategyLabel: point.strategyLabel,
      strategyName: point.strategyName,
      targetX: point.x,
      targetY: band.y,
      x: point.x + getDeterministicOffset(point.id, 18),
      y: band.y + getDeterministicOffset(point.id, 42),
    }
  })
  const simulation = forceSimulation<BeeswarmNode>(nodes)
    .alpha(1)
    .alphaDecay(0.018)
    .velocityDecay(0.28)
    .force('x', forceX<BeeswarmNode>((node) => node.targetX).strength(0.22))
    .force('y', forceY<BeeswarmNode>((node) => node.targetY).strength(0.11))
    .force('collide', forceCollide<BeeswarmNode>(radius + 1.2).strength(1).iterations(5))
    .stop()

  // Clamp the initial positions too, before the first draw tick happens.
  nodes.forEach((node) => {
    node.x = Math.min(rawPoints[rawPoints.length - 1]?.x ?? node.x, Math.max(rawPoints[0]?.x ?? node.x, node.x))
    node.y = Math.min(node.bandMaxY, Math.max(node.bandMinY, node.y))
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
  const anchors = splitAnchors(record[anchorKey])

  return anchors.length > 0 ? anchors : null
}

// Converts one record into all active sublabel dots that should appear in the plot.
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

function getPointColor(label: IntentLabelKey) {
  return strategyLineColors[label] ?? [245, 243, 238]
}

function formatRgbColor(color: [number, number, number]) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}
