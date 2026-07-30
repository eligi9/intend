<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  columns: number
  cellSizePx?: number
  labels: readonly number[]
  offsetCells?: number
  paddingInlineCells: number
  scaleLabel?: string
}>()

const positionedLabels = computed(() =>
  props.labels.map((value) => ({
    value,
    x: props.cellSizePx === undefined
      ? `${((props.paddingInlineCells + (props.offsetCells ?? 0) + value - 0.5) / props.columns) * 100}%`
      : `${(props.paddingInlineCells + (props.offsetCells ?? 0) + value - 0.5) * props.cellSizePx}px`,
  })),
)
</script>

<template>
  <div class="grid-column-labels" aria-hidden="true">
    <span
      v-for="label in positionedLabels"
      :key="label.value"
      :style="{ '--grid-column-label-x': label.x }"
    >
      {{ label.value }}
    </span>

    <span
      v-if="props.scaleLabel"
      class="grid-column-labels__scale-label"
    >
      {{ props.scaleLabel }}
    </span>
  </div>
</template>

<style scoped>
@import '../../css/components/grid/GridColumnLabels.css';
</style>
