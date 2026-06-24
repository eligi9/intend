<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import type {
  HoveredTimelineEvent,
  HoveredTimelineStatement,
  PositionedTimelineEvent,
} from '../types/authorTimeline'
import { createAuthorTimelineSketch } from '../sketches/authorTimelineSketch'
import type { TimelineEvent } from '../types/timeline'
import TimelineEventIcon from './TimelineEventIcon.vue'
import TimelineDatePill from './TimelineDatePill.vue'

const props = defineProps<{
  events?: TimelineEvent[]
  minPaddingX?: number
  paddingXRatio?: number
  statements: IntentRecord[]
  selectedLabels?: IntentLabelKey[]
}>()

const timelineHost = ref<HTMLElement | null>(null)
const hoveredEvent = ref<HoveredTimelineEvent | null>(null)
const hoveredStatement = ref<HoveredTimelineStatement | null>(null)
const positionedEvents = ref<PositionedTimelineEvent[]>([])
let sketch: p5 | null = null
let eventHoverTimeout: number | null = null

function showEvent(event: HoveredTimelineEvent) {
  if (eventHoverTimeout !== null) {
    window.clearTimeout(eventHoverTimeout)
    eventHoverTimeout = null
  }

  hoveredEvent.value = event
}

function hideEvent() {
  eventHoverTimeout = window.setTimeout(() => {
    hoveredEvent.value = null
    eventHoverTimeout = null
  }, 90)
}

onMounted(async () => {
  if (!timelineHost.value) return

  await nextTick()
  sketch = createAuthorTimelineSketch(timelineHost.value, {
    events: props.events,
    minPaddingX: props.minPaddingX,
    paddingXRatio: props.paddingXRatio,
    statements: props.statements,
    selectedLabels: props.selectedLabels ?? [],
    setPositionedEvents: (payload) => {
      positionedEvents.value = payload
    },
    setHoveredStatement: (payload) => {
      hoveredStatement.value = payload
    },
  })
})

watch(
  () =>
    [
      props.statements,
      props.selectedLabels,
      props.events,
      props.minPaddingX,
      props.paddingXRatio,
    ] as const,
  ([statements, selectedLabels, events, minPaddingX, paddingXRatio]) => {
    sketch?.remove()
    sketch = timelineHost.value
      ? createAuthorTimelineSketch(timelineHost.value, {
          events,
          minPaddingX,
          paddingXRatio,
          statements,
          selectedLabels: selectedLabels ?? [],
          setPositionedEvents: (payload) => {
            positionedEvents.value = payload
          },
          setHoveredStatement: (payload) => {
            hoveredStatement.value = payload
          },
        })
      : null
  },
)

onBeforeUnmount(() => {
  if (eventHoverTimeout !== null) {
    window.clearTimeout(eventHoverTimeout)
  }

  sketch?.remove()
})
</script>

<template>
  <section class="author-timeline author-timeline--p5" aria-label="Interaktive Statement Timeline">
    <div ref="timelineHost" class="author-timeline__canvas" />
    <button
      v-for="event in positionedEvents"
      :key="event.id"
      type="button"
      class="author-timeline__event-marker"
      :class="{ 'author-timeline__event-marker--active': hoveredEvent?.id === event.id }"
      :style="{
        left: `${event.xRatio * 100}%`,
        top: `${event.yRatio * 100}%`,
      }"
      :aria-label="event.label"
      @mouseenter="showEvent(event)"
      @mouseleave="hideEvent"
      @focusin="showEvent(event)"
      @focusout="hideEvent"
    >
      <TimelineEventIcon :direction="event.direction" />
    </button>
    <aside
      v-if="hoveredEvent"
      class="author-timeline__event-tooltip"
      :style="{
        left: `${hoveredEvent.xRatio * 100}%`,
        top: `${hoveredEvent.yRatio * 100}%`,
      }"
      @mouseenter="showEvent(hoveredEvent)"
      @mouseleave="hideEvent"
    >
      <strong>{{ hoveredEvent.label }}</strong>
      <time>{{ hoveredEvent.date }}</time>
      <p>{{ hoveredEvent.description }}</p>
      <a :href="hoveredEvent.sourceUrl" target="_blank" rel="noreferrer">
        Source: {{ hoveredEvent.sourceName }}
      </a>
    </aside>
    <TimelineDatePill
      v-if="hoveredStatement && !hoveredEvent"
      :label="hoveredStatement.date"
      :x-ratio="hoveredStatement.xRatio"
      :y-ratio="hoveredStatement.yRatio"
    />
  </section>
</template>

<style scoped>
@import '../css/components/AuthorTimeline.css';
</style>
