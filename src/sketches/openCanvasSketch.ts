import p5 from 'p5'
import type { CanvasNode, CanvasSettings } from '../types/visualization'

interface SketchState {
  nodes: CanvasNode[]
  settings: CanvasSettings
  selectNode: (id: string | null) => void
  moveNode: (id: string, x: number, y: number) => void
}

export function createOpenCanvasSketch(container: HTMLElement, state: SketchState) {
  let draggedNodeId: string | null = null
  let resizeObserver: ResizeObserver | null = null

  const getCanvasSize = () => {
    const bounds = container.getBoundingClientRect()

    return {
      width: Math.max(320, Math.floor(bounds.width || container.clientWidth || window.innerWidth)),
      height: Math.max(360, Math.floor(bounds.height || container.clientHeight || window.innerHeight * 0.62)),
    }
  }

  const sketch = (p: p5) => {
    const resize = () => {
      const { width, height } = getCanvasSize()
      p.resizeCanvas(width, height)
    }

    const findNodeAt = (x: number, y: number) => {
      return [...state.nodes].reverse().find((node) => p.dist(x, y, node.x, node.y) <= node.radius)
    }

    const getTouchPoint = () => {
      const [touch] = p.touches as Array<{ x: number; y: number }>

      return touch ?? null
    }

    const startDrag = (x: number, y: number) => {
      const node = findNodeAt(x, y)
      draggedNodeId = node?.id ?? null
      state.selectNode(draggedNodeId)
    }

    const moveDrag = (x: number, y: number) => {
      if (!draggedNodeId) return
      state.moveNode(draggedNodeId, x, y)
    }

    const endDrag = () => {
      draggedNodeId = null
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
      if (state.settings.showTrails) {
        p.background(247, 244, 238, 32)
      } else {
        p.background(247, 244, 238)
      }

      const centerX = p.width / 2
      const centerY = p.height / 2

      state.nodes.forEach((node) => {
        if (draggedNodeId !== node.id) {
          node.vx += ((centerX - node.x) / p.width) * state.settings.attraction * 0.03
          node.vy += ((centerY - node.y) / p.height) * state.settings.attraction * 0.03
          node.x += node.vx * state.settings.speed
          node.y += node.vy * state.settings.speed
          node.vx *= 0.992
          node.vy *= 0.992
        }

        if (node.x < node.radius || node.x > p.width - node.radius) node.vx *= -1
        if (node.y < node.radius || node.y > p.height - node.radius) node.vy *= -1

        node.x = p.constrain(node.x, node.radius, p.width - node.radius)
        node.y = p.constrain(node.y, node.radius, p.height - node.radius)
      })

      drawConnections(p, state.nodes)
      state.nodes.forEach((node) => drawNode(p, node))
    }

    p.mousePressed = () => {
      startDrag(p.mouseX, p.mouseY)
    }

    p.mouseDragged = () => {
      moveDrag(p.mouseX, p.mouseY)
    }

    p.mouseReleased = () => {
      endDrag()
    }

    p.touchStarted = () => {
      const touch = getTouchPoint()
      if (touch) startDrag(touch.x, touch.y)
      return false
    }

    p.touchMoved = () => {
      const touch = getTouchPoint()
      if (touch) moveDrag(touch.x, touch.y)
      return false
    }

    p.touchEnded = () => {
      endDrag()
      return false
    }
  }

  return new p5(sketch, container)
}

function drawConnections(p: p5, nodes: CanvasNode[]) {
  p.strokeWeight(1)

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const first = nodes[i]
      const second = nodes[j]
      const distance = p.dist(first.x, first.y, second.x, second.y)

      if (distance > 170) continue

      p.stroke(40, 44, 52, p.map(distance, 0, 170, 90, 0))
      p.line(first.x, first.y, second.x, second.y)
    }
  }
}

function drawNode(p: p5, node: CanvasNode) {
  p.noStroke()
  p.fill(node.color)
  p.circle(node.x, node.y, node.radius * 2)

  if (node.selected) {
    p.noFill()
    p.stroke(25, 25, 25)
    p.strokeWeight(3)
    p.circle(node.x, node.y, node.radius * 2 + 10)
  }

  p.noStroke()
  p.fill(255)
  p.textAlign(p.CENTER, p.CENTER)
  p.textSize(12)
  p.text(String(node.value), node.x, node.y)
}
