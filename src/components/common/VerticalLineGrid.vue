<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  highlightCenter?: boolean
  labels: readonly string[]
  lineCount: number
  scaleLabel?: string
}>()

const lines = computed(() =>
  Array.from({ length: props.lineCount }, (_, index) => ({
    index,
    isCenter: index === (props.lineCount - 1) / 2,
    label: props.labels[index] ?? '',
    xPercent: props.lineCount > 1 ? (index / (props.lineCount - 1)) * 100 : 0,
  })),
)
</script>

<template>
  <div class="vertical-line-grid" aria-hidden="true">
    <div
      v-for="line in lines"
      :key="line.index"
      class="vertical-line-grid__line"
      :class="{
        'vertical-line-grid__line--center': props.highlightCenter && line.isCenter,
      }"
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
