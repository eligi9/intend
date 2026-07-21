<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import GridColumnLabels from '../../components/common/GridColumnLabels.vue'
import SelectionView from '../../components/common/SelectionView.vue'
import StrategyButton from '../../components/common/StrategyButton.vue'
import VerticalLineGrid from '../../components/common/VerticalLineGrid.vue'
import ViewGrid from '../../components/common/ViewGrid.vue'
import ExploreFilterBar from '../../components/explore/ExploreFilterBar.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StatementButton from '../../components/statement/StatementButton.vue'
import { useAuthorDetailStore } from '../../stores/authorDetailStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import { intentTaxonomy } from '../../utils/intentTaxonomy'
import { strategyColors } from '../../utils/intentLabels'
import { getMainLabelCount, sortStatementsBySize } from '../../utils/sort'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const authorDetailStore = useAuthorDetailStore()
const { filteredRecords, filters } = storeToRefs(statementStore)
const selectionDetailIsOpen = ref(false)
const statementGridLineCount = 25
const statementGridLabels: string[] = []

const patternFilterLabels = computed(() =>
  intentTaxonomy.map((group) => ({
    active: filters.value.labelsAll.includes(group.parentLabel),
    color: strategyColors[group.parentLabel] ?? 'var(--color-neutral)',
    key: group.parentLabel,
    label: group.label,
  })),
)
const sortedRecords = computed(() => sortStatementsBySize(filteredRecords.value))
const statementSegments = computed(() =>
  [4, 3, 2, 1, 0]
    .map((patternCount) => ({
      patternCount,
      records: sortedRecords.value.filter(
        (record) => getMainLabelCount(record) === patternCount,
      ),
    })),
)
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

function openStatementDetail(statementId: string, authorName: string) {
  authorDetailStore.openAuthorDetail(authorName, { recordIds: [statementId] })
}

function openSelectionDetail() {
  selectionDetailIsOpen.value = true
}

function closeSelectionDetail() {
  selectionDetailIsOpen.value = false
}

function closeActiveDetail() {
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

    <VerticalLineGrid
      class="statement-view__line-grid"
      :labels="statementGridLabels"
      :line-count="statementGridLineCount"
    />

    <GridColumnLabels
      :columns="24"
      :labels="[1, 5, 10, 15, 20]"
      :padding-inline-cells="2"
      scale-label="Number of statements"
    />

    <section class="statement-view__groups" aria-label="Statements by number of categories used">
      <span class="statement-view__category-scale-label" aria-hidden="true">
        Amount of<br />categories used
      </span>

      <section
        v-for="segment in statementSegments"
        :key="segment.patternCount"
        v-show="segment.records.length > 0"
        class="statement-view__group"
        :aria-label="`${segment.patternCount} categories used`"
      >
        <span class="statement-view__group-count" aria-hidden="true">
          {{ segment.patternCount }}
        </span>

        <ViewGrid
          class="statement-view__statements"
          cell-size="var(--statement-grid-cell-size)"
          :padding-inline-cells="2"
          :show-lines="false"
        >
          <StatementButton
            v-for="statement in segment.records"
            :key="statement.id"
            :statement="statement"
            @click="openStatementDetail(statement.id, statement.author)"
          />
        </ViewGrid>
      </section>

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
    </section>

    <ExploreFilterBar select-label="Filter statements by content category" />

    <button
      v-if="selectionDetailIsOpen"
      type="button"
      class="statement-view__scrim"
      aria-label="Statement Detailansicht schliessen"
      @click="closeActiveDetail"
    />

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
