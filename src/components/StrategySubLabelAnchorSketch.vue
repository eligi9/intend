<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import { createStrategyAnchorTextSketch } from '../sketches/strategyAnchorTextSketch'

const props = defineProps<{
  anchors: string[]
}>()

const sketchHost = ref<HTMLElement | null>(null)
let sketch: p5 | null = null

function createSketch() {
  if (!sketchHost.value) return null

  return createStrategyAnchorTextSketch(sketchHost.value, {
    anchors: props.anchors,
  })
}

onMounted(async () => {
  await nextTick()
  sketch = createSketch()
})

watch(
  () => props.anchors,
  () => {
    sketch?.remove()
    sketch = createSketch()
  },
)

onBeforeUnmount(() => {
  sketch?.remove()
})
</script>

<template>
  <div ref="sketchHost" class="strategy-sub-label-anchor-sketch" />
</template>

<style scoped>
.strategy-sub-label-anchor-sketch {
  width: 100%;
  height: 100%;
  min-height: 260px;
  overflow: hidden;
}
</style>
