<script setup lang="ts">
import { computed } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import { getDisplayLabel, splitStatementText } from '../../utils/statementHighlights'

const props = defineProps<{
  anchorText?: string
  anchorTexts?: string[]
  highlightColor: string
  label: IntentLabelKey
  statement: IntentRecord
}>()

const anchorTexts = computed(() =>
  props.anchorTexts?.length ? props.anchorTexts : props.anchorText ? [props.anchorText] : [],
)

const statementSegments = computed(() =>
  splitStatementText(
    props.statement.statement,
    anchorTexts.value.map((text) => ({
      color: props.highlightColor,
      text,
    })),
  ),
)

const explanation = computed(() => {
  const value = props.statement[`${props.label}_bj` as keyof IntentRecord]
  return typeof value === 'string' && value.length > 0 ? value : null
})

const statementMeta = computed(() =>
  [
    props.statement.author,
    props.statement.date,
    props.statement.source,
  ].filter((item): item is string => Boolean(item)),
)
</script>

<template>
  <aside
    class="strategy-anchor-text-overlay"
    :style="{ '--strategy-anchor-text-overlay-highlight': props.highlightColor }"
    aria-label="Selected statement"
  >
    <Transition name="strategy-anchor-text-overlay-explanation">
      <section
        v-if="explanation"
        class="strategy-anchor-text-overlay__explanation"
      >
        <div class="strategy-anchor-text-overlay__explanation-inner">
          <h3>Why {{ getDisplayLabel(props.label) }}?</h3>
          <p>{{ explanation }}</p>
        </div>
      </section>
    </Transition>

    <div class="strategy-anchor-text-overlay__body">
      <p class="strategy-anchor-text-overlay__statement">
        <span
          v-for="(segment, index) in statementSegments"
          :key="`${segment.text}-${index}`"
          :class="{
            'strategy-anchor-text-overlay__part': true,
            'strategy-anchor-text-overlay__part--muted': segment.muted,
            'strategy-anchor-text-overlay__part--highlight': segment.color,
          }"
          :style="{
            backgroundColor: segment.color ?? undefined,
          }"
        >
          {{ segment.text }}
        </span>
      </p>

      <p
        v-if="statementMeta.length"
        class="strategy-anchor-text-overlay__meta"
      >
        <span
          v-for="(item, index) in statementMeta"
          :key="`${item}-${index}`"
        >
          {{ item }}
        </span>
      </p>
    </div>
  </aside>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyAnchorTextStatementOverlay.css';
</style>
