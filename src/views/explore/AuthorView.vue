<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import AuthorPortrait from '../../components/author/AuthorPortrait.vue'
import DetailView from '../../components/common/DetailView.vue'
import ViewGrid from '../../components/common/ViewGrid.vue'
import ExploreFilterBar from '../../components/explore/ExploreFilterBar.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import { useInitialViewportGridCell } from '../../composables/useInitialViewportGridCell'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { AuthorInstance } from '../../types/authorData'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const authorStore = useAuthorStore()
const statementStore = useStatementStore()
const { authorInstances } = storeToRefs(authorStore)
const { filteredRecords } = storeToRefs(statementStore)

const selectedAuthorId = ref<string | null>(null)
const {
  cellSize: authorGridCellSize,
  cellSizePx: authorGridCellSizePx,
} = useInitialViewportGridCell({ columns: 16 })
const authorPortraitSize = computed(() => Math.max(0, authorGridCellSizePx.value - 8))

const selectedAuthor = computed(
  () => authorInstances.value.find((author) => author.id === selectedAuthorId.value) ?? null,
)
const selectedAuthorStatements = computed(() =>
  selectedAuthor.value
    ? filteredRecords.value.filter((record) => record.author === selectedAuthor.value?.name)
    : [],
)
const visibleAuthorNames = computed(
  () => new Set(filteredRecords.value.map((record) => record.author)),
)
const otherPoliticalAndStateActors = computed(() =>
  authorInstances.value.filter((author) => author.roleGroup !== 'executive_officials'),
)
const executiveLeadership = computed(() =>
  authorInstances.value.filter((author) => author.roleGroup === 'executive_officials'),
)

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

    <ExploreFilterBar
      aria-label="Autoren Filter"
      select-label="Filter authors by content category"
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
          <button
            v-for="author in executiveLeadership"
            :key="author.id"
            type="button"
            class="author-view__item"
            :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
            :disabled="!isAuthorVisible(author)"
            :aria-label="`${author.name} Details anzeigen`"
            @click="showAuthorDetail(author.id)"
          >
            <AuthorPortrait :author="author" :size="authorPortraitSize" />
          </button>
        </ViewGrid>
      </section>

      <section
        class="author-view__group author-view__group--parliament"
        aria-label="Other political and state officials"
      >
        <span class="author-view__group-divider-label author-view__group-divider-label--above">
          Government &amp;<br />
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
          <button
            v-for="author in otherPoliticalAndStateActors"
            :key="author.id"
            type="button"
            class="author-view__item"
            :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
            :disabled="!isAuthorVisible(author)"
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
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/AuthorView.css';
</style>
