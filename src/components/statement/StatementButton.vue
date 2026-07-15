<script setup lang="ts">
import { computed } from 'vue'
import type { IntentRecord } from '../../types/intentData'
import { strategyColors } from '../../utils/intentLabels'
import { getActiveMainLabels } from '../../utils/sort'
import Tooltip from '../common/Tooltip.vue'

const props = defineProps<{
  statement: IntentRecord
}>()

const mainPatterns = computed(() => {
  return getActiveMainLabels(props.statement).map((labelKey) => ({
    color: strategyColors[labelKey],
    labelKey,
  }))
})
const measureAnchors = computed(() => props.statement.measures ?? [])

const ringSize = (index: number) => {
  const ringStep = '(var(--statement-button-ring-stroke) + var(--statement-button-ring-gap))'
  const ringExpansion = Array.from({ length: (index + 1) * 2 }, () => ringStep).join(' + ')

  return `calc(var(--statement-button-core-size) + ${ringExpansion})`
}

const ariaLabel = computed(() => {
  const measures = measureAnchors.value.length
    ? ` Konkrete Measures: ${measureAnchors.value.join(', ')}.`
    : ''

  return `${props.statement.author}, ${props.statement.date}: ${props.statement.statement}.${measures}`
})
</script>

<template>
  <Tooltip
    class="statement-button-tooltip"
    :disabled="measureAnchors.length === 0"
    :focusable="false"
  >
    <button
      class="statement-button"
      type="button"
      :aria-label="ariaLabel"
    >
      <span class="statement-button__rings" aria-hidden="true">
        <span
          v-for="(pattern, index) in mainPatterns"
          :key="pattern.labelKey"
          class="statement-button__ring"
          :style="{ '--ring-color': pattern.color, '--ring-size': ringSize(index) }"
        />
      </span>

      <span class="statement-button__core" aria-hidden="true" />
    </button>

    <template #panel>
      <span class="statement-button__tooltip-content">
        <strong class="statement-button__tooltip-title">Measure examples</strong>

        <span class="statement-button__measure-labels">
          <span
            v-for="measure in measureAnchors"
            :key="measure"
            class="statement-button__measure-label"
          >
            »{{ measure }}«
          </span>
        </span>
      </span>
    </template>
  </Tooltip>
</template>

<style scoped>
@import '../../css/components/statement/StatementButton.css';
</style>
