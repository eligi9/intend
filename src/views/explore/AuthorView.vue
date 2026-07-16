<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import AuthorPortrait from '../../components/author/AuthorPortrait.vue'
import DetailView from '../../components/common/DetailView.vue'
import DropdownSelect from '../../components/common/DropdownSelect.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import ViewGrid from '../../components/common/ViewGrid.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import { useInitialViewportGridCell } from '../../composables/useInitialViewportGridCellSize'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { AuthorInstance } from '../../types/authorData'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { MeasureCategory, PatternLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { toggleArrayItem } from '../../utils/arrays'
import { strategyColors } from '../../utils/intentLabels'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const authorStore = useAuthorStore()
const statementStore = useStatementStore()
const { authorInstances } = storeToRefs(authorStore)
const { filteredRecords, filters } = storeToRefs(statementStore)

const selectedAuthorId = ref<string | null>(null)
const measureCategoryOptions: { label: string; value: '' | MeasureCategory }[] = [
  { label: 'All content types', value: '' },
  { label: 'Destruction', value: 'Destruction' },
  { label: 'Aid Control / Deprivation', value: 'Aid Control / Deprivation' },
  { label: 'Forced Displacement', value: 'Forced Displacement' },
  { label: 'Physical Harm', value: 'Physical Harm' },
  { label: 'Occupation / Settlement', value: 'Occupation / Settlement' },
]
const {
  cellSize: authorGridCellSize,
  cellSizePx: authorPortraitSize,
} = useInitialViewportGridCell({ columns: 16 })

const selectedAuthor = computed(
  () => authorInstances.value.find((author) => author.id === selectedAuthorId.value) ?? null,
)
const selectedAuthorStatements = computed(() =>
  selectedAuthor.value
    ? filteredRecords.value.filter((record) => record.author === selectedAuthor.value?.name)
    : [],
)
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
const visibleAuthorNames = computed(
  () => new Set(filteredRecords.value.map((record) => record.author)),
)
const parliamentAndOtherOfficials = computed(() =>
  authorInstances.value.filter((author) => author.roleGroup !== 'executive_officials'),
)
const governmentMinisters = computed(() =>
  authorInstances.value.filter((author) => author.roleGroup === 'executive_officials'),
)

function togglePatternLabel(label: PatternLabelKey) {
  statementStore.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as PatternLabelKey)
}

function isAuthorVisible(author: AuthorInstance) {
  return visibleAuthorNames.value.has(author.name)
}

function showAuthorDetail(authorId: string) {
  selectedAuthorId.value = authorId
}

function closeAuthorDetail() {
  selectedAuthorId.value = null
}
</script>

<template>
  <section class="author-view" :style="{ '--author-grid-cell-size': authorGridCellSize }">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      subline="What do they demand, and how do they justify it?"
      title="Who made these statements?"
      @select="emit('section-select', $event)"
    />

    <section class="author-filter-overlay" aria-label="Autoren Filter">
      <section class="author-filters">
        <div class="author-search-filter">
          <input
            :value="filters.query"
            type="search"
            placeholder="Search for terms like &quot;destroy&quot;"
            @input="statementStore.setQuery(($event.target as HTMLInputElement).value)"
          />
          <button
            v-if="filters.query"
            type="button"
            class="author-search-filter__clear"
            aria-label="Clear author search"
            @click="statementStore.setQuery('')"
          >
            ×
          </button>
        </div>

        <div class="author-measure-filter">
          <DropdownSelect
            v-model="selectedMeasureCategory"
            :options="measureCategoryOptions"
            select-label="Filter authors by content category"
          />
        </div>

        <FilterButtonContainer
          :labels="patternFilterLabels"
          @select="togglePatternLabelByKey"
        />
      </section>
    </section>

    <ViewGrid
      class="author-view__background-grid"
      aria-hidden="true"
      cell-size="var(--author-grid-cell-size)"
    />

    <section class="author-view__groups" aria-label="Authors by role">
      <section class="author-view__group" aria-label="Government ministers">
        <ViewGrid
          class="author-view__authors"
          cell-size="var(--author-grid-cell-size)"
          :padding-block-start-cells="2"
          :padding-inline-cells="3"
          :show-lines="false"
        >
          <button
            v-for="author in governmentMinisters"
            :key="author.id"
            type="button"
            class="author-view__item"
            :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
            :aria-label="`${author.name} Details anzeigen`"
            @click="showAuthorDetail(author.id)"
          >
            <AuthorPortrait :author="author" :size="authorPortraitSize" />
          </button>
        </ViewGrid>
      </section>

      <section
        class="author-view__group author-view__group--parliament"
        aria-label="Members of Parliament and other officials"
      >
        <span class="author-view__group-divider-label author-view__group-divider-label--above">
          Executive Officials
        </span>
        <span class="author-view__group-divider-label author-view__group-divider-label--below">
          Legislators and others
        </span>

        <ViewGrid
          class="author-view__authors"
          cell-size="var(--author-grid-cell-size)"
          :padding-inline-cells="3"
          :show-lines="false"
        >
          <button
            v-for="author in parliamentAndOtherOfficials"
            :key="author.id"
            type="button"
            class="author-view__item"
            :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
            :aria-label="`${author.name} Details anzeigen`"
            @click="showAuthorDetail(author.id)"
          >
            <AuthorPortrait :author="author" :size="authorPortraitSize" />
          </button>
        </ViewGrid>
      </section>
    </section>

    <button
      v-if="selectedAuthorId"
      type="button"
      class="author-view__scrim"
      aria-label="Autor Detailansicht schliessen"
      @click="closeAuthorDetail"
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <DetailView
          v-if="selectedAuthorId"
          :author="selectedAuthor"
          :records="selectedAuthorStatements"
          @close="closeAuthorDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/AuthorView.css';
</style>
