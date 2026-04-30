import { defineStore } from 'pinia'
import type { CanvasNode, CanvasSettings } from '../types/visualization'

const colors = ['#2f80ed', '#f2994a', '#27ae60', '#eb5757', '#9b51e0', '#00a8a8']

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `node-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createNode(index: number): CanvasNode {
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

export const useVisualizationStore = defineStore('visualization', {
  state: () => ({
    nodes: Array.from({ length: 14 }, (_, index) => createNode(index)) as CanvasNode[],
    settings: {
      speed: 1,
      attraction: 0.35,
      showTrails: true,
    } as CanvasSettings,
  }),

  getters: {
    selectedNode: (state) => state.nodes.find((node) => node.selected) ?? null,
    averageValue: (state) =>
      Math.round(state.nodes.reduce((sum, node) => sum + node.value, 0) / state.nodes.length),
  },

  actions: {
    addNode() {
      this.nodes.push(createNode(this.nodes.length))
    },

    selectNode(id: string | null) {
      this.nodes.forEach((node) => {
        node.selected = node.id === id
      })
    },

    updateNodePosition(id: string, x: number, y: number) {
      const node = this.nodes.find((item) => item.id === id)

      if (!node) return

      node.x = x
      node.y = y
      node.vx = 0
      node.vy = 0
    },

    randomizeValues() {
      this.nodes.forEach((node, index) => {
        node.value = 20 + Math.round(Math.random() * 80)
        node.radius = 12 + node.value * 0.18
        node.color = colors[(index + Math.round(Math.random() * colors.length)) % colors.length]
      })
    },

    setSpeed(speed: number) {
      this.settings.speed = speed
    },

    setAttraction(attraction: number) {
      this.settings.attraction = attraction
    },

    toggleTrails() {
      this.settings.showTrails = !this.settings.showTrails
    },
  },
})
