<script setup lang="ts">
import { computed } from 'vue'
import type { IcicleSegment } from '../../types/icicle'
import { getIcicleSegmentState } from '../../utils/icicle'

const props = defineProps<{
  activeSegment: IcicleSegment | null
  align: 'left' | 'right'
  accessibilityLabel: string
  label?: string
  segment: IcicleSegment
  selected: boolean
}>()

const emit = defineEmits<{
  hover: [segment: IcicleSegment]
  leave: [segment: IcicleSegment]
  select: [segment: IcicleSegment]
}>()

const segmentState = computed(() =>
  getIcicleSegmentState(props.segment, props.activeSegment),
)
</script>

<template>
  <div
    class="icicle-button-row"
    :class="[
      `icicle-button-row--${align}`,
      `icicle-button-row--${segmentState}`,
    ]"
    :style="{
      '--icicle-button-color': segment.color,
      '--icicle-button-height': `${segment.heightPercent}%`,
      '--icicle-button-width': `${segment.widthPercent}%`,
    }"
  >
    <button
      type="button"
      class="icicle-button"
      :class="[
        `icicle-button--${align}`,
        `icicle-button--${segmentState}`,
        { 'icicle-button--selected': selected },
      ]"
      :aria-label="accessibilityLabel"
      @blur="emit('leave', segment)"
      @click.stop="emit('select', segment)"
      @focus="emit('hover', segment)"
      @mouseenter="emit('hover', segment)"
      @mouseleave="emit('leave', segment)"
    >
      <span v-if="label">{{ label }}</span>
    </button>

    <slot />
  </div>
</template>

<style scoped>
@import '../../css/components/button/IcicleButton.css';
</style>
