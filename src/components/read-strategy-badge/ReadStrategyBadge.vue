<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  color: string
}>()

const displayLabel = computed(() =>
  props.label
    .split('_')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' '),
)
</script>

<template>
  <span
    class="read-strategy-badge"
    :style="{ '--read-strategy-badge-color': color }"
  >
    {{ displayLabel }}
  </span>
</template>

<style scoped>
@import './ReadStrategyBadge.css';
</style>
