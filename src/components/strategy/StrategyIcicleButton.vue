<script setup lang="ts">
import { computed } from 'vue'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'
import { getStrategyIcicleSegmentState } from '../../utils/strategyIcicle'

const props = defineProps<{
  activeSegment: StrategyIcicleSegment | null
  align: 'left' | 'right'
  accessibilityLabel: string
  label?: string
  segment: StrategyIcicleSegment
  selected: boolean
}>()

const emit = defineEmits<{
  hover: [segment: StrategyIcicleSegment]
  leave: [segment: StrategyIcicleSegment]
  select: [segment: StrategyIcicleSegment]
}>()

const segmentState = computed(() =>
  getStrategyIcicleSegmentState(props.segment, props.activeSegment),
)
</script>

<template>
  <div
    class="strategy-icicle-button-row"
    :class="[
      `strategy-icicle-button-row--${align}`,
      `strategy-icicle-button-row--${segmentState}`,
    ]"
    :style="{
      '--strategy-icicle-button-color': segment.color,
      '--strategy-icicle-button-height': `${segment.heightPercent}%`,
      '--strategy-icicle-button-width': `${segment.widthPercent}%`,
    }"
    @mouseenter="emit('hover', segment)"
    @mouseleave="emit('leave', segment)"
  >
    <button
      type="button"
      class="strategy-icicle-button"
      :class="[
        `strategy-icicle-button--${align}`,
        `strategy-icicle-button--${segmentState}`,
        { 'strategy-icicle-button--selected': selected },
      ]"
      :aria-label="accessibilityLabel"
      @blur="emit('leave', segment)"
      @click.stop="emit('select', segment)"
      @focus="emit('hover', segment)"
    >
      <span v-if="label">{{ label }}</span>
    </button>

    <slot />
  </div>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyIcicleButton.css';
</style>
