<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFloatingPlacement } from '../../composables/useFloatingPlacement'
import type { AuthorInstance } from '../../types/authorData'
import { taxonomyButtonColors } from '../../utils/intentLabels'

const props = defineProps<{
  author: AuthorInstance
}>()

const tooltipRoot = ref<HTMLElement | null>(null)
const { placement, updatePlacement } = useFloatingPlacement(tooltipRoot)

const ageLabel = computed(() => (props.author.age === null ? 'unknown' : props.author.age))
const genderLabel = computed(() => {
  if (props.author.gender === 'female') return 'female'
  if (props.author.gender === 'male') return 'male'
  return 'unknown'
})
const strategyBadges = computed(() =>
  props.author.usedTopLevelStrategies.map((strategy) => ({
    ...strategy,
    color: taxonomyButtonColors[strategy.id] ?? '#858b94',
  })),
)
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
      <span class="author-tooltip__heading">
        <strong class="author-tooltip__name">{{ author.name }}</strong>
        <span class="author-tooltip__position">{{ author.position ?? 'Position unbekannt' }}</span>
      </span>

      <span class="author-tooltip__facts">
        <span class="author-tooltip__fact-labels">
          <span>age:</span>
          <span>sex:</span>
          <span>partie:</span>
        </span>
        <span class="author-tooltip__fact-values">
          <span>{{ ageLabel }}</span>
          <span>{{ genderLabel }}</span>
          <span>{{ author.party ?? 'unknown' }}</span>
        </span>
      </span>

      <span v-if="strategyBadges.length > 0" class="author-tooltip__strategies">
        <span
          v-for="strategy in strategyBadges"
          :key="strategy.id"
          class="author-tooltip__badge"
          :style="{ '--author-tooltip-badge-color': strategy.color }"
        >
          {{ strategy.label }}
        </span>
      </span>

      <span v-else class="author-tooltip__strategies author-tooltip__strategies--empty">
        Keine Strategie
      </span>
    </span>
  </span>
</template>

<style scoped>
@import './AuthorTooltip.css';
</style>
