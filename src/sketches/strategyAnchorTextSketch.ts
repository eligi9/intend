import p5 from 'p5'
import { setupResizableP5Canvas } from '../utils/p5Canvas'

interface StrategyAnchorTextSketchState {
  anchors: string[]
}

const ROW_COUNT = 2
const SCROLL_SPEED = 0.12
const NEXT_START_AFTER_VISIBLE_SHARE = 0.75
const ANCHOR_GAP = 56

export function createStrategyAnchorTextSketch(
  container: HTMLElement,
  state: StrategyAnchorTextSketchState,
) {
  let cleanupCanvas: (() => void) | null = null

  const sketch = (p: p5) => {
    cleanupCanvas = setupResizableP5Canvas(p, container, {
      fallbackHeightRatio: 0.42,
      minHeight: 260,
    })

    p.remove = ((remove) => () => {
      cleanupCanvas?.()
      remove()
    })(p.remove.bind(p))

    p.draw = () => {
      p.clear()
      drawAnchors(p, state.anchors)
    }
  }

  return new p5(sketch, container)
}

function drawAnchors(p: p5, anchors: string[]) {
  p.noStroke()
  p.fill(255, 255, 255, 235)
  p.textFont('Source Serif 4')
  p.textSize(Math.max(24, Math.min(46, p.width / 32)))
  p.textLeading(Math.max(28, Math.min(52, p.width / 30)))

  if (anchors.length === 0) {
    p.textAlign(p.CENTER, p.CENTER)
    p.text('No anchor texts available.', p.width / 2, p.height / 2)
    return
  }

  const rowCount = Math.min(ROW_COUNT, anchors.length)
  const rowHeight = p.height / rowCount
  const labels = anchors.map((anchor) => `“${anchor}”`)
  const widths = labels.map((label) => p.textWidth(label))
  const placements = getAnchorPlacements(widths, rowCount)
  const sequenceWidth = getSequenceWidth(placements, widths, p.width)
  const offset = (p.millis() * SCROLL_SPEED) % sequenceWidth

  p.textAlign(p.LEFT, p.CENTER)

  labels.forEach((label, index) => {
    const placement = placements[index]
    const y = placement.row * rowHeight + rowHeight / 2

    drawLoopedAnchor(p, label, widths[index], placement.start, offset, sequenceWidth, y)
  })
}

function getAnchorPlacements(widths: number[], rowCount: number) {
  const placements: { row: number; start: number }[] = []
  const lastInRow = Array.from({ length: rowCount }, () => ({ start: -Infinity, width: 0 }))

  widths.forEach((width, index) => {
    const row = index % rowCount
    const previous = placements[index - 1]
    const desiredStart = previous
      ? previous.start + widths[index - 1] * NEXT_START_AFTER_VISIBLE_SHARE
      : 0
    const safeStart = Number.isFinite(lastInRow[row].start)
      ? lastInRow[row].start + lastInRow[row].width + ANCHOR_GAP
      : desiredStart
    const start = Math.max(desiredStart, safeStart)

    placements.push({ row, start })
    lastInRow[row] = { start, width }
  })

  return placements
}

function getSequenceWidth(
  placements: { row: number; start: number }[],
  widths: number[],
  canvasWidth: number,
) {
  const lastIndex = placements.length - 1
  const sequenceEnd =
    placements[lastIndex].start + widths[lastIndex] * NEXT_START_AFTER_VISIBLE_SHARE
  const widestText = Math.max(...widths)

  return Math.max(sequenceEnd, canvasWidth + widestText + ANCHOR_GAP)
}

function drawLoopedAnchor(
  p: p5,
  label: string,
  width: number,
  start: number,
  offset: number,
  sequenceWidth: number,
  y: number,
) {
  for (let copy = -1; copy <= 1; copy += 1) {
    const x = p.width + start - offset + copy * sequenceWidth

    if (x < p.width && x + width > 0) {
      p.text(label, x, y)
    }
  }
}
