import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import p5 from 'p5'
import { baseColorRgb, type RgbColor } from '../types/designTokens'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import type {
  HoveredBeeswarmStatement,
  StrategyBeeswarmSketchState,
} from '../types/strategyBeeswarm'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { intentLabelNames, splitAnchors } from '../utils/intentLabels'
import { setupResizableP5Canvas } from '../utils/p5Canvas'
import { createTimelineModel } from '../utils/timelineScale'

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
const DOT_RADIUS = 6
const HOVERED_DOT_RADIUS = 7.5
const DOT_EDGE_PADDING = HOVERED_DOT_RADIUS + 2

const strategyGroups = intentTaxonomy.map((group) => ({
  childLabels: group.childLabels,
  superLabel: group.parentLabel as IntentLabelKey,
}))

export function createStrategyBeeswarmSketch(container: HTMLElement, state: StrategyBeeswarmSketchState) {
  let cleanupCanvas: (() => void) | null = null
  let layoutKey = ''
  let nodes: BeeswarmNode[] = []
  let simulation: Simulation<BeeswarmNode, undefined> | null = null

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
      const timeline = createTimelineModel(
        state.statements,
        state.timeDomain.startDate,
        state.timeDomain.endDate,
      )
      const bands = createBeeswarmBands(getSwarmTop(p), getSwarmBottom(p))
      const nextLayoutKey = createLayoutKey(p, timeline.points.length)

      if (nextLayoutKey !== layoutKey) {
        layoutKey = nextLayoutKey
        nodes = createBeeswarmNodes(timeline.points, bands, p.width)
        simulation = createBeeswarmSimulation(nodes)
      }

      tickSimulation(simulation, nodes, p.width)

      const hoveredPoint = checkHover(p, nodes)

      p.cursor(hoveredPoint ? p.HAND : p.ARROW)
      state.setHoveredStatement(createHoverPayload(hoveredPoint, p))

      p.clear()
      nodes.forEach((node) => drawNode(p, node, hoveredPoint, state.selectedLabels))
    }
  }

  return new p5(sketch, container)
}

// Splits the vertical drawing area into one invisible lane per main label.
function createBeeswarmBands(minY: number, maxY: number) {
  const bandGap = 18
  const usableHeight = maxY - minY - bandGap * (strategyGroups.length - 1)
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

function createBeeswarmNodes(
  timelinePoints: ReturnType<typeof createTimelineModel>['points'],
  bands: BeeswarmBand[],
  width: number,
) {
  const bandByLabel = new Map(bands.map((band) => [band.id, band]))

  return timelinePoints.flatMap((point) =>
    getActiveStrategyPoints(point.record).map((strategy) => {
      const band = bandByLabel.get(strategy.superLabel) as BeeswarmBand
      const id = `${point.record.id}:${strategy.label}`
      const targetX = point.ratio * width

      return {
        bandMaxY: band.maxY,
        bandMinY: band.minY,
        date: point.date,
        id,
        label: point.label,
        record: point.record,
        subLabel: strategy.label,
        strategyLabel: strategy.superLabel,
        strategyName: intentLabelNames[strategy.label],
        targetX,
        targetY: band.y,
        x: targetX + getDeterministicOffset(id, 18),
        y: band.y + getDeterministicOffset(id, 42),
      }
    }),
  )
}

function createBeeswarmSimulation(nodes: BeeswarmNode[]) {
  const radius = 6.4

  const simulation = forceSimulation<BeeswarmNode>(nodes)
    .alpha(1)
    .alphaDecay(0.018)
    .velocityDecay(0.28)
    .force('x', forceX<BeeswarmNode>((node) => node.targetX).strength(0.22))
    .force('y', forceY<BeeswarmNode>((node) => node.targetY).strength(0.11))
    .force('collide', forceCollide<BeeswarmNode>(radius + 1.2).strength(1).iterations(5))
    .stop()

  return simulation
}

function tickSimulation(
  simulation: Simulation<BeeswarmNode, undefined> | null,
  nodes: BeeswarmNode[],
  maxX: number,
) {
  if (!simulation || simulation.alpha() <= 0.012) return

  for (let tick = 0; tick < 2; tick += 1) {
    simulation.tick()
  }

  nodes.forEach((node) => clampNode(node, maxX))
}

function clampNode(node: BeeswarmNode, maxX: number) {
  node.x = Math.min(maxX - DOT_EDGE_PADDING, Math.max(DOT_EDGE_PADDING, node.x))
  node.y = Math.min(node.bandMaxY, Math.max(node.bandMinY, node.y))
}

function checkHover(p: p5, nodes: BeeswarmNode[]) {
  return nodes.find((node) => p.dist(p.mouseX, p.mouseY, node.x, node.y) <= HOVERED_DOT_RADIUS + 3.5) ?? null
}

function createLayoutKey(p: p5, pointCount: number) {
  return `${p.width}:${p.height}:${pointCount}`
}

function getSwarmTop(p: p5) {
  return 16
}

function getSwarmBottom(p: p5) {
  return p.height - 16
}

function createHoverPayload(
  node: BeeswarmNode | null,
  p: p5,
): HoveredBeeswarmStatement | null {
  if (!node) return null

  return {
    anchorText: getAnchorText(node.record, node.subLabel),
    author: node.record.author,
    color: formatRgbColor(getPointColor(node.strategyLabel)),
    date: node.label,
    id: node.id,
    statement: node.record.statement,
    strategy: node.strategyName,
    xRatio: node.x / p.width,
    yRatio: node.y / p.height,
  }
}

function drawNode(
  p: p5,
  node: BeeswarmNode,
  hoveredNode: BeeswarmNode | null,
  selectedLabels: IntentLabelKey[],
) {
  const hovered = hoveredNode?.id === node.id
  const sameSubLabel = !hoveredNode || node.subLabel === hoveredNode.subLabel
  const selected = selectedLabels.length === 0 || selectedLabels.includes(node.strategyLabel)
  const highlighted = selected && sameSubLabel
  const color = highlighted ? getPointColor(node.strategyLabel) : baseColorRgb.text

  p.stroke(...baseColorRgb.background, highlighted ? 230 : 105)
  p.strokeWeight(hovered ? 2.5 : 1.8)
  p.fill(color[0], color[1], color[2], highlighted ? 235 : 42)
  p.circle(node.x, node.y, hovered ? HOVERED_DOT_RADIUS * 2 : DOT_RADIUS * 2)
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
  return strategyLineColors[label] ?? baseColorRgb.text
}

function formatRgbColor(color: RgbColor) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}
