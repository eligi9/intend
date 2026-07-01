<script setup lang="ts">
import type { PatternLabelKey } from '../../types/intentData'
import ReadStrategyBadge from './ReadStrategyBadge.vue'

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
    <span
      v-for="badge in badges"
      :key="badge.label"
      class="strategy-badge-container__target"
      tabindex="0"
      @mouseenter="setHoveredLabel(badge.label)"
      @mouseleave="setHoveredLabel(null)"
      @focusin="setHoveredLabel(badge.label)"
      @focusout="setHoveredLabel(null)"
      @click.stop
    >
      <ReadStrategyBadge
        :label="badge.label"
        :color="badge.color"
      />
    </span>
  </span>
</template>

<style scoped>
@import '../../css/components/common/StrategyBadgeContainer.css';
</style>
