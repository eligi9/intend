<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AuthorTimelineP5 from '../../components/author-timeline/AuthorTimelineP5.vue'
import AuthorPortrait from '../../components/author-portrait/AuthorPortrait.vue'
import FilterButton from '../../components/filter-button/FilterButton.vue'
import StrategyBadge from '../../components/strategy-badge/StrategyBadge.vue'
import { useAuthorStore } from '../../stores/authorStore'
import type { IntentLabelKey } from '../../types/intentData'
import { toggleArrayItem } from '../../utils/arrays'
import { taxonomyButtonColors } from '../../utils/intentLabels'

const props = defineProps<{
  authorId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)
const selectedTimelineLabels = ref<IntentLabelKey[]>([])

const author = computed(
  () => authorInstances.value.find((authorInstance) => authorInstance.id === props.authorId) ?? null,
)
const strategyBadges = computed(() =>
  author.value
    ? author.value.usedTopLevelStrategies.map((strategy) => ({
        ...strategy,
        color: taxonomyButtonColors[strategy.id] ?? '#858b94',
      }))
    : [],
)
const ageLabel = computed(() => (author.value?.age === null ? 'unknown' : author.value?.age ?? 'unknown'))
const sexLabel = computed(() => {
  if (author.value?.gender === 'female') return 'female'
  if (author.value?.gender === 'male') return 'male'
  return 'unknown'
})

function toggleTimelineLabel(label: IntentLabelKey) {
  selectedTimelineLabels.value = toggleArrayItem(selectedTimelineLabels.value, label)
}
</script>

<template>
  <section class="author-detail-view">
    <button
      type="button"
      class="author-detail-view__close"
      aria-label="Autor Detailansicht schliessen"
      @click="emit('close')"
    >
      X
    </button>

    <article v-if="author" class="author-detail">
      <header class="author-detail__hero">
        <div class="author-detail__intro">
          <h2>{{ author.name }}</h2>
          <p>{{ author.position ?? 'Position unbekannt' }}</p>
        </div>

        <AuthorPortrait :author="author" :size="168" />
      </header>

      <section class="author-detail__timeline-filters" aria-label="Timeline Strategie Filter">
        <FilterButton
          v-for="strategy in strategyBadges"
          :key="strategy.id"
          :label="strategy.label"
          :color="strategy.color"
          :active="selectedTimelineLabels.includes(strategy.labelKey)"
          @click="toggleTimelineLabel(strategy.labelKey)"
        />
      </section>

      <section class="author-detail__timeline" aria-label="Interaktive Timeline">
        <AuthorTimelineP5
          :statements="author.statements"
          :selected-labels="selectedTimelineLabels"
        />
      </section>

      <section class="author-detail__facts" aria-label="Autor Informationen">
        <span>Age: {{ ageLabel }}</span>
        <span>sex: {{ sexLabel }}</span>
        <span>partie: {{ author.party ?? 'unknown' }}</span>
        <span>{{ author.statementCount }} Statements</span>
      </section>

      <section class="author-detail__strategies" aria-label="Verwendete Strategien">
        <StrategyBadge
          v-for="strategy in strategyBadges"
          :key="strategy.id"
          :label="strategy.label"
          :color="strategy.color"
          :count="strategy.statementCount"
          class="author-detail__badge"
        />

        <span v-if="strategyBadges.length === 0" class="author-detail__empty">
          Keine Strategie
        </span>
      </section>

      <section class="author-detail__statements" aria-label="Statements">
        <article v-for="statement in author.statements" :key="statement.id">
          <small>{{ statement.date }} · {{ statement.sector }}</small>
          <p>{{ statement.statement }}</p>
        </article>
      </section>
    </article>

    <div v-else class="author-detail-view__empty">
      <strong>Autor nicht gefunden</strong>
      <button type="button" @click="emit('close')">Schliessen</button>
    </div>
  </section>
</template>

<style scoped>
@import './AuthorDetailView.css';
</style>
