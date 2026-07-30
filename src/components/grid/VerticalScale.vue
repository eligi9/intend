<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  steps: number
}>()

const ticks = computed(() =>
  Array.from({ length: props.steps + 1 }, (_, index) => {
    const value = (index / props.steps) * 100

    return {
      id: value,
      label: `${Math.round(value)}%`,
      yPercent: value,
    }
  }),
)
</script>

<template>
  <div class="vertical-scale" aria-hidden="true">
    <span class="vertical-scale__title">{{ label }}</span>

    <span
      v-for="tick in ticks"
      :key="tick.id"
      class="vertical-scale__tick"
      :style="{ top: `${tick.yPercent}%` }"
    >
      <span class="vertical-scale__tick-label">
        {{ tick.label }}
      </span>
    </span>
  </div>
</template>

<style scoped>
@import '../../css/components/grid/VerticalScale.css';
</style>
