<script setup lang="ts">
import { computed } from 'vue'
import type { Statement } from '../../types/intentData'
import StatementRepresentation from '../representation/StatementRepresentation.vue'
import StatementTooltip from '../tooltips/StatementTooltip.vue'

const props = defineProps<{
  statement: Statement
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
@import '../../css/components/button/StatementButton.css';
</style>
