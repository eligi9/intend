import type { CanvasNode } from '../types/visualization'

const colors = ['#2f80ed', '#f2994a', '#27ae60', '#eb5757', '#9b51e0', '#00a8a8']

export function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `node-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function createNode(index: number): CanvasNode {
  const value = 20 + Math.round(Math.random() * 80)

  return {
    id: createId(),
    label: `Objekt ${index + 1}`,
    value,
    x: 120 + Math.random() * 560,
    y: 80 + Math.random() * 360,
    vx: -0.8 + Math.random() * 1.6,
    vy: -0.8 + Math.random() * 1.6,
    radius: 12 + value * 0.18,
    color: colors[index % colors.length],
    selected: false,
  }
}

export function randomNodeStyle(index: number) {
  const value = 20 + Math.round(Math.random() * 80)

  return {
    value,
    radius: 12 + value * 0.18,
    color: colors[(index + Math.round(Math.random() * colors.length)) % colors.length],
  }
}
