<script setup lang="ts">
import { computed } from 'vue'
import type { IntentRecord } from '../../types/intentData'
import { createTimelineModel } from '../../utils/timelineScale'

const props = defineProps<{
  statements: IntentRecord[]
}>()

const model = computed(() => createTimelineModel(props.statements))

const viewBox = {
  width: 1000,
  height: 360,
  paddingX: 70,
  anchorY: 24,
  timelineY: 250,
}

const drawableWidth = viewBox.width - viewBox.paddingX * 2
const anchorX = viewBox.width / 2

const points = computed(() =>
  model.value.points.map((point) => {
    const x = viewBox.paddingX + point.ratio * drawableWidth
    const y = viewBox.timelineY - point.stackIndex * 18
    const curveLift = 78 + Math.min(72, Math.abs(anchorX - x) * 0.16)

    return {
      ...point,
      x,
      y,
      path: `M ${anchorX} ${viewBox.anchorY} C ${anchorX} ${viewBox.timelineY - curveLift}, ${x} ${viewBox.timelineY - curveLift}, ${x} ${y}`,
    }
  }),
)

const ticks = computed(() =>
  model.value.ticks.map((tick) => ({
    ...tick,
    x: viewBox.paddingX + tick.ratio * drawableWidth,
  })),
)
</script>

<template>
  <section class="author-timeline author-timeline--svg" aria-label="SVG Timeline">
    <header class="author-timeline__header">
      <small>SVG Timeline</small>
      <span>{{ model.points.length }} Statements</span>
    </header>

    <svg class="author-timeline__svg" :viewBox="`0 0 ${viewBox.width} ${viewBox.height}`" role="img">
      <title>Statement timeline as SVG</title>

      <line
        class="author-timeline__axis"
        :x1="viewBox.paddingX"
        :x2="viewBox.width - viewBox.paddingX"
        :y1="viewBox.timelineY"
        :y2="viewBox.timelineY"
      />

      <g v-for="tick in ticks" :key="tick.id" class="author-timeline__tick">
        <line :x1="tick.x" :x2="tick.x" :y1="viewBox.timelineY - 8" :y2="viewBox.timelineY + 8" />
        <text :x="tick.x" :y="viewBox.timelineY + 34">{{ tick.label }}</text>
      </g>

      <path
        v-for="point in points"
        :key="`${point.id}-curve`"
        class="author-timeline__curve"
        :d="point.path"
      />

      <g v-for="point in points" :key="point.id" class="author-timeline__point">
        <circle :cx="point.x" :cy="point.y" r="7" />
        <title>{{ point.label }}: {{ point.record.statement }}</title>
      </g>

      <circle class="author-timeline__anchor" :cx="anchorX" :cy="viewBox.anchorY" r="5" />
    </svg>
  </section>
</template>

<style scoped>
@import './AuthorTimeline.css';
</style>
