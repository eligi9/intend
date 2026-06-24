import p5 from 'p5'
import { setupResizableP5Canvas } from '../utils/p5Canvas'

interface StrategyAnchorTextSketchState {
  anchors: string[]
}

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
  const visibleAnchors = anchors.slice(0, 12)

  p.noStroke()
  p.fill(255, 255, 255, 235)
  p.textFont('Source Serif 4')
  p.textAlign(p.CENTER, p.CENTER)
  p.textSize(Math.max(30, Math.min(58, p.width / 26)))
  p.textLeading(Math.max(34, Math.min(62, p.width / 24)))

  if (visibleAnchors.length === 0) {
    p.text('No anchor texts available.', p.width / 2, p.height / 2)
    return
  }

  const rowCount = Math.min(3, visibleAnchors.length)
  const columnCount = Math.ceil(visibleAnchors.length / rowCount)
  const textWidth = Math.min(680, p.width * 0.46)

  visibleAnchors.forEach((anchor, index) => {
    const row = index % rowCount
    const column = Math.floor(index / rowCount)
    const x = ((column + 0.5) / columnCount) * p.width + getOffset(anchor, 80)
    const y = ((row + 0.5) / rowCount) * p.height

    p.text(`“${anchor}”`, x, y, textWidth, p.height / rowCount)
  })
}

function getOffset(value: string, amplitude: number) {
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0)

  return ((hash % 101) / 100 - 0.5) * amplitude
}
