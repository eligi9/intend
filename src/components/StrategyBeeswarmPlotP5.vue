<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import type { TimelineEvent } from '../sketches/authorTimelineSketch'
import {
  createStrategyBeeswarmSketch,
  type HoveredBeeswarmStatement,
  type PositionedBeeswarmEvent,
} from '../sketches/strategyBeeswarmSketch'

const props = defineProps<{
  events?: TimelineEvent[]
  minPaddingX?: number
  paddingXRatio?: number
  selectedLabels?: IntentLabelKey[]
  statements: IntentRecord[]
}>()

const plotHost = ref<HTMLElement | null>(null)
const hoveredStatement = ref<HoveredBeeswarmStatement | null>(null)
const positionedEvents = ref<PositionedBeeswarmEvent[]>([])
let sketch: p5 | null = null

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

function trimStatement(value: string) {
  return value.length > 150 ? `${value.slice(0, 147)}...` : value
}

function tooltipAnchors(statement: HoveredBeeswarmStatement) {
  const anchors = statement.anchorText?.filter(Boolean) ?? []

  return (anchors.length > 0 ? anchors : [statement.statement]).map(trimStatement)
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
  sketch?.remove()
})
</script>

<template>
  <section class="strategy-beeswarm" aria-label="Strategy statements beeswarm plot">
    <div ref="plotHost" class="strategy-beeswarm__canvas" />
    <article
      v-for="event in positionedEvents"
      :key="event.id"
      class="strategy-beeswarm__event-label"
      :style="{
        '--strategy-beeswarm-event-x': `${event.xRatio * 100}%`,
        top: `${event.yRatio * 100}%`,
      }"
    >
      <time>{{ event.date }}</time>
      <strong>{{ event.label }}</strong>
    </article>

    <aside
      v-if="hoveredStatement"
      class="strategy-beeswarm__tooltip strategy-beeswarm__tooltip--statement"
      :style="{
        '--strategy-beeswarm-tooltip-x': `${hoveredStatement.xRatio * 100}%`,
        '--strategy-beeswarm-tooltip-background': hoveredStatement.color,
        top: `${hoveredStatement.yRatio * 100}%`,
      }"
    >
      <strong>{{ hoveredStatement.strategy }}</strong>
      <time>{{ hoveredStatement.author }} · {{ hoveredStatement.date }}</time>
      <div class="strategy-beeswarm__tooltip-anchors">
        <p
          v-for="(anchor, index) in tooltipAnchors(hoveredStatement)"
          :key="`${hoveredStatement.id}:${index}`"
          class="strategy-beeswarm__tooltip-anchor"
        >
          {{ anchor }}
        </p>
      </div>
    </aside>
  </section>
</template>

<style scoped>
@import '../css/components/StrategyBeeswarmPlot.css';
</style>
