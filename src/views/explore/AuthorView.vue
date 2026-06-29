<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import AuthorPortrait from '../../components/author/AuthorPortrait.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import { useAuthorStore } from '../../stores/authorStore'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { toggleArrayItem } from '../../utils/arrays'
import { taxonomyButtonColors } from '../../utils/intentLabels'
import AuthorDetailView from './AuthorDetailView.vue'

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)

const selectedSector = ref<string | null>(null)
const selectedGender = ref<string | null>(null)
const selectedPatternLabels = ref<IntentLabelKey[]>([])
const selectedAuthorId = ref<string | null>(null)
const authorPortraitSize = 92

const sectors = computed(() =>
  [...new Set(authorInstances.value.map((author) => author.sector).filter(Boolean))] as string[],
)
const genders = computed(() => {
  const availableGenders = new Set(authorInstances.value.map((author) => author.gender ?? 'unknown'))

  return ['female', 'male'].filter((gender) => availableGenders.has(gender))
})
const sectorFilterLabels = computed(() =>
  sectors.value.map((sector) => ({
    active: selectedSector.value === sector,
    color: 'var(--color-neutral)',
    key: sector,
    label: sector,
  })),
)
const genderFilterLabels = computed(() =>
  genders.value.map((gender) => ({
    active: selectedGender.value === gender,
    color: 'var(--color-neutral)',
    key: gender,
    label: getGenderLabel(gender),
  })),
)
const patternFilterLabels = computed(() =>
  intentTaxonomy.map((group) => ({
    active: selectedPatternLabels.value.includes(group.parentLabel),
    color: taxonomyButtonColors[group.parentLabel] ?? 'var(--color-neutral)',
    key: group.parentLabel,
    label: group.label,
  })),
)

function toggleSector(sector: string) {
  selectedSector.value = selectedSector.value === sector ? null : sector
}

function toggleGender(gender: string) {
  selectedGender.value = selectedGender.value === gender ? null : gender
}

function togglePatternLabel(label: IntentLabelKey) {
  selectedPatternLabels.value = toggleArrayItem(selectedPatternLabels.value, label)
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as IntentLabelKey)
}

function getGenderLabel(gender: string) {
  if (gender === 'female') return 'Female'
  return 'Male'
}

function isAuthorVisible(author: AuthorInstance) {
  const matchesSector = !selectedSector.value || author.sector === selectedSector.value
  const matchesGender = !selectedGender.value || (author.gender ?? 'unknown') === selectedGender.value
  const matchesPatterns = selectedPatternLabels.value.every((label) =>
    author.usedTopLevelStrategyLabels.includes(label),
  )

  return matchesSector && matchesGender && matchesPatterns
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
    <header class="author-view__header">
      <h2>Authors</h2>
    </header>

    <section class="author-filter-overlay" aria-label="Autoren Filter">
      <section class="author-filters">
        <FilterButtonContainer
          title="Sector"
          :labels="sectorFilterLabels"
          @select="toggleSector"
        />
        <FilterButtonContainer
          title="Geschlecht"
          :labels="genderFilterLabels"
          @select="toggleGender"
        />
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

    <AuthorDetailView
      v-if="selectedAuthorId"
      :author-id="selectedAuthorId"
      @close="closeAuthorDetail"
    />
  </section>
</template>

<style scoped>
@import '../../css/views/explore/AuthorView.css';
</style>
