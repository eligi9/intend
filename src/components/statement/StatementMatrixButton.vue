<script setup lang="ts">
import { computed } from 'vue'
import type { IntentRecord } from '../../types/intentData'
import { strategyColors } from '../../utils/intentLabels'
import { getActiveSubLabelCount, statementMainLabelOrder } from '../../utils/sort'

const props = defineProps<{
  statement: IntentRecord
}>()

const rowCount = 4

const columns = computed(() =>
  statementMainLabelOrder.map((labelKey) => ({
    activeCount: Math.min(getActiveSubLabelCount(props.statement, labelKey), rowCount),
    color: strategyColors[labelKey] ?? 'var(--color-neutral)',
    labelKey,
  })),
)

const ariaLabel = computed(
  () => `${props.statement.author}, ${props.statement.date}: ${props.statement.statement}`,
)
</script>

<template>
  <button
    class="statement-matrix-button"
    type="button"
    :aria-label="ariaLabel"
  >
    <span
      v-for="column in columns"
      :key="column.labelKey"
      class="statement-matrix-button__column"
      aria-hidden="true"
    >
      <span
        v-for="rowIndex in rowCount"
        :key="rowIndex"
        class="statement-matrix-button__cell"
        :class="{
          'statement-matrix-button__cell--active': rowIndex > rowCount - column.activeCount,
        }"
        :style="{ '--statement-matrix-color': column.color }"
      />
    </span>
  </button>
</template>

<style scoped>
@import '../../css/components/statement/StatementMatrixButton.css';
</style>
