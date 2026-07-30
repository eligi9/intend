<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import AuthorButton from '../../components/button/AuthorButton.vue'
import GridColumnLabels from '../../components/grid/GridColumnLabels.vue'
import ViewGrid from '../../components/grid/ViewGrid.vue'
import AppHeader from '../../components/ui/AppHeader.vue'
import FilterBar from '../../components/ui/FilterBar.vue'
import { useInitialViewportGridCell } from '../../composables/useInitialViewportGridCell'
import { useAuthorDetailStore } from '../../stores/authorDetailStore'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { AuthorInstance } from '../../types/authorData'
import type { AppHeaderProps, ExploreViewSection } from '../../types/exploreView'

defineProps<AppHeaderProps>()

const emit = defineEmits<{
  'establishment-select': []
  'section-select': [section: ExploreViewSection]
}>()

const authorStore = useAuthorStore()
const authorDetailStore = useAuthorDetailStore()
const statementStore = useStatementStore()
const { authorInstances } = storeToRefs(authorStore)
const { filteredRecords } = storeToRefs(statementStore)

const {
  cellSize: authorGridCellSize,
  cellSizePx: authorGridCellSizePx,
} = useInitialViewportGridCell({ columns: 16 })
const authorRepresentationSize = computed(() => Math.max(0, authorGridCellSizePx.value - 8))

const visibleAuthorNames = computed(
  () => new Set(filteredRecords.value.map((record) => record.author)),
)
const otherPoliticalAndStateActors = computed(() =>
  sortAuthorsBySelectionAndPatternCount(
    authorInstances.value.filter((author) => author.roleGroup !== 'executive_officials'),
  ),
)
const executiveLeadership = computed(() =>
  sortAuthorsBySelectionAndPatternCount(
    authorInstances.value.filter((author) => author.roleGroup === 'executive_officials'),
  ),
)

function sortAuthorsBySelectionAndPatternCount(authors: AuthorInstance[]) {
  return [...authors].sort((first, second) =>
    Number(isAuthorVisible(second)) - Number(isAuthorVisible(first)) ||
    second.usedTopLevelStrategyCount - first.usedTopLevelStrategyCount ||
    first.name.localeCompare(second.name),
  )
}

function isAuthorVisible(author: AuthorInstance) {
  return visibleAuthorNames.value.has(author.name)
}

function showAuthorDetail(authorName: string) {
  const filteredAuthorRecordIds = filteredRecords.value
    .filter((record) => record.author === authorName)
    .map((record) => record.id)

  authorDetailStore.openAuthorDetail(authorName, {
    recordIds: filteredAuthorRecordIds,
  })
}
</script>

<template>
  <section class="author-view" :style="{ '--author-grid-cell-size': authorGridCellSize }">
    <AppHeader
      :active-section="activeSection"
      :sections="sections"
      subline="Hover to preview. Click to explore the author’s statements."
      title="Who made these statements?"
      @establishment-select="emit('establishment-select')"
      @select="emit('section-select', $event)"
    />

    <FilterBar
      aria-label="Autoren Filter"
      select-label="Filter authors by content category"
    />

    <GridColumnLabels
      :cell-size-px="authorGridCellSizePx"
      :columns="14"
      :labels="[1, 5, 10]"
      :offset-cells="1"
      :padding-inline-cells="2"
      scale-label="Number of Authors"
    />

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
          <AuthorButton
            v-for="author in executiveLeadership"
            :key="author.id"
            class="author-view__item"
            :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
            :author="author"
            background-color="var(--color-white)"
            :disabled="!isAuthorVisible(author)"
            :size="authorRepresentationSize"
            @select="showAuthorDetail(author.name)"
          />
        </ViewGrid>
      </section>

      <section
        class="author-view__group author-view__group--parliament"
        aria-label="Other political and state officials"
      >
        <span class="author-view__group-divider-label author-view__group-divider-label--above">
          Cabinet &amp;<br />
          Executive Leadership
        </span>
        <span class="author-view__group-divider-label author-view__group-divider-label--below">
          Other Political &amp;<br />
          State Officials
        </span>

        <ViewGrid
          class="author-view__authors"
          cell-size="var(--author-grid-cell-size)"
          :padding-inline-cells="3"
          :show-lines="false"
        >
          <AuthorButton
            v-for="author in otherPoliticalAndStateActors"
            :key="author.id"
            class="author-view__item"
            :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
            :author="author"
            background-color="var(--color-white)"
            :disabled="!isAuthorVisible(author)"
            :size="authorRepresentationSize"
            @select="showAuthorDetail(author.name)"
          />
        </ViewGrid>
      </section>
    </section>

  </section>
</template>

<style scoped>
@import '../../css/views/explore/AuthorView.css';
</style>
