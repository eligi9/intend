<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../../data/strategy-timeline-events.json'
import SelectionView from '../../components/detail/SelectionView.vue'
import CustomButton from '../../components/button/CustomButton.vue'
import AppHeader from '../../components/ui/AppHeader.vue'
import FilterBar from '../../components/ui/FilterBar.vue'
import BeeswarmPlot from '../../components/diagram/BeeswarmPlot.vue'
import { useAuthorDetailStore } from '../../stores/authorDetailStore'
import { useStatementStore } from '../../stores/statementStore'
import type { AppHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type {
  BeeswarmDisplayMode,
  HoveredBeeswarmStatement,
  HoveredTimelineStatement,
} from '../../types/strategyBeeswarm'
import type { TimelineEvent } from '../../types/timeline'
import { isPatternActive } from '../../utils/intentRecordPatterns'
import { createStrategyTimelineDomain } from '../../utils/strategyTimelineDomain'

defineProps<AppHeaderProps>()

const emit = defineEmits<{
  'establishment-select': []
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
    <AppHeader
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
      @establishment-select="emit('establishment-select')"
      @select="emit('section-select', $event)"
    />

    <section class="timeline-view__content" aria-label="All statements timeline">
      <div class="timeline-view__plot">
        <BeeswarmPlot
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
        <CustomButton
          :active="beeswarmMode === 'statements'"
          color="var(--color-black)"
          label="Statements"
          min-width="6rem"
          @select="beeswarmMode = 'statements'"
        />
        <CustomButton
          :active="beeswarmMode === 'strategies'"
          color="var(--color-black)"
          label="Patterns"
          min-width="6rem"
          @select="beeswarmMode = 'strategies'"
        />
      </div>
    </section>

    <FilterBar
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
