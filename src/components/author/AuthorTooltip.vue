<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import { getStatementPatternColor } from '../../utils/statementPatterns'
import Tooltip from '../common/Tooltip.vue'

const props = defineProps<{
  author: AuthorInstance
}>()

const mostUsedPatternColor = computed(() =>
  props.author.mostUsedPattern
    ? getStatementPatternColor(props.author.mostUsedPattern.labelKey)
    : 'var(--color-neutral)',
)
</script>

<template>
  <Tooltip class="author-tooltip">
    <slot />

    <template #panel>
      <span class="author-tooltip__content">
        <span class="author-tooltip__meta">
          <strong>{{ author.name }}</strong>
          <span>{{ author.position ?? 'Position unknown' }}</span>
        </span>

        <strong class="author-tooltip__title">Most Used Content Category</strong>

        <span v-if="author.mostUsedContentCategory" class="author-tooltip__labels">
          <span class="author-tooltip__label">
            {{ author.mostUsedContentCategory.label }}
            <small>({{ author.mostUsedContentCategory.statementCount }})</small>
          </span>
        </span>

        <span v-else class="author-tooltip__labels author-tooltip__labels--empty">
          No content category
        </span>

        <strong class="author-tooltip__title author-tooltip__title--section">
          Most Used Pattern
        </strong>

        <span v-if="author.mostUsedPattern" class="author-tooltip__labels">
          <span
            class="author-tooltip__label author-tooltip__label--pattern"
            :style="{ '--author-tooltip-label-color': mostUsedPatternColor }"
          >
            {{ author.mostUsedPattern.label }}
            <small>({{ author.mostUsedPattern.statementCount }})</small>
          </span>
        </span>

        <span v-else class="author-tooltip__labels author-tooltip__labels--empty">
          No pattern
        </span>
      </span>
    </template>
  </Tooltip>
</template>

<style scoped>
@import '../../css/components/author/AuthorTooltip.css';
</style>
