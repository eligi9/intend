<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DetailView from '../../components/common/DetailView.vue'
import GridColumnLabels from '../../components/common/GridColumnLabels.vue'
import SelectionView from '../../components/common/SelectionView.vue'
import StrategyButton from '../../components/common/StrategyButton.vue'
import ViewGrid from '../../components/common/ViewGrid.vue'
import ExploreFilterBar from '../../components/explore/ExploreFilterBar.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StatementButton from '../../components/statement/StatementButton.vue'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { IntentRecord } from '../../types/intentData'
import { intentTaxonomy } from '../../utils/intentTaxonomy'
import { strategyColors } from '../../utils/intentLabels'
import { sortStatementsBySize } from '../../utils/sort'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const { filteredRecords, filters } = storeToRefs(statementStore)
const selectedStatement = ref<IntentRecord | null>(null)
const selectionDetailIsOpen = ref(false)

const selectedAuthor = computed(() =>
  selectedStatement.value ? authorStore.getAuthorInstance(selectedStatement.value.author) : null,
)
const patternFilterLabels = computed(() =>
  intentTaxonomy.map((group) => ({
    active: filters.value.labelsAll.includes(group.parentLabel),
    color: strategyColors[group.parentLabel] ?? 'var(--color-neutral)',
    key: group.parentLabel,
    label: group.label,
  })),
)
const sortedRecords = computed(() => sortStatementsBySize(filteredRecords.value))
const hasActiveStatementFilters = computed(
  () =>
    filters.value.query.trim().length > 0 ||
    filters.value.labelsAll.length > 0 ||
    filters.value.measureCategories.length > 0,
)
const canShowSelection = computed(
  () => hasActiveStatementFilters.value && sortedRecords.value.length > 0,
)
const activePatternFilterLabels = computed(() =>
  [
    ...patternFilterLabels.value
    .filter((label) => label.active)
    .map((label) => ({
      color: label.color,
      label: label.label,
    })),
    ...filters.value.measureCategories.map((category) => ({
      color: 'rgba(var(--color-text-rgb), 0.74)',
      label: category,
    })),
  ],
)
const selectionTitle = 'Selection'
const selectionSearchTerm = computed(() => filters.value.query.trim())

function closeStatementDetail() {
  selectedStatement.value = null
}

function openSelectionDetail() {
  selectedStatement.value = null
  selectionDetailIsOpen.value = true
}

function closeSelectionDetail() {
  selectionDetailIsOpen.value = false
}

function closeActiveDetail() {
  closeStatementDetail()
  closeSelectionDetail()
}
</script>

<template>
  <section class="statement-view">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      subline="Click to read, or use filters to create your own selection."
      title="How do statements frame proposed actions?"
      @select="emit('section-select', $event)"
    />

    <GridColumnLabels
      :columns="24"
      :labels="[1, 5, 10, 15, 20]"
      :padding-inline-cells="2"
    />

    <ViewGrid
      class="statement-view__layout"
      aria-label="Statements"
      cell-size="var(--statement-grid-cell-size)"
      :padding-block-start-cells="2"
      :padding-inline-cells="2"
    >
      <StatementButton
        v-for="statement in sortedRecords"
        :key="statement.id"
        :statement="statement"
        @click="selectedStatement = statement"
      />

      <div v-if="filteredRecords.length === 0" class="statement-view__empty">
        <strong>Keine Statements gefunden</strong>
        <span>Filter zurücksetzen oder Suchbegriff ändern.</span>
      </div>

      <StrategyButton
        v-if="canShowSelection"
        class="statement-selection-button"
        color="var(--color-black)"
        label="Show selection"
        min-width="8rem"
        @select="openSelectionDetail"
      />
    </ViewGrid>

    <ExploreFilterBar select-label="Filter statements by content category" />

    <button
      v-if="selectedStatement || selectionDetailIsOpen"
      type="button"
      class="statement-view__scrim"
      aria-label="Statement Detailansicht schliessen"
      @click="closeActiveDetail"
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <DetailView
          v-if="selectedStatement"
          :author="selectedAuthor"
          :records="[selectedStatement]"
        />
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="detail-overlay">
        <SelectionView
          v-if="selectionDetailIsOpen"
          :records="sortedRecords"
          :title="selectionTitle"
          :search-term="selectionSearchTerm"
          :labels="activePatternFilterLabels"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/StatementView.css';
</style>
