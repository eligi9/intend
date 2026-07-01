<script setup lang="ts">
import { computed } from 'vue'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { strategyColors } from '../../utils/intentLabels'

const props = defineProps<{
  statement: IntentRecord
}>()

const mainPatternOrder: PatternLabelKey[] = [
  'enemy_image',
  'rhetorical_foreclosure',
  'just_cause',
  'individual_needs',
]

const mainPatterns = computed(() => {
  return mainPatternOrder.flatMap((labelKey) => {
    const group = intentTaxonomy.find((item) => item.parentLabel === labelKey)
    const active =
      props.statement[labelKey] === 'yes' ||
      Boolean(group?.childLabels.some((label) => props.statement[label] === 'yes'))

    return active
      ? [{
          color: strategyColors[labelKey],
          labelKey,
        }]
      : []
  })
})

const ringSize = (index: number) => `${42 + (index + 1) * 14}%`

const ariaLabel = computed(
  () => `${props.statement.author}, ${props.statement.date}: ${props.statement.statement}`,
)
</script>

<template>
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
</template>

<style scoped>
@import '../../css/components/statement/StatementButton.css';
</style>
