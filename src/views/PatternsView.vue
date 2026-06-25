<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../data/strategy-timeline-events.json'
import StrategyBeeswarmPlotP5 from '../components/StrategyBeeswarmPlotP5.vue'
import StrategyIcicleDiagram from '../components/StrategyIcicleDiagram.vue'
import StrategySubLabelAnchorSketch from '../components/StrategySubLabelAnchorSketch.vue'
import { useStatementStore } from '../stores/statementStore'
import type { IntentLabelKey } from '../types/intentData'
import { intentSubLabelDescriptions, intentTaxonomy } from '../types/intentTaxonomy'
import type { BeeswarmDisplayMode, HoveredTimelineStatement } from '../types/strategyBeeswarm'
import type { HoveredTimelineEvent, TimelineEvent } from '../types/timeline'
import { splitAnchors } from '../utils/intentLabels'

const props = defineProps<{
  mode: 'structure' | 'timeline'
}>()

const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)
const patternTimelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]
const icicleDiagram = ref<{ clearSelection: () => void } | null>(null)
const beeswarmMode = ref<BeeswarmDisplayMode>('strategies')
const hoveredTimelineEvent = ref<HoveredTimelineEvent | null>(null)
const hoveredTimelineStatement = ref<HoveredTimelineStatement | null>(null)

interface MainLabelOverlayChild {
  color: string
  count: number
  id: IntentLabelKey
  label: string
  sharePercent: number
}

interface MainLabelOverlaySelection {
  children: MainLabelOverlayChild[]
  color: string
  count: number
  description: string
  groupId: string
  id: IntentLabelKey
  label: string
  selected: boolean
}

interface PatternSegmentClick {
  depth: 'main' | 'sub'
  color: string
  count: number
  groupId: string
  id: IntentLabelKey
  label: string
}

interface SubLabelOverlaySelection {
  color: string
  count: number
  groupLabel: string
  id: IntentLabelKey
  label: string
}

const selectedMainLabel = ref<MainLabelOverlaySelection | null>(null)
const selectedSubLabel = ref<SubLabelOverlaySelection | null>(null)

const patternViews = [
  {
    id: 'structure',
    label: 'Patterns',
    description: 'How are the pattern labels distributed?',
  },
  {
    id: 'timeline',
    label: 'Pattern Timeline',
    description: 'All coded statements over time, filterable by top-level pattern.',
  },
] as const
const activeDescription = computed(
  () => patternViews.find((view) => view.id === props.mode)?.description ?? '',
)
const selectedSubLabelAnchors = computed(() => {
  const label = selectedSubLabel.value?.id
  if (!label) return []

  return records.value.flatMap((record) =>
    record[label] === 'yes'
      ? splitAnchors(record[`${label}_anchor` as keyof typeof record])
      : [],
  )
})
const selectedSubLabelDescription = computed(() => {
  const selection = selectedSubLabel.value
  if (!selection) return ''

  return (
    intentSubLabelDescriptions[selection.id] ??
    `${selection.label} describes statements where this pattern appears inside ${selection.groupLabel}.`
  )
})

watch(
  () => props.mode,
  () => {
    closeMainLabelOverlay()
    selectedSubLabel.value = null
    hoveredTimelineEvent.value = null
    hoveredTimelineStatement.value = null
  },
)

watch(beeswarmMode, () => {
  hoveredTimelineStatement.value = null
})

function handleMainLabelClick(selection: MainLabelOverlaySelection) {
  selectedSubLabel.value = null
  selectedMainLabel.value = selection.selected ? selection : null
}

function handleSegmentClick(segment: PatternSegmentClick) {
  if (segment.depth === 'sub') {
    selectedMainLabel.value = null
    selectedSubLabel.value =
      selectedSubLabel.value?.id === segment.id
        ? null
        : {
            color: segment.color,
            count: segment.count,
            groupLabel: getGroupLabel(segment.groupId),
            id: segment.id,
            label: segment.label,
          }
    return
  }

  selectedSubLabel.value = null
}

function closeMainLabelOverlay() {
  selectedMainLabel.value = null
  selectedSubLabel.value = null
  icicleDiagram.value?.clearSelection()
}

function closeSubLabelOverlay() {
  selectedSubLabel.value = null
  icicleDiagram.value?.clearSelection()
}

function showHoveredTimelineStatement(statement: HoveredTimelineStatement | null) {
  hoveredTimelineStatement.value = statement
}

