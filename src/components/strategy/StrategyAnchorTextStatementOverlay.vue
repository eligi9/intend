<script setup lang="ts">
import { computed } from 'vue'
import type { PatternLabelKey, IntentRecord } from '../../types/intentData'
import { getDisplayLabel } from '../../utils/statementHighlights'
import StatementCard from '../common/StatementCard.vue'
import TopOverlay from '../common/TopOverlay.vue'

const props = defineProps<{
  anchorText?: string
  anchorTexts?: string[]
  highlightColor: string
  label: PatternLabelKey
  statement: IntentRecord
}>()

const anchorTexts = computed(() =>
  props.anchorTexts?.length ? props.anchorTexts : props.anchorText ? [props.anchorText] : [],
)

const explanation = computed(() => {
  const value = props.statement[`${props.label}_bj` as keyof IntentRecord]
  return typeof value === 'string' && value.length > 0 ? value : null
})

const explanationBackground = computed(
  () => `color-mix(in srgb, ${props.highlightColor} 72%, var(--app-background))`,
)

</script>

<template>
  <aside
    class="strategy-anchor-text-overlay"
    aria-label="Selected statement"
  >
    <TopOverlay
      :background="explanationBackground"
      heading-color="var(--text-white)"
      min-height="33vh"
      :text="explanation ?? ''"
      text-color="var(--text-white)"
      :title="`Why ${getDisplayLabel(props.label)}?`"
      :visible="explanation !== null"
    />

    <div class="strategy-anchor-text-overlay__body">
      <StatementCard
        class="strategy-anchor-text-overlay__card"
        :record="statement"
        :anchor-color="highlightColor"
        :anchor-texts="anchorTexts"
        :show-context-button="false"
      />
    </div>
  </aside>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyAnchorTextStatementOverlay.css';
</style>
