import { forceCollide, forceSimulation, forceX, forceY } from 'd3-force'
import type { Simulation, SimulationNodeDatum } from 'd3-force'
import p5 from 'p5'
import type { PatternLabelKey, IntentRecord } from '../types/intentData'
import type {
  HoveredBeeswarmStatement,
  StrategyBeeswarmSketchState,
} from '../types/strategyBeeswarm'
import { intentTaxonomy } from '../utils/intentTaxonomy'
import {
  formatRgbColor,
  readCanvasBaseColors,
  readCssColorRgb,
  type CanvasBaseColors,
  type RgbColor,
} from '../utils/colorTokens'
import {
  readCssLengthTokenInPixels,
  readCssNumberToken,
  readCssToken,
} from '../utils/cssTokens'
import { intentLabelNames, strategyColors } from '../utils/intentLabels'
import { getPatternAnnotation, isPatternActive } from '../utils/intentRecordPatterns'
import { setupResizableP5Canvas } from '../utils/p5Canvas'
import { createTimelinePoints } from '../utils/timelineScale'

interface BeeswarmNode extends SimulationNodeDatum {
  bandMaxY: number
  bandMinY: number
  date: Date
  id: string
  record: IntentRecord
  subLabel: PatternLabelKey
  strategyLabel: PatternLabelKey
  strategyName: string
  targetX: number
  targetY: number
  x: number
  y: number
}

interface BeeswarmBand {
  childLabels: PatternLabelKey[]
  id: PatternLabelKey
  label: string
  maxY: number
  minY: number
  y: number
}

interface BandToggleButton {
  band: BeeswarmBand
  maxX: number
  maxY: number
  minX: number
  minY: number
}

const DOT_RADIUS = 5
const HOVERED_DOT_RADIUS = 7
const DOT_EDGE_PADDING = HOVERED_DOT_RADIUS + 2
const SUBDUED_DOT_SCALE = 0.5
const DIMMED_OPACITY_TOKEN = '--opacity-dimmed'

const strategyGroups = intentTaxonomy.map((group) => ({
  childLabels: group.childLabels,
  superLabel: group.parentLabel as PatternLabelKey,
}))

export function createStrategyBeeswarmSketch(
  container: HTMLElement,
  state: StrategyBeeswarmSketchState,
) {
  const colors = readCanvasBaseColors()
  const pointColors = readStrategyPointColors()
  const buttonFontFamily = readCssToken('--font-sans')
  const dimmedAlpha = Math.round(readCssNumberToken(DIMMED_OPACITY_TOKEN) * 255)
  let cleanupCanvas: (() => void) | null = null
  let expandedBandId = state.expandedBandId
  let layoutKey = ''
  let nodes: BeeswarmNode[] = []
  let patternLabelFont: p5.Font
  let simulation: Simulation<BeeswarmNode, undefined> | null = null

  const sketch = (p: p5) => {
    p.preload = () => {
      patternLabelFont = p.loadFont('/fonts/Montserrat-Medium.ttf')
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
      const timelinePoints = createTimelinePoints(
        state.statements,
        state.timeDomain.startDate,
        state.timeDomain.endDate,
      )
      const bands = createBeeswarmBands(getSwarmTop(), getSwarmBottom(p), expandedBandId)
      const nextLayoutKey = createLayoutKey(p, timelinePoints.length, expandedBandId)

      if (nextLayoutKey !== layoutKey) {
        layoutKey = nextLayoutKey
        nodes = createBeeswarmNodes(timelinePoints, bands, p.width, expandedBandId)
        simulation = createBeeswarmSimulation(nodes, expandedBandId)
      }

      tickSimulation(simulation, nodes, p.width)

      const hoveredPoint = checkHover(p, nodes, expandedBandId)
      const hoveredBand = checkBandHover(p, bands)

      p.cursor(hoveredPoint || hoveredBand ? p.HAND : p.ARROW)
      state.setHoveredStatement(createHoverPayload(hoveredPoint, p, colors, pointColors))

      p.clear()
      drawBands(
        p,
        bands,
        state.selectedLabels,
        colors,
        pointColors,
        expandedBandId,
        hoveredBand?.id ?? null,
        patternLabelFont,
        buttonFontFamily,
      )
      nodes.forEach((node) =>
        drawNode(
          p,
          node,
          hoveredPoint,
          state.selectedLabels,
          colors,
          pointColors,
          expandedBandId,
          dimmedAlpha,
        ),
      )
    }

    p.mousePressed = () => {
      const pressedPoint = checkHover(p, nodes, expandedBandId)
      if (pressedPoint) {
        state.setPressedStatement(createHoverPayload(pressedPoint, p, colors, pointColors))
        return
      }

      const bands = createBeeswarmBands(getSwarmTop(), getSwarmBottom(p), expandedBandId)
      const pressedBand = checkBandHover(p, bands)
      if (!pressedBand) return

      expandedBandId = expandedBandId === pressedBand.id ? null : pressedBand.id
      state.setExpandedBandId(expandedBandId)
      layoutKey = ''
    }

    p.mouseReleased = () => {
      state.setPressedStatement(null)
    }
  }

  return new p5(sketch, container)
}

