<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import type { OverlaySide } from '../../types/overlay'
import {
  getStatementPatternAnchors,
  getStatementPatternBadges,
  getStatementPatternBriefJustification,
} from '../../utils/statementPatterns'
import { getDisplayLabel } from '../../utils/statementHighlights'
import SideOverlay from './SideOverlay.vue'
import StatementCard from './StatementCard.vue'
import StrategyBadgeContainer from './StrategyBadgeContainer.vue'
import StatementRepresentation from '../statement/StatementRepresentation.vue'

const props = withDefaults(
  defineProps<{
    record: IntentRecord
    overlaySide?: OverlaySide
    showAuthor?: boolean
    showContextButton?: boolean
  }>(),
  {
    overlaySide: 'left',
    showAuthor: false,
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
    <SideOverlay
      :color="explanationBackground"
      :side="overlaySide"
      :text="hoveredExplanation ?? ''"
      :title="hoveredBadge ? `Why ${getDisplayLabel(hoveredBadge.label)}?` : ''"
      :visible="Boolean(hoveredBadge && hoveredExplanation)"
      @close="hoveredLabel = null"
    />

    <StatementRepresentation
      class="statement-pattern-card__representation"
      size="large"
      :statement="record"
    />

    <StatementCard
      :anchor-color="hoveredBadge?.color"
      :anchor-texts="hoveredAnchors"
      :record="record"
      :overlay-side="overlaySide"
      :show-author="showAuthor"
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
