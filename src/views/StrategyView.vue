<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../data/strategy-timeline-events.json'
import StrategyBeeswarmPlotP5 from '../components/StrategyBeeswarmPlotP5.vue'
import StrategyCorrelationHeatmap from '../components/StrategyCorrelationHeatmap.vue'
import StrategyIcicleDiagram from '../components/StrategyIcicleDiagram.vue'
import { useStatementStore } from '../stores/statementStore'
import type { IntentLabelKey } from '../types/intentData'
import type { TimelineEvent } from '../types/timeline'

const props = defineProps<{
  mode: 'structure' | 'timeline' | 'matrix'
}>()

const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)
const strategyTimelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]
const icicleDiagram = ref<{ clearSelection: () => void } | null>(null)

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

interface StrategySegmentClick {
  depth: 'main' | 'sub'
}

const selectedMainLabel = ref<MainLabelOverlaySelection | null>(null)

const strategyViews = [
  {
    id: 'structure',
    label: 'Category',
    description: 'How are the labels distributed?',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'All coded statements over time, filterable by top-level strategy.',
  },
  {
    id: 'matrix',
    label: 'Matrix',
    description: 'How often strategy labels appear together across statements.',
  },
] as const
const activeDescription = computed(
  () => strategyViews.find((view) => view.id === props.mode)?.description ?? '',
)

watch(
  () => props.mode,
  () => {
    closeMainLabelOverlay()
  },
)

function handleMainLabelClick(selection: MainLabelOverlaySelection) {
  selectedMainLabel.value = selection.selected ? selection : null
}

function handleSegmentClick(segment: StrategySegmentClick) {
  if (segment.depth === 'sub') {
    selectedMainLabel.value = null
  }
}

function closeMainLabelOverlay() {
  selectedMainLabel.value = null
  icicleDiagram.value?.clearSelection()
}
</script>

<template>
  <section class="strategy-view" :class="`strategy-view--${props.mode}`">
    <header class="strategy-view__header">
      <div class="strategy-view__header-copy">
        <h2>{{ strategyViews.find((view) => view.id === props.mode)?.label }}</h2>
        <p>{{ activeDescription }}</p>
      </div>
    </header>

    <div class="strategy-view__content">
      <section
        v-if="props.mode === 'structure'"
        class="strategy-view__structure"
        aria-label="Strategy label structure"
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
            :events="strategyTimelineEvents"
            :min-padding-x="18"
            :padding-x-ratio="0.02"
            :statements="records"
            :selected-labels="[]"
          />
        </div>
      </section>

      <section
        v-else
        class="strategy-view__matrix"
        aria-label="Strategy co-occurrence matrix"
      >
        <StrategyCorrelationHeatmap :records="records" />
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
  </section>
</template>

<style scoped>
@import '../css/views/StrategyView.css';
</style>
