<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DropdownSelect from '../../components/common/DropdownSelect.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import MirroredLineGrid from '../../components/common/MirroredLineGrid.vue'
import SelectionView from '../../components/common/SelectionView.vue'
import SideOverlay from '../../components/common/SideOverlay.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StrategyIcicleDiagram from '../../components/strategy/StrategyIcicleDiagram.vue'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { MeasureCategory, PatternLabelKey } from '../../types/intentData'
import { intentSubLabelDescriptions, intentTaxonomy } from '../../types/intentTaxonomy'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'
import { toggleArrayItem } from '../../utils/arrays'
import { strategyColors } from '../../utils/intentLabels'
import { isPatternActive, isPatternGroupActive } from '../../utils/intentRecordPatterns'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const { filteredRecords, filters } = storeToRefs(statementStore)
const maxStatementsPerSide = 80
const countStep = 10
const selectedSegment = ref<StrategyIcicleSegment | null>(null)
const detailSegment = ref<StrategyIcicleSegment | null>(null)
const gridMarker = ref<MirroredLineGridMarker | null>(null)
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
const selectedSubpatternDescription = computed(() => {
  const segment = selectedSegment.value
  if (!segment?.parent) return ''

  return (
    intentSubLabelDescriptions[segment.id] ??
    `${segment.label} describes statements where this pattern appears inside ${segment.parent.label}.`
  )
})
const detailRecords = computed(() => {
  const segment = detailSegment.value
  if (!segment) return []

  return filteredRecords.value.filter((record) =>
    segment.parent
      ? isPatternActive(record, segment.id)
      : isPatternGroupActive(record, segment.id),
  )
})

function handleSegmentHover(segment: StrategyIcicleSegment | null) {
  if (detailSegment.value) return

  selectedSegment.value = segment
}

function handleSegmentClick(segment: StrategyIcicleSegment) {
  selectedSegment.value = null
  gridMarker.value = null
  detailSegment.value = segment
}

function closeOverlay() {
  selectedSegment.value = null
  gridMarker.value = null
}

function closeDetail() {
  detailSegment.value = null
}

function togglePatternLabel(label: PatternLabelKey) {
  statementStore.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as PatternLabelKey)
}
</script>

<template>
  <section
    class="strategy-view strategy-view--structure"
  >
    <MirroredLineGrid
      class="strategy-view__line-grid"
      :max-value="maxStatementsPerSide"
      :marker="gridMarker"
      scale-label="Number of Statements"
      :step-size="countStep"
    />

    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      subline="Select a pattern to read its description, or select a subpattern to inspect its coded statements."
      title="How are the Patterns distributed?"
      @select="emit('section-select', $event)"
    />

    <div class="strategy-view__content">
      <section
        class="strategy-view__structure"
        aria-label="Pattern label structure"
      >
        <StrategyIcicleDiagram
          :records="filteredRecords"
          @grid-marker-change="gridMarker = $event"
          @segment-click="handleSegmentClick"
          @segment-hover="handleSegmentHover"
        />
      </section>
    </div>

    <section class="pattern-filter-overlay" aria-label="Pattern Filter">
      <section class="pattern-filters">
        <div class="pattern-search-filter">
          <input
            :value="filters.query"
            type="search"
            placeholder="Search for terms like &quot;destroy&quot;"
            @input="statementStore.setQuery(($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="filters.query"
            type="button"
            class="pattern-search-filter__clear"
            aria-label="Clear pattern search"
            @click="statementStore.setQuery('')"
          >
            ×
          </button>
        </div>

        <div class="pattern-measure-filter">
          <DropdownSelect
            v-model="selectedMeasureCategory"
            :options="measureCategoryOptions"
            select-label="Filter patterns by content category"
          />
        </div>

        <FilterButtonContainer
          :labels="patternFilterLabels"
          @select="togglePatternLabelByKey"
        />
      </section>
    </section>

    <SideOverlay
      :visible="Boolean(selectedSegment && selectedSegment.parent === null)"
      :title="selectedSegment?.label ?? ''"
      :text="selectedSegment?.description ?? ''"
      :color="selectedSegment?.color"
      @close="closeOverlay"
    />

    <SideOverlay
      :visible="Boolean(selectedSegment?.parent)"
      :title="selectedSegment?.label ?? ''"
      :text="selectedSubpatternDescription"
      :color="selectedSegment?.color"
      side="left"
      @close="closeOverlay"
    />

    <button
      v-if="detailSegment"
      type="button"
      class="strategy-view__scrim"
      aria-label="Pattern detail view schliessen"
      @click="closeDetail"
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <SelectionView
          v-if="detailSegment"
          :header-color="detailSegment.color"
          :records="detailRecords"
          :title="detailSegment.label"
          @close="closeDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/PatternsView.css';
</style>
