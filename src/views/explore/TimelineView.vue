<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../../data/strategy-timeline-events.json'
import DetailView from '../../components/common/DetailView.vue'
import DropdownSelect from '../../components/common/DropdownSelect.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import SelectionView from '../../components/common/SelectionView.vue'
import StrategyButton from '../../components/common/StrategyButton.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StrategyBeeswarmPlotP5 from '../../components/strategy/StrategyBeeswarmPlotP5.vue'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { IntentRecord, MeasureCategory, PatternLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import type {
  BeeswarmDisplayMode,
  HoveredBeeswarmStatement,
  HoveredTimelineStatement,
} from '../../types/strategyBeeswarm'
import type { TimelineEvent } from '../../types/timeline'
import { toggleArrayItem } from '../../utils/arrays'
import { strategyColors } from '../../utils/intentLabels'
import { isPatternActive } from '../../utils/intentRecordPatterns'
import { createStrategyTimelineDomain } from '../../utils/strategyTimelineDomain'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const { filteredRecords, filters, records } = storeToRefs(statementStore)
const timelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]
const timelineDomain = computed(() => createStrategyTimelineDomain(records.value, timelineEvents))
const beeswarmMode = ref<BeeswarmDisplayMode>('statements')
const selectedStatement = ref<IntentRecord | null>(null)
const selectedPattern = ref<HoveredBeeswarmStatement | null>(null)
const measureCategoryOptions: { label: string; value: '' | MeasureCategory }[] = [
  { label: 'All content types', value: '' },
  { label: 'Destruction', value: 'Destruction' },
  { label: 'Aid Control / Deprivation', value: 'Aid Control / Deprivation' },
  { label: 'Forced Displacement', value: 'Forced Displacement' },
  { label: 'Physical Harm', value: 'Physical Harm' },
  { label: 'Occupation / Settlement', value: 'Occupation / Settlement' },
]

const patternFilterLabels = computed(() =>
  intentTaxonomy.map((group) => ({
    active: filters.value.labelsAll.includes(group.parentLabel),
    color: strategyColors[group.parentLabel] ?? 'var(--color-neutral)',
    key: group.parentLabel,
    label: group.label,
  })),
)
const selectedMeasureCategory = computed({
  get: () => filters.value.measureCategories[0] ?? '',
  set: (category: string) => {
    statementStore.setMeasureCategories(category ? [category as MeasureCategory] : [])
  },
})

const selectedAuthor = computed(() =>
  selectedStatement.value ? authorStore.getAuthorInstance(selectedStatement.value.author) : null,
)
const selectedAuthorRecords = computed(() =>
  selectedAuthor.value
    ? statementStore.getStatementsForAuthor(selectedAuthor.value.name)
    : selectedStatement.value
      ? [selectedStatement.value]
      : [],
)
const selectedPatternRecords = computed(() => {
  const pattern = selectedPattern.value

  return pattern
    ? records.value.filter((record) => isPatternActive(record, pattern.label))
    : []
})
function showAuthorDetail(statement: HoveredTimelineStatement | null) {
  if (!statement) return

  selectedPattern.value = null
  selectedStatement.value = statement.record
}

function showPatternDetail(statement: HoveredBeeswarmStatement | null) {
  if (!statement) return

  selectedStatement.value = null
  selectedPattern.value = statement
}

function closeDetail() {
  selectedStatement.value = null
  selectedPattern.value = null
}

function togglePatternLabel(label: PatternLabelKey) {
  statementStore.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as PatternLabelKey)
}
</script>

<template>
  <section class="timeline-view" aria-label="Pattern timeline">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      subline="All coded statements over time, filterable by top-level pattern."
      title="Timeline"
      @select="emit('section-select', $event)"
    />

    <section class="timeline-view__content" aria-label="All statements timeline">
      <div class="timeline-view__plot">
        <StrategyBeeswarmPlotP5
          :events="timelineEvents"
          :mode="beeswarmMode"
          :statements="filteredRecords"
          :selected-labels="filters.labelsAll"
          :suppress-top-overlay="Boolean(selectedPattern)"
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

    <section class="timeline-filter-overlay" aria-label="Timeline Filter">
      <section class="timeline-filters">
        <div class="timeline-search-filter">
          <input
            :value="filters.query"
            type="search"
            placeholder="Search for terms like &quot;destroy&quot;"
            @input="statementStore.setQuery(($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="filters.query"
            type="button"
            class="timeline-search-filter__clear"
            aria-label="Clear timeline search"
            @click="statementStore.setQuery('')"
          >
            ×
          </button>
        </div>

        <div class="timeline-measure-filter">
          <DropdownSelect
            v-model="selectedMeasureCategory"
            :options="measureCategoryOptions"
            select-label="Filter timeline by content category"
          />
        </div>

        <FilterButtonContainer
          :labels="patternFilterLabels"
          @select="togglePatternLabelByKey"
        />
      </section>
    </section>

    <button
      v-if="selectedStatement || selectedPattern"
      type="button"
      class="timeline-view__scrim"
      aria-label="Detail view schliessen"
      @click="closeDetail"
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <DetailView
          v-if="selectedStatement"
          :author="selectedAuthor"
          :records="selectedAuthorRecords"
          :target-statement-id="selectedStatement.id"
          @close="closeDetail"
        />
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="detail-overlay">
        <SelectionView
          v-if="selectedPattern"
          :header-color="selectedPattern.color"
          :records="selectedPatternRecords"
          :target-statement-id="selectedPattern.record.id"
          :title="selectedPattern.strategy"
          @close="closeDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/TimelineView.css';
</style>
