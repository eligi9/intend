<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  maxValue: number
  scaleLabel: string
  stepSize: number
}>()

const gridLines = computed(() => {
  const lineCount = Math.round((props.maxValue * 2) / props.stepSize) + 1

  return Array.from({ length: lineCount }, (_, index) => {
    const value = -props.maxValue + index * props.stepSize
    const labelValue = Math.abs(value)

    return {
      id: value,
      label: labelValue === 0 || labelValue === props.maxValue ? '' : `${labelValue}`,
      xPercent: ((value + props.maxValue) / (props.maxValue * 2)) * 100,
    }
  })
})
</script>

<template>
  <div class="mirrored-line-grid" aria-hidden="true">
    <div
      v-for="line in gridLines"
      :key="line.id"
      class="mirrored-line-grid__line"
      :class="{
        'mirrored-line-grid__line--center': line.id === 0,
      }"
      :style="{ '--line-x': `${line.xPercent}%` }"
    >
      <span v-if="line.label" class="mirrored-line-grid__value">
        {{ line.label }}
      </span>
    </div>

    <span class="mirrored-line-grid__label">{{ props.scaleLabel }}</span>
  </div>
</template>

<style scoped>
@import '../../css/components/strategy/MirroredLineGrid.css';
</style>