// Splits the vertical drawing area into one invisible lane per main label.
function createBeeswarmBands(
  minY: number,
  maxY: number,
  expandedBandId: PatternLabelKey | null,
) {
  const bandGap = 0
  const totalHeight = maxY - minY
  const totalGap = bandGap * (strategyGroups.length - 1)
  const usableHeight = totalHeight - totalGap
  const expandedHeight = totalHeight * 0.618
  const collapsedHeight = expandedBandId
    ? (usableHeight - expandedHeight) / (strategyGroups.length - 1)
    : usableHeight / strategyGroups.length
  let bandTop = minY

  return strategyGroups.map((group) => {
    const bandHeight =
      expandedBandId && group.superLabel === expandedBandId
        ? expandedHeight
        : collapsedHeight
    const bandMinY = bandTop
    const bandMaxY = bandMinY + bandHeight
    bandTop = bandMaxY + bandGap

    return {
      childLabels: group.childLabels,
      id: group.superLabel,
      label: intentLabelNames[group.superLabel],
      maxY: bandMaxY,
      minY: bandMinY,
      y: bandMinY + bandHeight / 2,
    }
  })
}

function createBeeswarmNodes(
  timelinePoints: ReturnType<typeof createTimelinePoints>,
  bands: BeeswarmBand[],
  width: number,
  expandedBandId: PatternLabelKey | null,
) {
  const bandByLabel = new Map(bands.map((band) => [band.id, band]))

  return timelinePoints.flatMap((point) =>
    getActiveStrategyPoints(point.record).map((strategy) => {
      const band = bandByLabel.get(strategy.superLabel) as BeeswarmBand
      const id = `${point.record.id}:${strategy.label}`
      const targetX = point.ratio * width

      const subRowIndex = band.childLabels.indexOf(strategy.label)
      const subRowHeight = (band.maxY - band.minY) / band.childLabels.length
      const expanded = band.id === expandedBandId
      const nodeMinY = expanded ? band.minY + subRowIndex * subRowHeight : band.minY
      const nodeMaxY = expanded ? nodeMinY + subRowHeight : band.maxY

      return {
        bandMaxY: nodeMaxY,
        bandMinY: nodeMinY,
        date: point.date,
        id,
        record: point.record,
        subLabel: strategy.label,
        strategyLabel: strategy.superLabel,
        strategyName: intentLabelNames[strategy.label],
        targetX,
        targetY: expanded ? nodeMinY + subRowHeight / 2 : band.y,
        x: targetX + getDeterministicOffset(id, 18),
        y: (expanded ? nodeMinY + subRowHeight / 2 : band.y) + getDeterministicOffset(id, 42),
      }
    }),
  )
}

