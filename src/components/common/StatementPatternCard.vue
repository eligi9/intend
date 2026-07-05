<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import {
  getStatementPatternAnchors,
  getStatementPatternBadges,
  getStatementPatternBriefJustification,
} from '../../utils/statementPatterns'
import { getDisplayLabel } from '../../utils/statementHighlights'
import StatementCard from './StatementCard.vue'
import StrategyBadgeContainer from './StrategyBadgeContainer.vue'
import TopOverlay from './TopOverlay.vue'

const props = withDefaults(
  defineProps<{
    record: IntentRecord
    showContextButton?: boolean
  }>(),
  {
    showContextButton: true,
  },
)

const emit = defineEmits<{
  contextHoverChange: [visible: boolean]
  badgeHoverChange: [visible: boolean]
}>()

const hoveredLabel = ref<PatternLabelKey | null>(null)
const badges = computed(() => getStatementPatternBadges(props.record))
const hoveredBadge = computed(
  () => badges.value.find((badge) => badge.label === hoveredLabel.value) ?? null,
)
const hoveredAnchors = computed(() =>
  hoveredLabel.value ? getStatementPatternAnchors(props.record, hoveredLabel.value) : [],
)
const hoveredExplanation = computed(() =>
  hoveredLabel.value
    ? getStatementPatternBriefJustification(props.record, hoveredLabel.value)
    : null,
)
const explanationBackground = computed(() =>
  hoveredBadge.value ? hoveredBadge.value.color : undefined,
)

watch(hoveredLabel, (label) => {
  emit('badgeHoverChange', Boolean(label))
})
</script>

<template>
  <div
    class="statement-pattern-card"
    :class="{ 'statement-pattern-card--without-badges': badges.length === 0 }"
  >
    <TopOverlay
      :background="explanationBackground"
      heading-color="var(--text-white)"
      min-height="33vh"
      :text="hoveredExplanation ?? ''"
      text-color="var(--text-white)"
      :title="hoveredBadge ? `Why ${getDisplayLabel(hoveredBadge.label)}?` : ''"
      :visible="Boolean(hoveredBadge && hoveredExplanation)"
    />

    <StatementCard
      :anchor-color="hoveredBadge?.color"
      :anchor-texts="hoveredAnchors"
      :record="record"
      :show-context-button="showContextButton"
      @context-hover-change="emit('contextHoverChange', $event)"
    />

    <StrategyBadgeContainer
      v-if="badges.length > 0"
      v-model:hovered-label="hoveredLabel"
      :badges="badges"
    />
  </div>
</template>

<style scoped>
@import '../../css/components/common/StatementPatternCard.css';
</style>
