<script setup lang="ts">
import { computed } from 'vue'
import type { IntentRecord } from '../../types/intentData'
import StatementRepresentation from './StatementRepresentation.vue'
import StatementTooltip from './StatementTooltip.vue'

const props = defineProps<{
  statement: IntentRecord
}>()

const measureAnchors = computed(() => props.statement.measures ?? [])

const ariaLabel = computed(() => {
  const measures = measureAnchors.value.length
    ? ` Konkrete Measures: ${measureAnchors.value.join(', ')}.`
    : ''

  return `${props.statement.author}, ${props.statement.date}: ${props.statement.statement}.${measures}`
})
</script>

<template>
  <StatementTooltip
    class="statement-button-tooltip"
    :focusable="false"
    :record="statement"
  >
    <button
      class="statement-button"
      type="button"
      :aria-label="ariaLabel"
    >
      <StatementRepresentation :statement="statement" />
    </button>

  </StatementTooltip>
</template>

<style scoped>
@import '../../css/components/statement/StatementButton.css';
</style>
