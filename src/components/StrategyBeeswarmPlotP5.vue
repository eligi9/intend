<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { createStrategyBeeswarmSketch } from '../sketches/strategyBeeswarmSketch'
import { createStrategyTimelineGridSketch } from '../sketches/strategyTimelineGridSketch'
import type { HoveredBeeswarmStatement } from '../types/strategyBeeswarm'
import type { TimelineEvent } from '../types/timeline'
import {
  createStrategyTimelineDomain,
  getMonthDivisionCount,
} from '../utils/strategyTimelineDomain'

const props = defineProps<{
  events?: TimelineEvent[]
  selectedLabels?: IntentLabelKey[]
  statements: IntentRecord[]
}>()

const gridHost = ref<HTMLElement | null>(null)
const plotHost = ref<HTMLElement | null>(null)
const hoveredStatement = ref<HoveredBeeswarmStatement | null>(null)
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
    startDate: domain.startDate,
  })
}

// Vue owns the DOM overlays; the p5 sketches own the two canvas layers.
// Grid and swarm get the same time domain, but they do not talk to each other.
function createSwarmSketch() {
  if (!plotHost.value) return null

  return createStrategyBeeswarmSketch(plotHost.value, {
    selectedLabels: props.selectedLabels ?? [],
    setHoveredStatement: (payload) => {
      hoveredStatement.value = payload
    },
    statements: props.statements,
    timeDomain: getTimeDomain(),
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
  if (!gridHost.value || !plotHost.value) return

  await nextTick()
  gridSketch = createGridSketch()
  swarmSketch = createSwarmSketch()
})

watch(
  () =>
    [
      props.events,
      props.selectedLabels,
      props.statements,
    ] as const,
  () => {
    // Recreate both p5 layers when data or sizing props change.
    // The grid stays independent from the d3-force swarm simulation.
    gridSketch?.remove()
    swarmSketch?.remove()
    gridSketch = createGridSketch()
    swarmSketch = createSwarmSketch()
  },
)

onBeforeUnmount(() => {
  gridSketch?.remove()
  swarmSketch?.remove()
})
</script>

<template>
  <section class="strategy-beeswarm" aria-label="Strategy statements beeswarm plot">
    <div ref="gridHost" class="strategy-beeswarm__grid-canvas" />
    <div ref="plotHost" class="strategy-beeswarm__canvas" />

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
