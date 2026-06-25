<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { createStatementBeeswarmSketch } from '../sketches/statementBeeswarmSketch'
import { createStrategyBeeswarmSketch } from '../sketches/strategyBeeswarmSketch'
import { createStrategyTimelineGridSketch } from '../sketches/strategyTimelineGridSketch'
import type {
  BeeswarmDisplayMode,
  HoveredBeeswarmStatement,
  HoveredTimelineStatement,
} from '../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineEvent } from '../types/timeline'
import {
  createStrategyTimelineDomain,
  getMonthDivisionCount,
} from '../utils/strategyTimelineDomain'

const props = defineProps<{
  events?: TimelineEvent[]
  mode: BeeswarmDisplayMode
  selectedLabels?: IntentLabelKey[]
  statements: IntentRecord[]
}>()

const emit = defineEmits<{
  'event-hover': [event: HoveredTimelineEvent | null]
  'statement-hover': [statement: HoveredTimelineStatement | null]
}>()

const gridHost = ref<HTMLElement | null>(null)
const plotHost = ref<HTMLElement | null>(null)
const hoveredStatement = ref<HoveredBeeswarmStatement | null>(null)
const hoveredTimelineEvent = ref<HoveredTimelineEvent | null>(null)
const hoveredTimelineStatement = ref<HoveredTimelineStatement | null>(null)
let gridSketch: p5 | null = null
let swarmSketch: p5 | null = null

function getTimeDomain() {
  return createStrategyTimelineDomain(props.statements, props.events ?? [])
}

function createGridSketch() {
  if (!gridHost.value) return null

  const domain = getTimeDomain()

  return createStrategyTimelineGridSketch(gridHost.value, {
    divisions: getMonthDivisionCount(domain),
    endDate: domain.endDate,
    events: props.events ?? [],
    setHoveredEvent: (payload) => {
      hoveredTimelineEvent.value = payload
      emit('event-hover', payload)
    },
    startDate: domain.startDate,
  })
}

// Vue owns the DOM overlays; the p5 sketches own the two canvas layers.
// Grid and swarm get the same time domain, but they do not talk to each other.
function createSwarmSketch() {
  if (!plotHost.value) return null

  if (props.mode === 'statements') {
    hoveredStatement.value = null

    return createStatementBeeswarmSketch(plotHost.value, {
      setHoveredStatement: (payload) => {
        hoveredTimelineStatement.value = payload
        emit('statement-hover', payload)
      },
      statements: props.statements,
      timeDomain: getTimeDomain(),
    })
  }

  hoveredTimelineStatement.value = null
  emit('statement-hover', null)

  return createStrategyBeeswarmSketch(plotHost.value, {
    selectedLabels: props.selectedLabels ?? [],
    setHoveredStatement: (payload) => {
      hoveredStatement.value = payload
    },
    statements: props.statements,
    timeDomain: getTimeDomain(),
  })
}

onMounted(async () => {
  if (!gridHost.value || !plotHost.value) return

  await nextTick()
  gridSketch = createGridSketch()
  swarmSketch = createSwarmSketch()
})

watch(
  () =>
    [
      props.events,
      props.statements,
    ] as const,
  () => {
    hoveredTimelineEvent.value = null
    emit('event-hover', null)
    gridSketch?.remove()
    gridSketch = createGridSketch()
  },
)

watch(
  () =>
    [
      props.events,
      props.mode,
      props.selectedLabels,
      props.statements,
    ] as const,
  () => {
    swarmSketch?.remove()
    swarmSketch = createSwarmSketch()
  },
)

onBeforeUnmount(() => {
  hoveredTimelineEvent.value = null
  hoveredTimelineStatement.value = null
  emit('event-hover', null)
  emit('statement-hover', null)
  gridSketch?.remove()
  swarmSketch?.remove()
})
</script>

<template>
  <section class="strategy-beeswarm" aria-label="Pattern statements beeswarm plot">
    <div ref="gridHost" class="strategy-beeswarm__grid-canvas" />
    <div
      ref="plotHost"
      class="strategy-beeswarm__canvas"
      :class="`strategy-beeswarm__canvas--${mode}`"
    />

    <Teleport to="body">
      <Transition name="strategy-beeswarm-hover-layer">
        <aside
          v-if="hoveredTimelineEvent"
          class="strategy-beeswarm__hover-layer strategy-beeswarm__hover-layer--event"
        >
          <div class="strategy-beeswarm__hover-layer-inner">
            <h3>{{ hoveredTimelineEvent.label }}</h3>
            <p>{{ hoveredTimelineEvent.description }}</p>
            <span>
              {{ hoveredTimelineEvent.date }} · {{ hoveredTimelineEvent.sourceName }}
            </span>
          </div>
        </aside>
        <aside
          v-else-if="mode === 'strategies' && hoveredStatement"
          class="strategy-beeswarm__hover-layer"
          :style="{ '--strategy-beeswarm-hover-color': hoveredStatement.color }"
        >
          <div class="strategy-beeswarm__hover-layer-inner">
            <h3>{{ hoveredStatement.strategy }}</h3>
          </div>
        </aside>
        <aside
          v-else-if="mode === 'statements' && hoveredTimelineStatement"
          class="strategy-beeswarm__hover-layer strategy-beeswarm__hover-layer--statement"
        >
          <div class="strategy-beeswarm__hover-layer-inner">
            <h3>{{ hoveredTimelineStatement.author }}</h3>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../css/components/StrategyBeeswarmPlot.css';
</style>
