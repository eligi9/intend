<script setup lang="ts">
import { computed } from 'vue'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import VerticalLineGrid from './VerticalLineGrid.vue'

const props = defineProps<{
  highlightCenter?: boolean
  maxValue: number
  marker?: MirroredLineGridMarker | null
  scaleLabel: string
  stepSize: number
}>()

const areaCount = computed(() => Math.round((props.maxValue * 2) / props.stepSize))
const lineCount = computed(() => areaCount.value + 1)

const gridLabels = computed(() =>
  Array.from({ length: areaCount.value + 1 }, (_, index) => {
    const value = -props.maxValue + index * props.stepSize
    const labelValue = Math.abs(value)

    return labelValue === 0 || labelValue === props.maxValue ? '' : `${labelValue}`
  }),
)

const markerPosition = computed(() => {
  if (!props.marker) {
    return null
  }

  const value = Math.min(props.marker.value, props.maxValue)
  const signedValue = props.marker.side === 'left' ? value * -1 : value

  return {
    label: props.marker.label ?? `${props.marker.value}`,
    xPercent: getXPercent(signedValue),
  }
})

function getXPercent(value: number) {
  return ((value + props.maxValue) / (props.maxValue * 2)) * 100
}
</script>

<template>
  <div class="mirrored-line-grid" aria-hidden="true">
    <VerticalLineGrid
      :highlight-center="props.highlightCenter"
      :labels="gridLabels"
      :line-count="lineCount"
      :scale-label="props.scaleLabel"
    />

    <div
      v-if="markerPosition"
      class="mirrored-line-grid__marker"
      :style="{ '--marker-x': `${markerPosition.xPercent}%` }"
    >
      <span class="mirrored-line-grid__marker-value">
        {{ markerPosition.label }}
      </span>
    </div>
  </div>
</template>

<style scoped>
@import '../../css/components/grid/MirroredLineGrid.css';
</style>
