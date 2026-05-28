<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import { intentLabelKeys } from '../../stores/statementStore'
import { getActiveLabels, getVisibleSubLabels, splitAnchors, subLabelColors } from '../../utils/intentLabels'
import ReadStrategyBadge from '../read-strategy-badge/ReadStrategyBadge.vue'

interface StrategyBadge {
  label: IntentLabelKey
  color: string
}

interface StatementSegment {
  text: string
  muted: boolean
  color: string | null
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

function splitBracketedText(text: string) {
  const segments: Omit<StatementSegment, 'color'>[] = []
  const bracketPattern = /\[[^\]]*\]/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = bracketPattern.exec(text))) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), muted: false })
    }

    segments.push({ text: match[0], muted: true })
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), muted: false })
  }

  return segments
}

function splitStatementText(text: string, anchors: AnchorHighlight[]) {
  const baseSegments = splitBracketedText(text)
  const normalizedAnchors = anchors
    .filter((anchor) => anchor.text.length > 0)
    .sort((first, second) => second.text.length - first.text.length)

  if (!normalizedAnchors.length) {
    return baseSegments.map((segment) => ({ ...segment, color: null }))
  }

  return baseSegments.flatMap((segment) => splitSegmentByAnchors(segment, normalizedAnchors))
}

function splitSegmentByAnchors(
  segment: Omit<StatementSegment, 'color'>,
  anchors: AnchorHighlight[],
): StatementSegment[] {
  const parts: StatementSegment[] = []
  let cursor = 0
  const lowerText = segment.text.toLowerCase()

  while (cursor < segment.text.length) {
    const match = findNextAnchorMatch(lowerText, anchors, cursor)

    if (!match) {
      parts.push({
        text: segment.text.slice(cursor),
        muted: segment.muted,
        color: null,
      })
      break
    }

    if (match.index > cursor) {
      parts.push({
        text: segment.text.slice(cursor, match.index),
        muted: segment.muted,
        color: null,
      })
    }

    parts.push({
      text: segment.text.slice(match.index, match.index + match.length),
      muted: segment.muted,
      color: match.color,
    })
    cursor = match.index + match.length
  }

  return parts
}

interface AnchorHighlight {
  text: string
  color: string
}

function collectAnchorHighlights(record: IntentRecord, label: IntentLabelKey): AnchorHighlight[] {
  const color = subLabelColors.get(label) ?? '#858b94'
  const anchors = splitAnchors(record[`${label}_anchor` as keyof IntentRecord])

  return anchors.map((anchor) => ({ text: anchor.trim(), color }))
}

function findNextAnchorMatch(text: string, anchors: AnchorHighlight[], cursor: number) {
  return anchors.reduce<{ index: number; length: number; color: string } | null>((nearest, anchor) => {
    const index = text.indexOf(anchor.text.toLowerCase(), cursor)
    if (index === -1) return nearest
    if (!nearest || index < nearest.index) {
      return { index, length: anchor.text.length, color: anchor.color }
    }
    return nearest
  }, null)
}

function getDisplayLabel(label: IntentLabelKey) {
  return label
    .split('_')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}
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
