<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentRecord } from '../../types/intentData'
import { createAuthorTimelineSketch } from '../../sketches/authorTimelineSketch'

const props = defineProps<{
  statements: IntentRecord[]
}>()

const timelineHost = ref<HTMLElement | null>(null)
let sketch: p5 | null = null

onMounted(async () => {
  if (!timelineHost.value) return

  await nextTick()
  sketch = createAuthorTimelineSketch(timelineHost.value, {
    statements: props.statements,
  })
})

watch(
  () => props.statements,
  (statements) => {
    sketch?.remove()
    sketch = timelineHost.value
      ? createAuthorTimelineSketch(timelineHost.value, {
          statements,
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
  </section>
</template>

<style scoped>
@import './AuthorTimeline.css';
</style>
