<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import { intentLabelKeys } from '../../stores/statementStore'
import { getActiveLabels, getVisibleSubLabels, subLabelColors } from '../../utils/intentLabels'
import {
  collectAnchorHighlights,
  getDisplayLabel,
  splitStatementText,
} from '../../utils/statementHighlights'
import ReadStrategyBadge from '../read-strategy-badge/ReadStrategyBadge.vue'

interface StrategyBadge {
  label: IntentLabelKey
  color: string
}

const props = defineProps<{
  record: IntentRecord
  showHeading?: boolean
  compactHeading?: boolean
}>()

const hoveredLabel = ref<IntentLabelKey | null>(null)
const visibleLabels = computed(() => getVisibleSubLabels(getActiveLabels(props.record, intentLabelKeys)))
const strategyBadges = computed<StrategyBadge[]>(() =>
  visibleLabels.value.map((label) => ({
    label,
    color: subLabelColors.get(label) ?? '#858b94',
  })),
)
const anchorHighlights = computed(() =>
  hoveredLabel.value ? collectAnchorHighlights(props.record, hoveredLabel.value) : [],
)
const hoveredBadge = computed(
  () => strategyBadges.value.find((badge) => badge.label === hoveredLabel.value) ?? null,
)
const hoveredExplanation = computed(() => {
  if (!hoveredLabel.value) return null

  const explanation = props.record[`${hoveredLabel.value}_bj` as keyof IntentRecord]

  return typeof explanation === 'string' && explanation.length > 0 ? explanation : null
})
const statementSegments = computed(() => splitStatementText(props.record.statement, anchorHighlights.value))
</script>

<template>
  <article class="statement-card" :class="{ 'statement-card--focused': hoveredLabel }">
    <Transition name="statement-card-explanation">
      <aside
        v-if="hoveredBadge && hoveredExplanation"
        class="statement-card__explanation"
        :style="{ '--statement-card-explanation-color': hoveredBadge.color }"
        aria-live="polite"
      >
        <div class="statement-card__explanation-inner">
          <h3>Why {{ getDisplayLabel(hoveredBadge.label) }}?</h3>
          <p>{{ hoveredExplanation }}</p>
        </div>
      </aside>
    </Transition>

    <div class="statement-card__contents">
      <span v-if="showHeading !== false" class="statement-card__heading">
        <strong>{{ record.author }}</strong>
        <span class="statement-card__meta">{{ record.sector }} · {{ record.date }}</span>

        <span class="statement-card__position">{{ record.position }}</span>
      </span>
      <span v-else-if="compactHeading" class="statement-card__compact-heading">
        {{ record.date }}
      </span>

      <span class="statement-card__quote">
        <span
          v-for="(segment, index) in statementSegments"
          :key="`${segment.text}-${index}`"
          :class="{
            'statement-card__quote-part': true,
            'statement-card__quote-muted': segment.muted,
            'statement-card__quote-highlight': segment.color,
          }"
          :style="{ '--statement-card-highlight-color': segment.color ?? '#858b94' }"
        >
          {{ segment.text }}
        </span>
      </span>

      <span v-if="record.context" class="statement-card__context">{{ record.context }}</span>
    </div>

    <span
      v-if="strategyBadges?.length"
      class="statement-card__badges"
      aria-label="Aktive Strategien"
    >
      <span
        v-for="badge in strategyBadges"
        :key="badge.label"
        class="statement-card__badge-target"
        tabindex="0"
        @mouseenter="hoveredLabel = badge.label"
        @mouseleave="hoveredLabel = null"
        @focusin="hoveredLabel = badge.label"
        @focusout="hoveredLabel = null"
      >
        <ReadStrategyBadge
          :label="badge.label"
          :color="badge.color"
        />
      </span>
    </span>
  </article>
</template>

<style scoped>
@import './StatementCard.css';
</style>
