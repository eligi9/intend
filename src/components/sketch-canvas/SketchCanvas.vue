<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type p5 from 'p5'
import { storeToRefs } from 'pinia'
import { useVisualizationStore } from '../../stores/visualizationStore'
import { createOpenCanvasSketch } from '../../sketches/openCanvasSketch'

const canvasHost = ref<HTMLElement | null>(null)
const store = useVisualizationStore()
const { nodes, settings } = storeToRefs(store)

let sketch: p5 | null = null

onMounted(async () => {
  if (!canvasHost.value) return

  await nextTick()

  sketch = createOpenCanvasSketch(canvasHost.value, {
    nodes: nodes.value,
    settings: settings.value,
    selectNode: store.selectNode,
    moveNode: store.updateNodePosition,
  })
})

onBeforeUnmount(() => {
  sketch?.remove()
})
</script>

<template>
  <section ref="canvasHost" class="sketch-canvas" aria-label="Interaktive Canvas-Visualisierung" />
</template>

<style scoped>
@import './SketchCanvas.css';
</style>
