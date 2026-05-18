import { defineStore } from 'pinia'
import type { CanvasNode, CanvasSettings } from '../types/visualization'
import { createNode, randomNodeStyle } from '../utils/visualizationNodes'

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
        Object.assign(node, randomNodeStyle(index))
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