function drawBands(
  p: p5,
  bands: BeeswarmBand[],
  selectedLabels: PatternLabelKey[],
  colors: CanvasBaseColors,
  pointColors: Partial<Record<PatternLabelKey, RgbColor>>,
  expandedBandId: PatternLabelKey | null,
  hoveredBandId: PatternLabelKey | null,
  patternLabelFont: p5.Font,
  buttonFontFamily: string,
) {
  const labelInset = readCssLengthTokenInPixels('--space-1')

  p.textFont(patternLabelFont)
  p.textAlign(p.RIGHT, p.TOP)
  p.textSize(readCssLengthTokenInPixels('--font-size-0'))
  p.textStyle(p.BOLD)

  bands.forEach((band) => {
    const selected = selectedLabels.length === 0 || selectedLabels.includes(band.id)
    const subdued = expandedBandId !== null && band.id !== expandedBandId
    const expanded = band.id === expandedBandId
    const toggleHovered = band.id === hoveredBandId
    const color = getPointColor(band.id, colors, pointColors)
    const alpha = subdued ? 7 : selected ? 26 : 12
    const strokeAlpha = subdued ? 14 : selected ? 58 : 24

    p.noStroke()
    p.fill(color[0], color[1], color[2], alpha)
    p.rect(0, band.minY, p.width, band.maxY - band.minY, 8)

    p.stroke(color[0], color[1], color[2], strokeAlpha)
    p.strokeWeight(1)
    p.line(0, band.minY, p.width, band.minY)
    p.line(0, band.maxY, p.width, band.maxY)

    if (expanded) {
      const rowHeight = (band.maxY - band.minY) / band.childLabels.length

      band.childLabels.forEach((label, index) => {
        const rowTop = band.minY + rowHeight * index

        if (index > 0) {
          p.stroke(color[0], color[1], color[2], 42)
          p.strokeWeight(1)
          p.line(0, rowTop, p.width, rowTop)
        }

        p.noStroke()
        p.fill(color[0], color[1], color[2], 220)
        p.textAlign(p.RIGHT, p.BOTTOM)
        p.text(
          intentLabelNames[label],
          p.width - labelInset,
          rowTop + rowHeight - labelInset,
        )
      })
    }

    drawBandToggleButton(
      p,
      band,
      color,
      expanded,
      toggleHovered,
      subdued,
      selected,
      labelInset,
      expandedBandId === null || expanded,
      buttonFontFamily,
    )
    p.textAlign(p.RIGHT, p.TOP)
  })

  p.textStyle(p.NORMAL)
}

