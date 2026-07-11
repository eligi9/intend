<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import { strategyColors } from '../../utils/intentLabels'
import Tooltip from '../common/Tooltip.vue'
import StrategyBadge from '../strategy/StrategyBadge.vue'

const props = defineProps<{
  author: AuthorInstance
}>()

const strategyBadges = computed(() =>
  props.author.usedTopLevelStrategies.map((strategy) => ({
    ...strategy,
    color: strategyColors[strategy.labelKey] ?? 'var(--color-neutral)',
  })),
)
</script>

<template>
  <Tooltip class="author-tooltip">
    <slot />

    <template #panel>
      <span class="author-tooltip__heading">
        <strong class="author-tooltip__name">{{ author.name }}</strong>
        <span class="author-tooltip__position">{{ author.position ?? 'Position unbekannt' }}</span>
      </span>

      <span
        v-if="strategyBadges.length > 0"
        class="author-tooltip__strategies"
        :class="{ 'author-tooltip__strategies--single': strategyBadges.length === 1 }"
      >
        <StrategyBadge
          v-for="strategy in strategyBadges"
          :key="strategy.labelKey"
          :label="strategy.label"
          :color="strategy.color"
          :count="strategy.statementCount"
          class="author-tooltip__badge"
        />
      </span>

      <span v-else class="author-tooltip__strategies author-tooltip__strategies--empty">
        No pattern
      </span>
    </template>
  </Tooltip>
</template>

<style scoped>
@import '../../css/components/author/AuthorTooltip.css';
</style>
