<script setup lang="ts">
import { computed } from 'vue'
import type { IntentLabelKey } from '../types/intentData'
import { intentLabelNames } from '../utils/intentLabels'

const props = defineProps<{
  label: IntentLabelKey
  color: string
}>()

const displayLabel = computed(() => intentLabelNames[props.label])
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
@import '../css/components/ReadStrategyBadge.css';
</style>
