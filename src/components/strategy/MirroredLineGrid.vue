<script setup lang="ts">
import { computed } from 'vue'

interface MirroredLineGridMarker {
  label?: string
  side: 'left' | 'right'
  value: number
}

const props = defineProps<{
  maxValue: number
  marker?: MirroredLineGridMarker | null
  scaleLabel: string
  stepSize: number
}>()

const gridLines = computed(() => {
  const lineCount = Math.round((props.maxValue * 2) / props.stepSize) + 1

  return Array.from({ length: lineCount }, (_, index) => {
    const value = -props.maxValue + index * props.stepSize
    const labelValue = Math.abs(value)

    return {
      id: value,
      label: labelValue === 0 || labelValue === props.maxValue ? '' : `${labelValue}`,
      xPercent: getXPercent(value),
    }
  })
})

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
    <div
      v-for="line in gridLines"
      :key="line.id"
      class="mirrored-line-grid__line"
      :class="{
        'mirrored-line-grid__line--center': line.id === 0,
      }"
      :style="{ '--line-x': `${line.xPercent}%` }"
    >
      <span v-if="line.label" class="mirrored-line-grid__value">
        {{ line.label }}
      </span>
    </div>

    <span class="mirrored-line-grid__label">{{ props.scaleLabel }}</span>

    <Teleport to="body">
      <div
        v-if="markerPosition"
        class="mirrored-line-grid__marker"
        :style="{ '--marker-x': `${markerPosition.xPercent}%` }"
      >
        <span class="mirrored-line-grid__marker-value">
          {{ markerPosition.label }}
        </span>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@import '../../css/components/strategy/MirroredLineGrid.css';
</style>
