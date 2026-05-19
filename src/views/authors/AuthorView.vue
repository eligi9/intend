<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import FilterButton from '../../components/filter-button/FilterButton.vue'
import AuthorPortrait from '../../components/author-portrait/AuthorPortrait.vue'
import { useAuthorStore } from '../../stores/authorStore'
import type { IntentLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { toggleArrayItem } from '../../utils/arrays'
import { taxonomyButtonColors } from '../../utils/intentLabels'

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)

const selectedSector = ref<string | null>(null)
const selectedGender = ref<string | null>(null)
const selectedLabels = ref<IntentLabelKey[]>([])

const sectors = computed(() =>
  [...new Set(authorInstances.value.map((author) => author.sector).filter(Boolean))] as string[],
)
const genders = computed(() => {
  const availableGenders = new Set(authorInstances.value.map((author) => author.gender ?? 'unknown'))

  return ['female', 'male', 'unknown'].filter((gender) => availableGenders.has(gender))
})

function toggleSector(sector: string) {
  selectedSector.value = selectedSector.value === sector ? null : sector
}

function toggleGender(gender: string) {
  selectedGender.value = selectedGender.value === gender ? null : gender
}

function toggleOverLabel(label: IntentLabelKey) {
  selectedLabels.value = toggleArrayItem(selectedLabels.value, label)
}

function getGenderLabel(gender: string) {
  if (gender === 'female') return 'Female'
  if (gender === 'male') return 'Male'
  return 'Unbekannt'
}

function matchesAuthorFilters(
  authorLabels: IntentLabelKey[],
  sector: string | null,
  gender: string | null,
) {
  const matchesSector = !selectedSector.value || sector === selectedSector.value
  const matchesGender = !selectedGender.value || (gender ?? 'unknown') === selectedGender.value
  const matchesLabels = selectedLabels.value.every((label) => authorLabels.includes(label))

  return matchesSector && matchesGender && matchesLabels
}
</script>

<template>
  <section class="author-view">
    <header class="author-view__header">
      <h2>Author View</h2>
    </header>

    <section class="author-filters" aria-label="Autoren Filter">
      <section class="author-filter-card" aria-label="Sector Filter">
        <small>Sector</small>
        <div class="author-filter-row">
          <FilterButton
            v-for="sector in sectors"
            :key="sector"
            :label="sector"
            color="#858b94"
            :active="selectedSector === sector"
            @click="toggleSector(sector)"
          />
        </div>
      </section>

      <section class="author-filter-card" aria-label="Geschlecht Filter">
        <small>Geschlecht</small>
        <div class="author-filter-row">
          <FilterButton
            v-for="gender in genders"
            :key="gender"
            :label="getGenderLabel(gender)"
            color="#858b94"
            :active="selectedGender === gender"
            @click="toggleGender(gender)"
          />
        </div>
      </section>

      <section class="author-filter-card" aria-label="Überlabel Filter">
        <small>Mobilisierung Strategie</small>
        <div class="author-filter-row">
          <FilterButton
            v-for="group in intentTaxonomy"
            :key="group.id"
            :label="group.label"
            :color="taxonomyButtonColors[group.id]"
            :active="group.parentLabel ? selectedLabels.includes(group.parentLabel) : false"
            @click="group.parentLabel && toggleOverLabel(group.parentLabel)"
          />
        </div>
      </section>
    </section>

    <section class="author-view__grid" aria-label="Autoren">
      <article
        v-for="author in authorInstances"
        :key="author.id"
        class="author-view__item"
        :class="{
          'author-view__item--muted': !matchesAuthorFilters(
            author.usedTopLevelStrategyLabels,
            author.sector,
            author.gender,
          ),
        }"
      >
        <AuthorPortrait :author="author" :size="104" />
      </article>
    </section>
  </section>
</template>

<style scoped>
@import './AuthorView.css';
</style>
