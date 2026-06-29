<script setup lang="ts">
import { computed } from 'vue'
import type { IntentLabelKey } from '../../types/intentData'
import { intentLabelNames } from '../../utils/intentLabels'

const props = defineProps<{
  label: IntentLabelKey
  color: string
}>()

const displayLabel = computed(() => intentLabelNames[props.label])
const displayLabelLines = computed(() => {
  if (displayLabel.value === 'External Criticism Rejection') {
    return ['External Criticism', 'Rejection']
  }

  if (displayLabel.value.includes(' / ')) {
    const [firstLine, secondLine] = displayLabel.value.split(' / ')

    return [`${firstLine} /`, secondLine]
  }

  return [displayLabel.value]
})
</script>

<template>
  <span
    class="read-strategy-badge"
    :style="{ '--read-strategy-badge-color': color }"
  >
    <span
      v-for="line in displayLabelLines"
      :key="line"
      class="read-strategy-badge__line"
    >
      {{ line }}
    </span>
  </span>
</template>

<style scoped>
@import '../../css/components/common/ReadStrategyBadge.css';
</style>
