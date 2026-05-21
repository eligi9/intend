<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFloatingPlacement } from '../../composables/useFloatingPlacement'
import type { AuthorInstance } from '../../types/authorData'

const props = defineProps<{
  author: AuthorInstance
}>()

const tooltipRoot = ref<HTMLElement | null>(null)
const { placement, updatePlacement } = useFloatingPlacement(tooltipRoot)

const dateOfBirthLabel = computed(() => props.author.dateOfBirth ?? 'Unbekannt')
const genderLabel = computed(() => {
  if (props.author.gender === 'female') return 'weiblich'
  if (props.author.gender === 'male') return 'maennlich'
  return 'unbekannt'
})
const strategyLabel = computed(() => {
  if (props.author.usedTopLevelStrategies.length === 0) return 'Keine Strategie'

  return props.author.usedTopLevelStrategies.map((strategy) => strategy.label).join(', ')
})
</script>

<template>
  <span
    ref="tooltipRoot"
    class="author-tooltip"
    :class="`author-tooltip--${placement}`"
    tabindex="0"
    @mouseenter="updatePlacement"
    @focusin="updatePlacement"
  >
    <slot />

    <span class="author-tooltip__panel" role="tooltip">
      <strong class="author-tooltip__name">{{ author.name }}</strong>

      <span class="author-tooltip__position">{{ author.position ?? 'Position unbekannt' }}</span>

      <span class="author-tooltip__meta">
        <span>{{ author.sector ?? 'Sector unbekannt' }}</span>
        <span>{{ author.party ?? 'Partei unbekannt' }}</span>
      </span>

      <span class="author-tooltip__meta">
        <span>Geboren: {{ dateOfBirthLabel }}</span>
        <span>Geschlecht: {{ genderLabel }}</span>
      </span>

      <span class="author-tooltip__meta">
        <span>{{ author.statementCount }} Statements</span>
        <span>{{ author.usedTopLevelStrategyCount }}/{{ author.topLevelStrategyCount }} Strategien</span>
      </span>

      <span class="author-tooltip__strategies">{{ strategyLabel }}</span>
    </span>
  </span>
</template>

<style scoped>
@import './AuthorTooltip.css';
</style>
