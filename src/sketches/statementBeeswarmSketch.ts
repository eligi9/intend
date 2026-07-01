import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import p5 from 'p5'
import type { IntentRecord } from '../types/intentData'
import type {
  HoveredTimelineStatement,
  StatementBeeswarmSketchState,
} from '../types/strategyBeeswarm'
import { readCanvasBaseColors, type CanvasBaseColors } from '../utils/colorTokens'
import { setupResizableP5Canvas } from '../utils/p5Canvas'
import { createTimelineModel } from '../utils/timelineScale'

interface StatementNode extends SimulationNodeDatum {
  id: string
  record: IntentRecord
  targetX: number
  targetY: number
  x: number
  y: number
}

const DOT_RADIUS = 6
const HOVERED_DOT_RADIUS = 7.5
const DOT_EDGE_PADDING = HOVERED_DOT_RADIUS + 2

export function createStatementBeeswarmSketch(
  container: HTMLElement,
  state: StatementBeeswarmSketchState,
) {
  const colors = readCanvasBaseColors()
  let cleanupCanvas: (() => void) | null = null
  let layoutKey = ''
  let nodes: StatementNode[] = []
  let simulation: Simulation<StatementNode, undefined> | null = null

  const sketch = (p: p5) => {
    cleanupCanvas = setupResizableP5Canvas(p, container, {
      fallbackHeightRatio: 0.4,
      minHeight: 220,
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
      const nextLayoutKey = createLayoutKey(p, timeline.points.length)

      if (nextLayoutKey !== layoutKey) {
        layoutKey = nextLayoutKey
        nodes = createStatementNodes(timeline.points, p.width, p.height)
        simulation = createStatementSimulation(nodes)
      }

      tickSimulation(simulation, nodes, p.width, p.height)

      const hoveredNode = checkHover(p, nodes)

      p.cursor(hoveredNode ? p.HAND : p.ARROW)
      state.setHoveredStatement(createHoverPayload(hoveredNode, p))
      p.clear()
      nodes.forEach((node) => drawNode(p, node, hoveredNode, colors))
    }
  }

  return new p5(sketch, container)
}

function createStatementNodes(
  timelinePoints: ReturnType<typeof createTimelineModel>['points'],
  width: number,
  height: number,
) {
  const centerY = height / 2

  return timelinePoints.map((point) => ({
    id: point.id,
    record: point.record,
    targetX: point.ratio * width,
    targetY: centerY,
    x: point.ratio * width + getDeterministicOffset(point.id, 18),
    y: centerY + getDeterministicOffset(point.id, 42),
  }))
}

function createStatementSimulation(nodes: StatementNode[]) {
  return forceSimulation<StatementNode>(nodes)
    .alpha(1)
    .alphaDecay(0.018)
    .velocityDecay(0.28)
    .force('x', forceX<StatementNode>((node) => node.targetX).strength(0.22))
    .force('y', forceY<StatementNode>((node) => node.targetY).strength(0.11))
    .force('collide', forceCollide<StatementNode>(DOT_RADIUS + 1.6).strength(1).iterations(5))
    .stop()
}

function tickSimulation(
  simulation: Simulation<StatementNode, undefined> | null,
  nodes: StatementNode[],
  width: number,
  height: number,
) {
  if (!simulation || simulation.alpha() <= 0.012) return

  for (let tick = 0; tick < 2; tick += 1) {
    simulation.tick()
  }

  nodes.forEach((node) => clampNode(node, width, height))
}

function clampNode(node: StatementNode, width: number, height: number) {
  node.x = Math.min(width - DOT_EDGE_PADDING, Math.max(DOT_EDGE_PADDING, node.x))
  node.y = Math.min(height - DOT_EDGE_PADDING, Math.max(DOT_EDGE_PADDING, node.y))
}

function checkHover(p: p5, nodes: StatementNode[]) {
  return nodes.find((node) => p.dist(p.mouseX, p.mouseY, node.x, node.y) <= HOVERED_DOT_RADIUS + 3.5) ?? null
}

function createHoverPayload(
  node: StatementNode | null,
  p: p5,
): HoveredTimelineStatement | null {
  if (!node) return null

  return {
    author: node.record.author,
    date: node.record.date,
    id: node.id,
    source: node.record.source,
    statement: node.record.statement,
    xRatio: node.x / p.width,
    yRatio: node.y / p.height,
  }
}

function createLayoutKey(p: p5, pointCount: number) {
  return `${p.width}:${p.height}:${pointCount}`
}

function drawNode(
  p: p5,
  node: StatementNode,
  hoveredNode: StatementNode | null,
  colors: CanvasBaseColors,
) {
  const hovered = hoveredNode?.id === node.id
  const sameAuthor = hoveredNode?.record.author === node.record.author
  const highlighted = !hoveredNode || sameAuthor

  p.stroke(...colors.background, highlighted ? 230 : 70)
  p.strokeWeight(hovered ? 2.5 : 1.8)
  p.fill(...colors.text, highlighted ? 235 : 36)
  p.circle(node.x, node.y, hovered ? HOVERED_DOT_RADIUS * 2 : DOT_RADIUS * 2)
}

function getDeterministicOffset(value: string, amplitude: number) {
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0)

  return ((hash % 101) / 100 - 0.5) * amplitude
}
