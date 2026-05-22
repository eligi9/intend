<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import type { HoveredTimelineStatement } from '../../sketches/authorTimelineSketch'
import { createAuthorTimelineSketch } from '../../sketches/authorTimelineSketch'
import TimelineDatePill from '../timeline-date-pill/TimelineDatePill.vue'

const props = defineProps<{
  statements: IntentRecord[]
  selectedLabels?: IntentLabelKey[]
}>()

const timelineHost = ref<HTMLElement | null>(null)
const hoveredStatement = ref<HoveredTimelineStatement | null>(null)
let sketch: p5 | null = null

onMounted(async () => {
  if (!timelineHost.value) return

  await nextTick()
  sketch = createAuthorTimelineSketch(timelineHost.value, {
    statements: props.statements,
    selectedLabels: props.selectedLabels ?? [],
    setHoveredStatement: (payload) => {
      hoveredStatement.value = payload
    },
  })
})

watch(
  () => [props.statements, props.selectedLabels] as const,
  ([statements, selectedLabels]) => {
    sketch?.remove()
    sketch = timelineHost.value
      ? createAuthorTimelineSketch(timelineHost.value, {
          statements,
          selectedLabels: selectedLabels ?? [],
          setHoveredStatement: (payload) => {
            hoveredStatement.value = payload
          },
        })
      : null
  },
)

onBeforeUnmount(() => {
  sketch?.remove()
})
</script>

<template>
  <section class="author-timeline author-timeline--p5" aria-label="Interaktive Statement Timeline">
    <div ref="timelineHost" class="author-timeline__canvas" />
    <TimelineDatePill
      v-if="hoveredStatement"
      :label="hoveredStatement.date"
      :x-ratio="hoveredStatement.xRatio"
      :y-ratio="hoveredStatement.yRatio"
    />
  </section>
</template>

<style scoped>
@import './AuthorTimeline.css';
</style>