function createBeeswarmSimulation(
  nodes: BeeswarmNode[],
  expandedBandId: PatternLabelKey | null,
) {
  const collisionRadius = 7.5

  const simulation = forceSimulation<BeeswarmNode>(nodes)
    .alpha(1)
    .alphaDecay(0.018)
    .velocityDecay(0.28)
    .force('x', forceX<BeeswarmNode>((node) => node.targetX).strength(0.22))
    .force('y', forceY<BeeswarmNode>((node) => node.targetY).strength(0.11))
    .force(
      'collide',
      forceCollide<BeeswarmNode>((node) =>
        expandedBandId !== null && node.strategyLabel !== expandedBandId
          ? collisionRadius * SUBDUED_DOT_SCALE
          : collisionRadius,
      )
        .strength(1)
        .iterations(5),
    )
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

function checkHover(
  p: p5,
  nodes: BeeswarmNode[],
  expandedBandId: PatternLabelKey | null,
) {
  return nodes.find(
    (node) =>
      (expandedBandId === null || node.strategyLabel === expandedBandId) &&
      p.dist(p.mouseX, p.mouseY, node.x, node.y) <= HOVERED_DOT_RADIUS + 3.5,
  ) ?? null
}

function checkBandHover(p: p5, bands: BeeswarmBand[]) {
  if (p.mouseX < 0 || p.mouseX > p.width) return null

  return bands.find((band) => p.mouseY >= band.minY && p.mouseY <= band.maxY) ?? null
}

function createBandToggleButton(p: p5, band: BeeswarmBand): BandToggleButton {
  const inset = readCssLengthTokenInPixels('--space-1')
  const size = readCssLengthTokenInPixels('--space-4')
  const minX = p.width - inset - size
  const minY = band.minY + inset

  return {
    band,
    maxX: minX + size,
    maxY: minY + size,
    minX,
    minY,
  }
}

function drawBandToggleButton(
  p: p5,
  band: BeeswarmBand,
  color: RgbColor,
  expanded: boolean,
  hovered: boolean,
  subdued: boolean,
  selected: boolean,
  labelInset: number,
  showButton: boolean,
  buttonFontFamily: string,
) {
  if (showButton) {
    p.push()
    const button = createBandToggleButton(p, band)
    const active = expanded || hovered
    const radius = readCssLengthTokenInPixels('--space-1')
    const centerX = (button.minX + button.maxX) / 2
    const centerY = (button.minY + button.maxY) / 2

    p.stroke(color[0], color[1], color[2], active ? 255 : 153)
    p.strokeWeight(1)
    p.fill(active ? color[0] : 255, active ? color[1] : 255, active ? color[2] : 255)
    p.rect(
      button.minX,
      button.minY,
      button.maxX - button.minX,
      button.maxY - button.minY,
      radius,
    )

    p.noStroke()
    p.fill(active ? 255 : color[0], active ? 255 : color[1], active ? 255 : color[2])
    p.textFont(buttonFontFamily)
    p.textAlign(p.CENTER, p.CENTER)
    p.textSize(readCssLengthTokenInPixels('--font-size-0'))
    p.textStyle(p.BOLD)
    p.text(expanded ? '▼' : '▶', centerX, centerY)
    p.pop()
  }

  if (!expanded) {
    p.fill(color[0], color[1], color[2], subdued ? 60 : selected ? 180 : 92)
    p.textAlign(p.RIGHT, p.BOTTOM)
    p.text(band.label, p.width - labelInset, band.maxY - labelInset)
  }
}

function createLayoutKey(
  p: p5,
  pointCount: number,
  expandedBandId: PatternLabelKey | null,
) {
  return `${p.width}:${p.height}:${pointCount}:${expandedBandId ?? 'closed'}`
}

function getSwarmTop() {
  return 0
}

function getSwarmBottom(p: p5) {
  return p.height
}

function createHoverPayload(
  node: BeeswarmNode | null,
  p: p5,
  colors: CanvasBaseColors,
  pointColors: Partial<Record<PatternLabelKey, RgbColor>>,
): HoveredBeeswarmStatement | null {
  if (!node) return null

  return {
    anchorText: getAnchorText(node.record, node.subLabel),
    author: node.record.author,
    color: formatRgbColor(getPointColor(node.strategyLabel, colors, pointColors)),
    date: node.record.date,
    id: node.id,
    label: node.subLabel,
    record: node.record,
    source: node.record.source,
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
  selectedLabels: PatternLabelKey[],
  colors: CanvasBaseColors,
  pointColors: Partial<Record<PatternLabelKey, RgbColor>>,
  expandedBandId: PatternLabelKey | null,
  dimmedAlpha: number,
) {
  const hovered = hoveredNode?.id === node.id
  const sameSubLabel = !hoveredNode || node.subLabel === hoveredNode.subLabel
  const selected = selectedLabels.length === 0 || selectedLabels.includes(node.strategyLabel)
  const inSubduedBand = expandedBandId !== null && node.strategyLabel !== expandedBandId
  const highlighted = selected && sameSubLabel && !inSubduedBand
  const dimmedByHover = hoveredNode !== null && !sameSubLabel
  const color = highlighted || dimmedByHover
    ? getPointColor(node.strategyLabel, colors, pointColors)
    : colors.text
  const scale = inSubduedBand ? SUBDUED_DOT_SCALE : 1
  const radius = hovered ? HOVERED_DOT_RADIUS : DOT_RADIUS
  const strokeWeight = hovered ? 3.5 : 3

  p.noFill()
  p.stroke(color[0], color[1], color[2], highlighted ? 235 : dimmedAlpha)
  p.strokeWeight(strokeWeight * scale)
  p.circle(node.x, node.y, radius * 2 * scale)
}

function getDeterministicOffset(value: string, amplitude: number) {
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0)

  return ((hash % 101) / 100 - 0.5) * amplitude
}

function getAnchorText(record: IntentRecord, label: PatternLabelKey) {
  const anchors = getPatternAnnotation(record, label)?.anchors ?? []

  return anchors.length > 0 ? anchors : null
}

// Converts one record into all active sublabel dots that should appear in the plot.
function getActiveStrategyPoints(record: IntentRecord) {
  return strategyGroups.flatMap((group) =>
    group.childLabels
      .filter((label) => isPatternActive(record, label))
      .map((label) => ({
        label,
        superLabel: group.superLabel,
      })),
  )
}

function readStrategyPointColors() {
  return Object.fromEntries(
    Object.entries(strategyColors).map(([label, color]) => [label, readCssColorRgb(color)]),
  ) as Partial<Record<PatternLabelKey, RgbColor>>
}

function getPointColor(
  label: PatternLabelKey,
  colors: CanvasBaseColors,
  pointColors: Partial<Record<PatternLabelKey, RgbColor>>,
) {
  return pointColors[label] ?? colors.text
}
