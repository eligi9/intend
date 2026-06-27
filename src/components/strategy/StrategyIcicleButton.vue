<script setup lang="ts">
import { computed } from 'vue'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'
import { getStrategyIcicleSegmentState } from '../../utils/strategyIcicle'

const hoveredSegment = defineModel<StrategyIcicleSegment | null>('hoveredSegment', {
  required: true,
})

const props = defineProps<{
  activeSegment: StrategyIcicleSegment | null
  align: 'left' | 'right'
  label?: string
  segment: StrategyIcicleSegment
  selected: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

const segmentState = computed(() =>
  getStrategyIcicleSegmentState(props.segment, props.activeSegment),
)

function setHoveredSegment() {
  hoveredSegment.value = props.segment
}

function clearHoveredSegment() {
  if (hoveredSegment.value?.id === props.segment.id) {
    hoveredSegment.value = null
  }
}
</script>

<template>
  <button
    type="button"
    class="strategy-icicle-button"
    :class="[
      `strategy-icicle-button--${align}`,
      `strategy-icicle-button--${segmentState}`,
      { 'strategy-icicle-button--selected': selected },
    ]"
    :style="{
      '--strategy-icicle-button-color': segment.color,
      '--strategy-icicle-button-width': `${segment.widthPercent}%`,
    }"
    @blur="clearHoveredSegment"
    @click="emit('select')"
    @focus="setHoveredSegment"
    @mouseenter="setHoveredSegment"
    @mouseleave="clearHoveredSegment"
  >
    <span v-if="label">{{ label }}</span>
  </button>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyIcicleButton.css';
</style>
