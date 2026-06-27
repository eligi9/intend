<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { IntentRecord } from '../../types/intentData'
import { intentSubLabelDescriptions } from '../../types/intentTaxonomy'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'
import { useStatementStore } from '../../stores/statementStore'
import StrategyAnchorTextScroller from './StrategyAnchorTextScroller.vue'
import StrategyAnchorTextStatementOverlay from './StrategyAnchorTextStatementOverlay.vue'

interface SelectedAnchorStatement {
  statement: IntentRecord
  text: string
}

const props = defineProps<{
  segment: StrategyIcicleSegment | null
}>()

const emit = defineEmits<{
  close: []
}>()

const selectedAnchorStatement = ref<SelectedAnchorStatement | null>(null)
const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)

const description = computed(() => {
  const segment = props.segment
  if (!segment) return ''

  return (
    intentSubLabelDescriptions[segment.id] ??
    `${segment.label} describes statements where this pattern appears inside ${segment.parent?.label ?? 'this pattern'}.`
  )
})

const statements = computed(() => {
  const segment = props.segment
  if (!segment) return []

  return records.value.filter((record) => record[segment.id] === 'yes')
})

watch(
  () => props.segment?.id,
  () => {
    selectedAnchorStatement.value = null
  },
)

function showAnchorStatement(anchor: SelectedAnchorStatement) {
  selectedAnchorStatement.value = anchor
}

function closeAnchorStatementOverlay() {
  selectedAnchorStatement.value = null
}
</script>

<template>
  <Transition name="strategy-sub-label-overlay">
    <aside
      v-if="segment"
      class="strategy-sub-label-overlay"
      :style="{ '--strategy-sub-label-overlay-color': segment.color }"
      aria-label="Sublabel details"
    >
      <div class="strategy-sub-label-overlay__columns">
        <section class="strategy-sub-label-overlay__copy">
          <p>{{ description }}</p>
        </section>

        <header class="strategy-sub-label-overlay__header">
          <h3>{{ segment.label }}</h3>
          <button
            type="button"
            class="strategy-sub-label-overlay__close"
            aria-label="Close sublabel overlay"
            @click="emit('close')"
          >
            ←
          </button>
        </header>
      </div>

      <section class="strategy-sub-label-overlay__anchors" aria-label="Anchor texts">
        <StrategyAnchorTextScroller
          :highlight-color="segment.color"
          :label="segment.id"
          :statements="statements"
          @anchor-press-end="closeAnchorStatementOverlay"
          @anchor-press-start="showAnchorStatement"
        />
      </section>
    </aside>
  </Transition>

  <StrategyAnchorTextStatementOverlay
    v-if="segment && selectedAnchorStatement"
    :anchor-text="selectedAnchorStatement.text"
    :highlight-color="segment.color"
    :label="segment.id"
    :statement="selectedAnchorStatement.statement"
    @close="closeAnchorStatementOverlay"
  />
</template>

<style scoped>
@import '../../css/components/strategy/StrategySubLabelOverlay.css';
</style>
