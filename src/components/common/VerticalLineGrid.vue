<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  areaCount: number
  labels: readonly string[]
  scaleLabel?: string
}>()

const lines = computed(() =>
  Array.from({ length: props.areaCount + 1 }, (_, index) => ({
    index,
    isCenter: index === props.areaCount / 2,
    label: props.labels[index] ?? '',
    xPercent: (index / props.areaCount) * 100,
  })),
)
</script>

<template>
  <div class="vertical-line-grid" aria-hidden="true">
    <div
      v-for="line in lines"
      :key="line.index"
      class="vertical-line-grid__line"
      :class="{ 'vertical-line-grid__line--center': line.isCenter }"
      :style="{ '--line-x': `${line.xPercent}%` }"
    >
      <span v-if="line.label" class="vertical-line-grid__label">
        {{ line.label }}
      </span>
    </div>

    <span v-if="props.scaleLabel" class="vertical-line-grid__scale-label">
      {{ props.scaleLabel }}
    </span>
  </div>
</template>

<style scoped>
@import '../../css/components/common/VerticalLineGrid.css';
</style>
