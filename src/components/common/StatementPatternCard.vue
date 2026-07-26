<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import type { OverlaySide } from '../../types/overlay'
import {
  getStatementPatternAnchors,
  getStatementPatternBadges,
  getStatementPatternBriefJustification,
} from '../../utils/statementPatterns'
import { intentSubLabelDescriptions } from '../../utils/intentTaxonomy'
import { getDisplayLabel } from '../../utils/statementHighlights'
import SideOverlayPattern from './SideOverlayPattern.vue'
import StatementCard from './StatementCard.vue'
import StrategyBadgeContainer from './StrategyBadgeContainer.vue'
import StatementRepresentation from '../statement/StatementRepresentation.vue'

const props = withDefaults(
  defineProps<{
    record: IntentRecord
    overlaySide?: OverlaySide
    showAuthor?: boolean
    showContextButton?: boolean
    underlineDate?: boolean
  }>(),
  {
    overlaySide: 'left',
    showAuthor: false,
    showContextButton: true,
    underlineDate: true,
  },
)

const emit = defineEmits<{
  contextHoverChange: [visible: boolean]
  badgeHoverChange: [visible: boolean]
}>()

const hoveredLabel = ref<PatternLabelKey | null>(null)
const selectedLabel = ref<PatternLabelKey | null>(null)
const badges = computed(() => getStatementPatternBadges(props.record))
const activeLabel = computed(() => hoveredLabel.value)
const activeBadge = computed(
  () => badges.value.find((badge) => badge.label === activeLabel.value) ?? null,
)
const activeAnchors = computed(() =>
  activeLabel.value ? getStatementPatternAnchors(props.record, activeLabel.value) : [],
)
const activeExplanation = computed(() =>
  activeLabel.value
    ? getStatementPatternBriefJustification(props.record, activeLabel.value)
    : null,
)
const activeDefinition = computed(() =>
  activeLabel.value ? intentSubLabelDescriptions[activeLabel.value] ?? '' : '',
)
const definitionIsVisible = computed(
  () => selectedLabel.value !== null && selectedLabel.value === activeLabel.value,
)
const explanationBackground = computed(() =>
  activeBadge.value ? activeBadge.value.color : undefined,
)

watch(activeLabel, (label) => {
  if (!label) {
    selectedLabel.value = null
  }

  emit('badgeHoverChange', Boolean(label))
})

async function toggleSelectedLabel(label: PatternLabelKey) {
  if (selectedLabel.value === label) {
    selectedLabel.value = null
    return
  }

  if (hoveredLabel.value !== label) {
    hoveredLabel.value = label
  }

  await nextTick()

  if (hoveredLabel.value === label) {
    selectedLabel.value = label
  }
}

function closePatternOverlay() {
  hoveredLabel.value = null
  selectedLabel.value = null
}
</script>

<template>
  <div
    class="statement-pattern-card"
    :class="{ 'statement-pattern-card--without-badges': badges.length === 0 }"
  >
    <SideOverlayPattern
      :key="activeBadge?.label ?? 'no-pattern'"
      :color="explanationBackground"
      :definition="activeDefinition"
      :expanded="definitionIsVisible"
      label="Why?"
      :side="overlaySide"
      :text="activeExplanation ?? ''"
      :title="activeBadge ? getDisplayLabel(activeBadge.label) : ''"
      :visible="Boolean(activeBadge && activeExplanation)"
      @close="closePatternOverlay"
    />

    <StatementRepresentation
      class="statement-pattern-card__representation"
      size="large"
      :statement="record"
    />

    <StatementCard
      :anchor-color="activeBadge?.color"
      :anchor-texts="activeAnchors"
      :record="record"
      :overlay-side="overlaySide"
      :show-author="showAuthor"
      :show-context-button="showContextButton"
      :underline-date="underlineDate"
      @context-hover-change="emit('contextHoverChange', $event)"
    />

    <StrategyBadgeContainer
      v-if="badges.length > 0"
      v-model:hovered-label="hoveredLabel"
      :badges="badges"
      :selected-label="selectedLabel"
      @toggle-label="toggleSelectedLabel"
    />
  </div>
</template>

<style scoped>
@import '../../css/components/common/StatementPatternCard.css';
</style>
