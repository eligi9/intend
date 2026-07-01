<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StatementButton from '../../components/statement/StatementButton.vue'
import StatementDetailView from '../../components/statement/StatementDetailView.vue'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { toggleArrayItem } from '../../utils/arrays'
import { strategyColors } from '../../utils/intentLabels'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const { filteredRecords, filters } = storeToRefs(statementStore)
const selectedStatement = ref<IntentRecord | null>(null)

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

function togglePatternLabel(label: PatternLabelKey) {
  statementStore.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function togglePatternLabelByKey(label: string) {
  togglePatternLabel(label as PatternLabelKey)
}

function closeStatementDetail() {
  selectedStatement.value = null
}
</script>

<template>
  <section class="statement-view">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      title="Statements"
      @select="emit('section-select', $event)"
    />

    <section class="statement-view__content" aria-label="Statements">
      <button
        v-if="selectedStatement"
        type="button"
        class="statement-view__scrim"
        aria-label="Statement Detailansicht schliessen"
        @click="closeStatementDetail"
      />

      <div class="statement-view__grid">
        <StatementButton
          v-for="statement in filteredRecords"
          :key="statement.id"
          :statement="statement"
          @click="selectedStatement = statement"
        />
      </div>

      <div v-if="filteredRecords.length === 0" class="statement-view__empty">
        <strong>Keine Statements gefunden</strong>
        <span>Filter zurücksetzen oder Suchbegriff ändern.</span>
      </div>
    </section>

    <section class="statement-filter-overlay" aria-label="Statement Filter">
      <section class="statement-filters">
        <div class="statement-search-filter">
          <small>Search</small>
          <input
            :value="filters.query"
            type="search"
            placeholder="Autor, Kontext oder Statement"
            @input="statementStore.setQuery(($event.target as HTMLInputElement).value)"
          />
        </div>

        <FilterButtonContainer
          title="Mobilization Pattern"
          :labels="patternFilterLabels"
          @select="togglePatternLabelByKey"
        />
      </section>
    </section>

    <Teleport to="body">
      <Transition name="statement-detail-overlay">
        <StatementDetailView
          v-if="selectedStatement"
          :author="selectedAuthor"
          :statement="selectedStatement"
          @close="closeStatementDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/StatementView.css';
</style>
