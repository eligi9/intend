<script setup lang="ts">
withDefaults(
  defineProps<{
    cellSize?: string
    columns?: number
    paddingBlockStartCells?: number
    paddingInlineCells?: number
    rows?: number
    showLines?: boolean
  }>(),
  {
    cellSize: 'calc(100vw / 24)',
    paddingBlockStartCells: 0,
    paddingInlineCells: 0,
    showLines: true,
  },
)
</script>

<template>
  <section
    class="view-grid"
    :class="{ 'view-grid--with-lines': showLines }"
    :style="{
      '--view-grid-cell-size': cellSize,
      '--view-grid-columns': columns,
      '--view-grid-padding-block-start-cells': paddingBlockStartCells,
      '--view-grid-padding-inline-cells': paddingInlineCells,
      '--view-grid-rows': rows,
    }"
  >
    <slot />
  </section>
</template>

<style scoped>
@import '../../css/components/grid/ViewGrid.css';
</style>
