<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { InlineFragmentRect } from '../../composables/useInlineFragmentRects'

const props = withDefaults(
  defineProps<{
    color: string
    gap?: number
    mode?: 'fill' | 'outline'
    rects: readonly InlineFragmentRect[]
    strokeWidth?: number
  }>(),
  {
    gap: 0,
    mode: 'fill',
    strokeWidth: 1,
  },
)

function getBoxStyle(rect: InlineFragmentRect): CSSProperties {
  const gap = Math.max(0, props.gap)
  const strokeWidth = Math.max(0, props.strokeWidth)
  const isOutline = props.mode === 'outline'
  const verticalInset = gap / 2 + (isOutline ? strokeWidth : 0)
  const horizontalInset = isOutline ? 0 : strokeWidth

  return {
    '--inline-fragment-color': rect.color ?? props.color,
    '--inline-fragment-stroke-width': `${strokeWidth}px`,
    height: `${Math.max(0, rect.height - verticalInset * 2)}px`,
    left: `${rect.left - horizontalInset}px`,
    top: `${rect.top + verticalInset}px`,
    width: `${rect.width + horizontalInset * 2}px`,
  } as CSSProperties
}
</script>

<template>
  <span class="inline-fragment-layer" aria-hidden="true">
    <span
      v-for="(rect, index) in rects"
      :key="`${rect.left}-${rect.top}-${index}`"
      :class="[
        'inline-fragment-layer__box',
        `inline-fragment-layer__box--${mode}`,
      ]"
      :style="getBoxStyle(rect)"
    />
  </span>
</template>

<style scoped>
@import '../../css/components/statement/InlineFragmentLayer.css';
</style>
