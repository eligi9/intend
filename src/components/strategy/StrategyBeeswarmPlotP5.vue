<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type p5 from 'p5'
import type { PatternLabelKey, IntentRecord } from '../../types/intentData'
import { createStatementBeeswarmSketch } from '../../sketches/statementBeeswarmSketch'
import { createStrategyBeeswarmSketch } from '../../sketches/strategyBeeswarmSketch'
import { createStrategyTimelineGridSketch } from '../../sketches/strategyTimelineGridSketch'
import type {
  BeeswarmDisplayMode,
  HoveredBeeswarmStatement,
  HoveredTimelineStatement,
} from '../../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineDomain, TimelineEvent } from '../../types/timeline'
import {
  createStrategyTimelineDomain,
  getMonthDivisionCount,
} from '../../utils/strategyTimelineDomain'
import TopOverlay from '../common/TopOverlay.vue'
import StatementTooltip from '../statement/StatementTooltip.vue'
import StrategyAnchorOverlay from './StrategyAnchorOverlay.vue'

const props = defineProps<{
  events?: TimelineEvent[]
  mode: BeeswarmDisplayMode
  selectedLabels?: PatternLabelKey[]
  statements: IntentRecord[]
  timeDomain?: TimelineDomain
}>()

const emit = defineEmits<{
  'event-hover': [event: HoveredTimelineEvent | null]
  'pattern-hover': [statement: HoveredBeeswarmStatement | null]
  'statement-hover': [statement: HoveredTimelineStatement | null]
  'statement-press': [statement: HoveredTimelineStatement | null]
}>()

const gridHost = ref<HTMLElement | null>(null)
const plotHost = ref<HTMLElement | null>(null)
const hoveredPattern = ref<HoveredBeeswarmStatement | null>(null)
const pressedPattern = ref<HoveredBeeswarmStatement | null>(null)
const hoveredTimelineEvent = ref<HoveredTimelineEvent | null>(null)
const hoveredTimelineStatement = ref<HoveredTimelineStatement | null>(null)
let gridSketch: p5 | null = null
let swarmSketch: p5 | null = null
let sketchesMounted = false

interface TimelineTopOverlay {
  background?: string
  headingColor?: string
  meta?: string
  text?: string
  textColor?: string
  title: string
}

const topOverlay = computed<TimelineTopOverlay | null>(() => {
  if (hoveredTimelineEvent.value && !pressedPattern.value) {
    return {
      headingColor: 'var(--color-white)',
      meta: `${hoveredTimelineEvent.value.date} · ${hoveredTimelineEvent.value.sourceName}`,
      text: hoveredTimelineEvent.value.description,
      textColor: 'var(--color-white)',
      title: hoveredTimelineEvent.value.label,
    }
  }

  if (props.mode === 'strategies' && hoveredPattern.value && !pressedPattern.value) {
    return {
      background: hoveredPattern.value.color,
      headingColor: 'var(--color-white)',
      meta: [hoveredPattern.value.author, hoveredPattern.value.date, hoveredPattern.value.source]
        .filter(Boolean)
        .join(' · '),
      text: hoveredPattern.value.anchorText?.map((anchor) => `»${anchor}«`).join(' ') ?? '',
      textColor: 'var(--color-white)',
      title: hoveredPattern.value.strategy,
    }
  }

  if (props.mode === 'statements' && hoveredTimelineStatement.value && !pressedPattern.value) {
    return {
      headingColor: 'var(--color-white)',
      title: hoveredTimelineStatement.value.author,
    }
  }

  return null
})

function getTimeDomain() {
  return props.timeDomain ?? createStrategyTimelineDomain(props.statements, props.events ?? [])
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
    hoveredPattern.value = null
    pressedPattern.value = null
    emit('pattern-hover', null)

    return createStatementBeeswarmSketch(plotHost.value, {
      setPressedStatement: (payload) => {
        emit('statement-press', payload)
      },
      setHoveredStatement: (payload) => {
        hoveredTimelineStatement.value = payload
        emit('statement-hover', payload)
      },
      statements: props.statements,
      timeDomain: getTimeDomain(),
    })
  }

  hoveredTimelineStatement.value = null
  hoveredPattern.value = null
  pressedPattern.value = null
  emit('pattern-hover', null)
  emit('statement-hover', null)
  emit('statement-press', null)

  return createStrategyBeeswarmSketch(plotHost.value, {
    setPressedStatement: (payload) => {
      pressedPattern.value = payload
    },
    selectedLabels: props.selectedLabels ?? [],
    setHoveredStatement: (payload) => {
      hoveredPattern.value = payload
      emit('pattern-hover', payload)
    },
    statements: props.statements,
    timeDomain: getTimeDomain(),
  })
}

function closePressedPattern() {
  pressedPattern.value = null
}

onMounted(async () => {
  if (!gridHost.value || !plotHost.value) return

  await nextTick()
  sketchesMounted = true
  gridSketch = createGridSketch()
  swarmSketch = createSwarmSketch()
  window.addEventListener('pointerup', closePressedPattern)
  window.addEventListener('pointercancel', closePressedPattern)
  window.addEventListener('blur', closePressedPattern)
})

watch(
  () =>
    [
      props.events,
      props.timeDomain ?? props.statements,
    ] as const,
  () => {
    if (!sketchesMounted) return

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
      props.timeDomain,
    ] as const,
  () => {
    if (!sketchesMounted) return

    swarmSketch?.remove()
    swarmSketch = createSwarmSketch()
  },
)

onBeforeUnmount(() => {
  sketchesMounted = false
  hoveredTimelineEvent.value = null
  hoveredPattern.value = null
  pressedPattern.value = null
  hoveredTimelineStatement.value = null
  emit('event-hover', null)
  emit('pattern-hover', null)
  emit('statement-hover', null)
  emit('statement-press', null)
  window.removeEventListener('pointerup', closePressedPattern)
  window.removeEventListener('pointercancel', closePressedPattern)
  window.removeEventListener('blur', closePressedPattern)
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

    <StatementTooltip
      v-if="mode === 'statements' && hoveredTimelineStatement?.record.measures.length"
      class="strategy-beeswarm__timeline-tooltip"
      placement="left"
      :record="hoveredTimelineStatement.record"
      :focusable="false"
      :show-arrow="false"
      visible
    >
      <span class="strategy-beeswarm__timeline-tooltip-anchor" aria-hidden="true" />
    </StatementTooltip>

    <TopOverlay
      :background="topOverlay?.background"
      :heading-color="topOverlay?.headingColor"
      :meta="topOverlay?.meta"
      :text="topOverlay?.text"
      :text-color="topOverlay?.textColor"
      :title="topOverlay?.title ?? ''"
      :visible="topOverlay !== null"
    />

    <Teleport to="body">
      <StrategyAnchorOverlay
        v-if="pressedPattern && pressedPattern.anchorText?.length"
        :anchor-texts="pressedPattern.anchorText"
        :highlight-color="pressedPattern.color"
        :label="pressedPattern.label"
        :statement="pressedPattern.record"
      />
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyBeeswarmPlot.css';
</style>
