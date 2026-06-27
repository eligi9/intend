<script setup lang="ts">
import { computed } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import { getDisplayLabel, splitStatementText } from '../../utils/statementHighlights'

const props = defineProps<{
  anchorText: string
  highlightColor: string
  label: IntentLabelKey
  statement: IntentRecord
}>()

const emit = defineEmits<{
  close: []
}>()

const statementSegments = computed(() =>
  splitStatementText(props.statement.statement, [
    {
      color: props.highlightColor,
      text: props.anchorText,
    },
  ]),
)

const explanation = computed(() => {
  const value = props.statement[`${props.label}_bj` as keyof IntentRecord]
  return typeof value === 'string' && value.length > 0 ? value : null
})
</script>

<template>
  <aside
    class="strategy-anchor-text-overlay"
    :style="{ '--strategy-anchor-text-overlay-highlight': props.highlightColor }"
    aria-label="Selected statement"
    @click="emit('close')"
  >
    <button
      type="button"
      class="strategy-anchor-text-overlay__close"
      aria-label="Close selected statement"
      @click.stop="emit('close')"
    >
      ×
    </button>

    <Transition name="strategy-anchor-text-overlay-explanation">
      <section
        v-if="explanation"
        class="strategy-anchor-text-overlay__explanation"
        @click.stop
      >
        <div class="strategy-anchor-text-overlay__explanation-inner">
          <h3>Why {{ getDisplayLabel(props.label) }}?</h3>
          <p>{{ explanation }}</p>
        </div>
      </section>
    </Transition>

    <p class="strategy-anchor-text-overlay__statement" @click.stop>
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
  </aside>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyAnchorTextStatementOverlay.css';
</style>
