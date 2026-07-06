<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DetailView from '../../components/common/DetailView.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import SelectionView from '../../components/common/SelectionView.vue'
import ViewGrid from '../../components/common/ViewGrid.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StatementButton from '../../components/statement/StatementButton.vue'
import { useInitialViewportGridCellSize } from '../../composables/useInitialViewportGridCellSize'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { toggleArrayItem } from '../../utils/arrays'
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
const statementGridCellSize = useInitialViewportGridCellSize({ columns: 24 })

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
    filters.value.authors.length > 0 ||
    filters.value.labelsAny.length > 0 ||
    filters.value.labelsAll.length > 0,
)
const canShowSelection = computed(
  () => hasActiveStatementFilters.value && sortedRecords.value.length > 0,
)
const activePatternFilterLabels = computed(() =>
  patternFilterLabels.value
    .filter((label) => label.active)
    .map((label) => ({
      color: label.color,
      label: label.label,
    })),
)
const selectionTitle = 'Selection'
const selectionSearchTerm = computed(() => filters.value.query.trim())

function togglePatternLabel(label: PatternLabelKey) {
  statementStore.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as PatternLabelKey)
}

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
  <section class="statement-view" :style="{ '--statement-grid-cell-size': statementGridCellSize }">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      title="Statements"
      @select="emit('section-select', $event)"
    />

    <ViewGrid
      class="statement-view__layout"
      aria-label="Statements"
      cell-size="var(--statement-grid-cell-size)"
      :padding-block-start-cells="3"
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
    </ViewGrid>

    <button
      v-if="canShowSelection"
      type="button"
      class="statement-selection-button"
      @click="openSelectionDetail"
    >
      Show selection
    </button>

    <section class="statement-filter-overlay" aria-label="Statement Filter">
      <section class="statement-filters">
        <div class="statement-search-filter">
          <input
            :value="filters.query"
            type="search"
            placeholder="Search for terms like &quot;destroy&quot;"
            @input="statementStore.setQuery(($event.target as HTMLInputElement).value)"
          />
        </div>

        <FilterButtonContainer
          :labels="patternFilterLabels"
          @select="togglePatternLabelByKey"
        />
      </section>
    </section>

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
          @close="closeStatementDetail"
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
          @close="closeSelectionDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/StatementView.css';
</style>
