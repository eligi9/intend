<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatementStore } from '../../stores/statementStore'
import type { MeasureCategory, PatternLabelKey } from '../../types/intentData'
import { toggleArrayItem } from '../../utils/arrays'
import { strategyColors } from '../../utils/intentLabels'
import { intentTaxonomy } from '../../utils/intentTaxonomy'
import DropdownSelect from '../common/DropdownSelect.vue'
import FilterButtonContainer from '../common/FilterButtonContainer.vue'

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    selectLabel?: string
    zIndex?: number
  }>(),
  {
    ariaLabel: 'Statement filters',
    selectLabel: 'Filter by content category',
    zIndex: 20,
  },
)

const statementStore = useStatementStore()
const { filters } = storeToRefs(statementStore)
const measureCategoryOptions: { label: string; value: '' | MeasureCategory }[] = [
  { label: 'All content types', value: '' },
  { label: 'Destruction', value: 'Destruction' },
  { label: 'Aid Control / Deprivation', value: 'Aid Control / Deprivation' },
  { label: 'Forced Displacement', value: 'Forced Displacement' },
  { label: 'Physical Harm', value: 'Physical Harm' },
  { label: 'Occupation / Settlement', value: 'Occupation / Settlement' },
]

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
const filterBarStyle = computed(() => ({
  '--explore-filter-z-index': props.zIndex,
}))

function togglePatternLabel(label: string) {
  statementStore.setLabelsAll(
    toggleArrayItem(filters.value.labelsAll, label as PatternLabelKey),
  )
}
</script>

<template>
  <section
    class="explore-filter-overlay"
    :style="filterBarStyle"
    :aria-label="ariaLabel"
  >
    <section class="explore-filter-bar">
      <div class="explore-filter-bar__search">
        <input
          :value="filters.query"
          type="search"
          placeholder="Search for terms like &quot;destroy&quot;"
          @input="statementStore.setQuery(($event.target as HTMLInputElement).value)"
        />
        <button
          v-if="filters.query"
          type="button"
          class="explore-filter-bar__clear"
          aria-label="Clear search"
          @click="statementStore.setQuery('')"
        >
          ×
        </button>
      </div>

      <div class="explore-filter-bar__measure">
        <DropdownSelect
          v-model="selectedMeasureCategory"
          :options="measureCategoryOptions"
          :select-label="selectLabel"
        />
      </div>

      <FilterButtonContainer
        :labels="patternFilterLabels"
        @select="togglePatternLabel"
      />
    </section>
  </section>
</template>

<style scoped>
@import '../../css/components/explore/ExploreFilterBar.css';
</style>
