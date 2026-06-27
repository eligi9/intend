<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../../data/strategy-timeline-events.json'
import StrategyBeeswarmPlotP5 from '../../components/strategy/StrategyBeeswarmPlotP5.vue'
import { useStatementStore } from '../../stores/statementStore'
import type { BeeswarmDisplayMode, HoveredTimelineStatement } from '../../types/strategyBeeswarm'
import type { TimelineEvent } from '../../types/timeline'

const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)
const timelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]
const beeswarmMode = ref<BeeswarmDisplayMode>('statements')
const hoveredStatement = ref<HoveredTimelineStatement | null>(null)

watch(beeswarmMode, () => {
  hoveredStatement.value = null
})

function showHoveredStatement(statement: HoveredTimelineStatement | null) {
  hoveredStatement.value = statement
}
</script>

<template>
  <section class="timeline-view" aria-label="Pattern timeline">
    <header class="timeline-view__header">
      <div class="timeline-view__header-copy">
        <h2>Timeline</h2>
        <p>All coded statements over time, filterable by top-level pattern.</p>
      </div>
    </header>

    <section class="timeline-view__content" aria-label="All statements timeline">
      <div class="timeline-view__plot">
        <StrategyBeeswarmPlotP5
          :events="timelineEvents"
          :mode="beeswarmMode"
          :statements="records"
          :selected-labels="[]"
          @statement-hover="showHoveredStatement"
        />
      </div>

      <Transition name="timeline-view-statement-hover">
        <aside
          v-if="beeswarmMode === 'statements' && hoveredStatement"
          class="timeline-view__statement-hover"
          aria-label="Hovered statement"
        >
          <p>{{ hoveredStatement.statement }}</p>
          <span>
            {{ hoveredStatement.author }} · {{ hoveredStatement.date }}
            <template v-if="hoveredStatement.source">
              · {{ hoveredStatement.source }}
            </template>
          </span>
        </aside>
      </Transition>

      <div class="timeline-view__switch" aria-label="Timeline display">
        <button
          type="button"
          :class="{ 'timeline-view__switch-button--active': beeswarmMode === 'statements' }"
          @click="beeswarmMode = 'statements'"
        >
          Statements
        </button>
        <button
          type="button"
          :class="{ 'timeline-view__switch-button--active': beeswarmMode === 'strategies' }"
          @click="beeswarmMode = 'strategies'"
        >
          Patterns
        </button>
      </div>
    </section>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/TimelineView.css';
</style>
