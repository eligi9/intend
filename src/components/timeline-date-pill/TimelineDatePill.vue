<script setup lang="ts">
const props = defineProps<{
  label: string
  xRatio: number
  yRatio: number
}>()
</script>

<template>
  <span
    class="timeline-date-pill"
    :style="{
      '--timeline-date-pill-x': `${props.xRatio * 100}%`,
      '--timeline-date-pill-y': `${props.yRatio * 100}%`,
    }"
  >
    {{ props.label }}
  </span>
</template>

<style scoped>
@import './TimelineDatePill.css';
</style>