function showHoveredTimelineEvent(event: HoveredTimelineEvent | null) {
  hoveredTimelineEvent.value = event
}

function getGroupLabel(groupId: string) {
  return intentTaxonomy.find((group) => group.parentLabel === groupId)?.label ?? 'Pattern'
}
</script>

<template>
  <section class="strategy-view" :class="`strategy-view--${props.mode}`">
    <header class="strategy-view__header">
      <div class="strategy-view__header-copy">
        <h2>{{ patternViews.find((view) => view.id === props.mode)?.label }}</h2>
        <p>{{ activeDescription }}</p>
      </div>
    </header>

    <div class="strategy-view__content">
      <section
        v-if="props.mode === 'structure'"
        class="strategy-view__structure"
        aria-label="Pattern label structure"
      >
        <StrategyIcicleDiagram
          ref="icicleDiagram"
          :records="records"
          @main-label-click="handleMainLabelClick"
          @segment-click="handleSegmentClick"
        />
      </section>

      <section
        v-else-if="props.mode === 'timeline'"
        class="strategy-view__timeline-view"
        aria-label="All statements timeline"
      >
        <div class="strategy-view__timeline">
          <StrategyBeeswarmPlotP5
            :events="patternTimelineEvents"
            :mode="beeswarmMode"
            :statements="records"
            :selected-labels="[]"
            @event-hover="showHoveredTimelineEvent"
            @statement-hover="showHoveredTimelineStatement"
          />
        </div>

        <Transition name="strategy-view-statement-hover">
          <aside
            v-if="beeswarmMode === 'statements' && hoveredTimelineStatement"
            class="strategy-view__statement-hover"
            aria-label="Hovered statement"
          >
            <p>{{ hoveredTimelineStatement.statement }}</p>
            <span>
              {{ hoveredTimelineStatement.author }} · {{ hoveredTimelineStatement.date }}
              <template v-if="hoveredTimelineStatement.source">
                · {{ hoveredTimelineStatement.source }}
              </template>
            </span>
          </aside>
        </Transition>

        <div class="strategy-view__timeline-switch" aria-label="Timeline display">
          <button
            type="button"
            :class="{ 'strategy-view__timeline-switch-button--active': beeswarmMode === 'strategies' }"
            @click="beeswarmMode = 'strategies'"
          >
            Patterns
          </button>
          <button
            type="button"
            :class="{ 'strategy-view__timeline-switch-button--active': beeswarmMode === 'statements' }"
            @click="beeswarmMode = 'statements'"
          >
            Statements
          </button>
        </div>
      </section>

    </div>

    <Transition name="strategy-main-overlay">
      <aside
        v-if="props.mode === 'structure' && selectedMainLabel"
        class="strategy-view__main-overlay"
        :style="{ '--strategy-main-overlay-accent': selectedMainLabel.color }"
        aria-label="Main label details"
      >
        <header class="strategy-view__main-overlay-header">
          <h3>{{ selectedMainLabel.label }}</h3>
          <p class="strategy-view__main-overlay-description">
            {{ selectedMainLabel.description }}
          </p>
        </header>

        <div class="strategy-view__main-overlay-meta">
          <span>Statements in this category</span>
          <strong>{{ selectedMainLabel.count }}</strong>
        </div>
      </aside>
    </Transition>

    <Transition name="strategy-sub-label-overlay">
      <aside
        v-if="props.mode === 'structure' && selectedSubLabel"
        class="strategy-view__sub-label-overlay"
        :style="{ '--strategy-sub-label-overlay-color': selectedSubLabel.color }"
        aria-label="Sublabel details"
      >
        <div class="strategy-view__sub-label-overlay-columns">
          <section class="strategy-view__sub-label-overlay-copy">
            <p>{{ selectedSubLabelDescription }}</p>
          </section>

          <header class="strategy-view__sub-label-overlay-header">
            <h3>{{ selectedSubLabel.label }}</h3>
            <button
              type="button"
              class="strategy-view__sub-label-overlay-close"
              aria-label="Close sublabel overlay"
              @click="closeSubLabelOverlay"
            >
              ←
            </button>
          </header>
        </div>

        <section class="strategy-view__sub-label-overlay-anchors" aria-label="Anchor texts">
          <StrategySubLabelAnchorSketch :anchors="selectedSubLabelAnchors" />
        </section>
      </aside>
    </Transition>
  </section>
</template>

<style scoped>
@import '../css/views/PatternsView.css';
</style>
