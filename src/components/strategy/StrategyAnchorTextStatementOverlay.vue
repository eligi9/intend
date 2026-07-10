<script setup lang="ts">
import { computed } from 'vue'
import type { PatternLabelKey, IntentRecord } from '../../types/intentData'
import { getDisplayLabel } from '../../utils/statementHighlights'
import { getPatternAnnotation } from '../../utils/intentRecordPatterns'
import SideOverlay from '../common/SideOverlay.vue'
import StatementCard from '../common/StatementCard.vue'

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
  return getPatternAnnotation(props.statement, props.label)?.justification ?? null
})

const explanationBackground = computed(() => props.highlightColor)

</script>

<template>
  <aside
    class="strategy-anchor-text-overlay"
    :style="{ '--strategy-anchor-text-overlay-color': highlightColor }"
    aria-label="Selected statement"
    @click.stop
  >
    <SideOverlay
      :color="explanationBackground"
      side="left"
      :text="explanation ?? ''"
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
