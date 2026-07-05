<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import AuthorPortrait from '../../components/author/AuthorPortrait.vue'
import DetailView from '../../components/common/DetailView.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { AuthorInstance } from '../../types/authorData'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { PatternLabelKey } from '../../types/intentData'
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

const selectedGender = ref('')
const selectedPatternLabels = ref<PatternLabelKey[]>([])
const selectedAuthorId = ref<string | null>(null)
const authorPortraitSize = 92

const selectedAuthor = computed(
  () => authorInstances.value.find((author) => author.id === selectedAuthorId.value) ?? null,
)
const selectedAuthorStatements = computed(() =>
  selectedAuthor.value ? statementStore.getStatementsForAuthor(selectedAuthor.value.name) : [],
)
const genders = computed(() => {
  const availableGenders = new Set(authorInstances.value.map((author) => author.gender ?? 'unknown'))

  return ['female', 'male'].filter((gender) => availableGenders.has(gender))
})
const patternFilterLabels = computed(() =>
  intentTaxonomy.map((group) => ({
    active: selectedPatternLabels.value.includes(group.parentLabel),
    color: strategyColors[group.parentLabel] ?? 'var(--color-neutral)',
    key: group.parentLabel,
    label: group.label,
  })),
)

function togglePatternLabel(label: PatternLabelKey) {
  selectedPatternLabels.value = toggleArrayItem(selectedPatternLabels.value, label)
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as PatternLabelKey)
}

function isAuthorVisible(author: AuthorInstance) {
  const matchesGender = selectedGender.value === '' || (author.gender ?? 'unknown') === selectedGender.value
  const matchesPatterns = selectedPatternLabels.value.every((label) =>
    author.usedTopLevelStrategyLabels.includes(label),
  )

  return matchesGender && matchesPatterns
}

function showAuthorDetail(authorId: string) {
  selectedAuthorId.value = authorId
}

function closeAuthorDetail() {
  selectedAuthorId.value = null
}
</script>

<template>
  <section class="author-view">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      title="Authors"
      @select="emit('section-select', $event)"
    />

    <section class="author-filter-overlay" aria-label="Autoren Filter">
      <section class="author-filters">
        <div class="author-gender-filter">
          <small>Gender</small>
          <div class="author-gender-filter__select">
            <select v-model="selectedGender" aria-label="Filter authors by gender">
              <option value="">All</option>
              <option
                v-for="gender in genders"
                :key="gender"
                :value="gender"
              >
                {{ gender === 'female' ? 'Female' : 'Male' }}
              </option>
            </select>
          </div>
        </div>

        <FilterButtonContainer
          title="Mobilization Pattern"
          :labels="patternFilterLabels"
          @select="togglePatternLabelByKey"
        />
      </section>
    </section>

    <section class="author-view__authors" aria-label="Autoren">
      <button
        v-for="author in authorInstances"
        :key="author.id"
        type="button"
        class="author-view__item"
        :class="{ 'author-view__item--muted': !isAuthorVisible(author) }"
        :aria-label="`${author.name} Details anzeigen`"
        @click="showAuthorDetail(author.id)"
      >
        <AuthorPortrait :author="author" :size="authorPortraitSize" />
      </button>
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
          :show-author-facts="true"
          @close="closeAuthorDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/AuthorView.css';
</style>
