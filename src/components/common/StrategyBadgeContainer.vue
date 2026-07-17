<script setup lang="ts">
import type { PatternLabelKey } from '../../types/intentData'
import { intentLabelNames } from '../../utils/intentLabels'
import StrategyButton from './StrategyButton.vue'

defineProps<{
  badges: readonly {
    color: string
    label: PatternLabelKey
  }[]
  hoveredLabel: PatternLabelKey | null
}>()

const emit = defineEmits<{
  'update:hoveredLabel': [label: PatternLabelKey | null]
}>()

function setHoveredLabel(label: PatternLabelKey | null) {
  emit('update:hoveredLabel', label)
}
</script>

<template>
  <span
    class="strategy-badge-container"
    aria-label="Active patterns"
    @click.stop
  >
    <StrategyButton
      v-for="badge in badges"
      :key="badge.label"
      :color="badge.color"
      interaction-type="hover"
      :label="intentLabelNames[badge.label]"
      @interaction-change="setHoveredLabel($event ? badge.label : null)"
    />
  </span>
</template>

<style scoped>
@import '../../css/components/common/StrategyBadgeContainer.css';
</style>
