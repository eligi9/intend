<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../../data/strategy-timeline-events.json'
import StrategyBeeswarmPlotP5 from '../../components/strategy-beeswarm-plot/StrategyBeeswarmPlotP5.vue'
import StrategyBadge from '../../components/strategy-badge/StrategyBadge.vue'
import StrategyCorrelationHeatmap from '../../components/strategy-correlation-heatmap/StrategyCorrelationHeatmap.vue'
import { useStatementStore } from '../../stores/statementStore'
import type { IntentLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { intentLabelNames, taxonomyButtonColors } from '../../utils/intentLabels'
import type { TimelineEvent } from '../../sketches/authorTimelineSketch'

const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)
const activeView = ref<'structure' | 'timeline' | 'matrix'>('structure')
const strategyTimelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]

const strategyViews = [
  {
    id: 'structure',
    label: 'Structure',
    description: 'How the strategy labels are grouped in the coding scheme.',
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
  () => strategyViews.find((view) => view.id === activeView.value)?.description ?? '',
)
const strategyGroups = computed(() =>
  intentTaxonomy.map((group) => ({
    ...group,
    color: taxonomyButtonColors[group.id] ?? '#858b94',
    count: group.parentLabel ? countLabel(group.parentLabel) : 0,
    children: group.childLabels.map((label) => ({
      count: countLabel(label),
      key: label,
      label: intentLabelNames[label],
    })),
  })),
)

function countLabel(label: IntentLabelKey) {
  return records.value.filter((record) => record[label] === 'yes').length
}

function setActiveView(view: (typeof strategyViews)[number]['id']) {
  activeView.value = view
}
</script>

<template>
  <section class="strategy-view" :class="{ 'strategy-view--timeline': activeView === 'timeline' }">
    <header class="strategy-view__header">
      <h2>Strategies</h2>
      <p>{{ activeDescription }}</p>
    </header>

    <nav class="strategy-view__tabs" aria-label="Strategy views">
      <button
        v-for="view in strategyViews"
        :key="view.id"
        type="button"
        :class="{ 'strategy-view__tab--active': activeView === view.id }"
        :aria-pressed="activeView === view.id"
        class="strategy-view__tab"
        @click="setActiveView(view.id)"
      >
        {{ view.label }}
      </button>
    </nav>

    <div class="strategy-view__content">
      <section
        v-if="activeView === 'structure'"
        class="strategy-view__structure"
        aria-label="Strategy label structure"
      >
        <article
          v-for="group in strategyGroups"
          :key="group.id"
          class="strategy-view__strategy-group"
          :style="{ '--strategy-group-color': group.color }"
        >
          <header>
            <StrategyBadge :label="group.label" :color="group.color" :count="group.count" />
          </header>
          <ol>
            <li v-for="child in group.children" :key="child.key">
              <span>{{ child.label }}</span>
              <strong>{{ child.count }}</strong>
            </li>
          </ol>
        </article>
      </section>

      <section
        v-else-if="activeView === 'timeline'"
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
  </section>
</template>

<style scoped>
@import './StrategyView.css';
</style>
