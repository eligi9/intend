<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  direction: 'left' | 'right'
  ariaLabel?: string
}>()

const arrow = computed(() => (props.direction === 'left' ? '←' : '→'))
const label = computed(() => props.ariaLabel ?? `${props.direction} arrow`)
</script>

<template>
  <button
    type="button"
    class="square-arrow-button"
    :class="`square-arrow-button--${direction}`"
    :aria-label="label"
  >
    {{ arrow }}
  </button>
</template>

<style scoped>
@import '../../css/components/common/SquareArrowButton.css';
</style>
