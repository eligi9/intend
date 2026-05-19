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
const selectedLabels = ref<IntentLabelKey[]>([])

const sectors = computed(() =>
  [...new Set(authorInstances.value.map((author) => author.sector).filter(Boolean))] as string[],
)

function toggleSector(sector: string) {
  selectedSector.value = selectedSector.value === sector ? null : sector
}

function toggleOverLabel(label: IntentLabelKey) {
  selectedLabels.value = toggleArrayItem(selectedLabels.value, label)
}

function matchesAuthorFilters(authorLabels: IntentLabelKey[], sector: string | null) {
  const matchesSector = !selectedSector.value || sector === selectedSector.value
  const matchesLabels = selectedLabels.value.every((label) => authorLabels.includes(label))

  return matchesSector && matchesLabels
}
</script>

<template>
  <section class="author-view">
    <header class="author-view__header">
      <p class="eyebrow">Author View</p>
      <h2>Autoren</h2>
    </header>

    <section class="author-filters" aria-label="Autoren Filter">
      <small>Filter</small>

      <div class="author-filter-panel">
        <section class="author-filter-group" aria-label="Sector Filter">
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

        <section class="author-filter-group" aria-label="Überlabel Filter">
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
      </div>
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
