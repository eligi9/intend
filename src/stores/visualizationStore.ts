import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CanvasNode, CanvasSettings } from '../types/visualization'
import { createNode, randomNodeStyle } from '../utils/visualizationNodes'

export const useVisualizationStore = defineStore('visualization', () => {
  const nodes = ref<CanvasNode[]>(Array.from({ length: 14 }, (_, index) => createNode(index)))
  const settings = ref<CanvasSettings>({
    speed: 1,
    attraction: 0.35,
    showTrails: true,
  })

  const selectedNode = computed(() => nodes.value.find((node) => node.selected) ?? null)
  const averageValue = computed(() =>
    Math.round(nodes.value.reduce((sum, node) => sum + node.value, 0) / nodes.value.length),
  )

  function addNode() {
    nodes.value.push(createNode(nodes.value.length))
  }

  function selectNode(id: string | null) {
    nodes.value.forEach((node) => {
      node.selected = node.id === id
    })
  }

  function updateNodePosition(id: string, x: number, y: number) {
    const node = nodes.value.find((item) => item.id === id)

    if (!node) return

    node.x = x
    node.y = y
    node.vx = 0
    node.vy = 0
  }

  function randomizeValues() {
    nodes.value.forEach((node, index) => {
      Object.assign(node, randomNodeStyle(index))
    })
  }

  function setSpeed(speed: number) {
    settings.value.speed = speed
  }

  function setAttraction(attraction: number) {
    settings.value.attraction = attraction
  }

  function toggleTrails() {
    settings.value.showTrails = !settings.value.showTrails
  }

  return {
    nodes,
    settings,
    selectedNode,
    averageValue,
    addNode,
    selectNode,
    updateNodePosition,
    randomizeValues,
    setSpeed,
    setAttraction,
    toggleTrails,
  }
})
