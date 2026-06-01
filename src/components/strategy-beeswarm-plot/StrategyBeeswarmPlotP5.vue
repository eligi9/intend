<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import type { TimelineEvent } from '../../sketches/authorTimelineSketch'
import {
  createStrategyBeeswarmSketch,
  type HoveredBeeswarmEvent,
  type HoveredBeeswarmStatement,
  type PositionedBeeswarmEvent,
} from '../../sketches/strategyBeeswarmSketch'
import TimelineEventIcon from '../timeline-event-icon/TimelineEventIcon.vue'

const props = defineProps<{
  events?: TimelineEvent[]
  minPaddingX?: number
  paddingXRatio?: number
  selectedLabels?: IntentLabelKey[]
  statements: IntentRecord[]
}>()

const plotHost = ref<HTMLElement | null>(null)
const hoveredEvent = ref<HoveredBeeswarmEvent | null>(null)
const hoveredStatement = ref<HoveredBeeswarmStatement | null>(null)
const positionedEvents = ref<PositionedBeeswarmEvent[]>([])
let sketch: p5 | null = null
let eventHoverTimeout: number | null = null

function createSketch() {
  if (!plotHost.value) return null

  return createStrategyBeeswarmSketch(plotHost.value, {
    events: props.events,
    minPaddingX: props.minPaddingX,
    paddingXRatio: props.paddingXRatio,
    selectedLabels: props.selectedLabels ?? [],
    setHoveredStatement: (payload) => {
      hoveredStatement.value = payload
    },
    setPositionedEvents: (payload) => {
      positionedEvents.value = payload
    },
    statements: props.statements,
  })
}

function showEvent(event: HoveredBeeswarmEvent) {
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

function trimStatement(value: string) {
  return value.length > 150 ? `${value.slice(0, 147)}...` : value
}

onMounted(async () => {
  if (!plotHost.value) return

  await nextTick()
  sketch = createSketch()
})

watch(
  () =>
    [
      props.events,
      props.minPaddingX,
      props.paddingXRatio,
      props.selectedLabels,
      props.statements,
    ] as const,
  () => {
    sketch?.remove()
    sketch = createSketch()
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
  <section class="strategy-beeswarm" aria-label="Strategy statements beeswarm plot">
    <div ref="plotHost" class="strategy-beeswarm__canvas" />
    <button
      v-for="event in positionedEvents"
      :key="event.id"
      type="button"
      class="strategy-beeswarm__event-marker"
      :class="{ 'strategy-beeswarm__event-marker--active': hoveredEvent?.id === event.id }"
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
      class="strategy-beeswarm__tooltip strategy-beeswarm__tooltip--event"
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

    <aside
      v-if="hoveredStatement && !hoveredEvent"
      class="strategy-beeswarm__tooltip strategy-beeswarm__tooltip--statement"
      :style="{
        left: `${hoveredStatement.xRatio * 100}%`,
        top: `${hoveredStatement.yRatio * 100}%`,
      }"
    >
      <strong>{{ hoveredStatement.author }}</strong>
      <time>{{ hoveredStatement.date }}</time>
      <p>{{ trimStatement(hoveredStatement.statement) }}</p>
    </aside>
  </section>
</template>

<style scoped>
@import './StrategyBeeswarmPlot.css';
</style>
