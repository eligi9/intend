<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AuthorTimelineP5 from '../../components/author-timeline/AuthorTimelineP5.vue'
import AuthorPortrait from '../../components/author-portrait/AuthorPortrait.vue'
import StrategyBadge from '../../components/strategy-badge/StrategyBadge.vue'
import { useAuthorStore } from '../../stores/authorStore'
import { taxonomyButtonColors } from '../../utils/intentLabels'

const props = defineProps<{
  authorId: string
}>()

const emit = defineEmits<{
  back: []
}>()

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)

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
</script>

<template>
  <section class="author-detail-view">
    <button type="button" class="author-detail-view__back" @click="emit('back')">
      Zurueck
    </button>

    <article v-if="author" class="author-detail">
      <header class="author-detail__hero">
        <AuthorPortrait :author="author" :size="168" />

        <div class="author-detail__intro">
          <h2>{{ author.name }}</h2>
          <p>{{ author.position ?? 'Position unbekannt' }}</p>
        </div>
      </header>

      <section class="author-detail__timeline" aria-label="Interaktive Timeline">
        <AuthorTimelineP5 :statements="author.statements" />
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
      <button type="button" @click="emit('back')">Zurueck zur Uebersicht</button>
    </div>
  </section>
</template>

<style scoped>
@import './AuthorDetailView.css';
</style>
