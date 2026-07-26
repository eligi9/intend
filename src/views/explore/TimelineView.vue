<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../../data/strategy-timeline-events.json'
import SelectionView from '../../components/common/SelectionView.vue'
import StrategyButton from '../../components/common/StrategyButton.vue'
import ExploreFilterBar from '../../components/explore/ExploreFilterBar.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StrategyBeeswarmPlotP5 from '../../components/strategy/StrategyBeeswarmPlotP5.vue'
import { useAuthorDetailStore } from '../../stores/authorDetailStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type {
  BeeswarmDisplayMode,
  HoveredBeeswarmStatement,
  HoveredTimelineStatement,
} from '../../types/strategyBeeswarm'
import type { TimelineEvent } from '../../types/timeline'
import { isPatternActive } from '../../utils/intentRecordPatterns'
import { createStrategyTimelineDomain } from '../../utils/strategyTimelineDomain'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const authorDetailStore = useAuthorDetailStore()
const { filteredRecords, records } = storeToRefs(statementStore)
const { authorName: openAuthorName } = storeToRefs(authorDetailStore)
const timelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]
const timelineDomain = computed(() => createStrategyTimelineDomain(records.value, timelineEvents))
const beeswarmMode = ref<BeeswarmDisplayMode>('statements')
const selectedPattern = ref<HoveredBeeswarmStatement | null>(null)

const selectedPatternRecords = computed(() => {
  const pattern = selectedPattern.value

  return pattern
    ? records.value.filter((record) => isPatternActive(record, pattern.label))
    : []
})
function showAuthorDetail(statement: HoveredTimelineStatement | null) {
  if (!statement) return

  const filteredAuthorRecordIds = filteredRecords.value
    .filter((record) => record.author === statement.record.author)
    .map((record) => record.id)

  selectedPattern.value = null
  authorDetailStore.openAuthorDetail(statement.record.author, {
    recordIds: filteredAuthorRecordIds,
    targetStatementId: statement.record.id,
  })
}

function showPatternDetail(statement: HoveredBeeswarmStatement | null) {
  if (!statement) return

  selectedPattern.value = statement
}

function closeDetail() {
  selectedPattern.value = null
}

</script>

<template>
  <section class="timeline-view" aria-label="Pattern timeline">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      :subline="
        beeswarmMode === 'strategies'
          ? 'Compare pattern categories. Expand a category to see its individual patterns.'
          : 'Hover events for details. Hover a statement to highlight all statements by the same author.'
      "
      :title="
        beeswarmMode === 'strategies'
          ? 'How are patterns distributed over time?'
          : 'How are statements distributed over time?'
      "
      @select="emit('section-select', $event)"
    />

    <section class="timeline-view__content" aria-label="All statements timeline">
      <div class="timeline-view__plot">
        <StrategyBeeswarmPlotP5
          :events="timelineEvents"
          :mode="beeswarmMode"
          :statements="filteredRecords"
          :suppress-top-overlay="Boolean(selectedPattern || openAuthorName)"
          :time-domain="timelineDomain"
          @pattern-press="showPatternDetail"
          @statement-press="showAuthorDetail"
        />
      </div>

      <div class="timeline-view__switch" aria-label="Timeline display">
        <StrategyButton
          :active="beeswarmMode === 'statements'"
          color="var(--color-black)"
          label="Statements"
          min-width="6rem"
          @select="beeswarmMode = 'statements'"
        />
        <StrategyButton
          :active="beeswarmMode === 'strategies'"
          color="var(--color-black)"
          label="Patterns"
          min-width="6rem"
          @select="beeswarmMode = 'strategies'"
        />
      </div>
    </section>

    <ExploreFilterBar
      aria-label="Timeline Filter"
      select-label="Filter timeline by content category"
      :z-index="30"
    />

    <button
      v-if="selectedPattern"
      type="button"
      class="timeline-view__scrim"
      aria-label="Detail view schliessen"
      @click.stop="closeDetail"
      @mousedown.stop
      @mouseup.stop
      @pointerdown.stop
      @pointerup.stop
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <SelectionView
          v-if="selectedPattern"
          :header-color="selectedPattern.color"
          :records="selectedPatternRecords"
          :target-statement-id="selectedPattern.record.id"
          :title="selectedPattern.strategy"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/TimelineView.css';
</style>
