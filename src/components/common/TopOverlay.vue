<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    background?: string
    headingColor?: string
    meta?: string
    minHeight?: string
    text?: string
    textColor?: string
    title: string
    visible: boolean
  }>(),
  {
    background: 'var(--color-text)',
    headingColor: 'var(--text-black)',
    meta: '',
    minHeight: '20vh',
    text: '',
    textColor: 'var(--text-black)',
  },
)

const overlayStyle = computed(() => {
  return {
    '--top-overlay-background': props.background,
    '--top-overlay-heading-color': props.headingColor,
    '--top-overlay-min-height': props.minHeight,
    '--top-overlay-text-color': props.textColor,
  }
})
</script>

<template>
  <Transition name="top-overlay">
    <aside
      v-if="visible"
      class="top-overlay"
      :style="overlayStyle"
      aria-live="polite"
    >
      <div class="top-overlay__inner">
        <h3>{{ title }}</h3>
        <p v-if="text">{{ text }}</p>
        <span v-if="meta">{{ meta }}</span>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
@import '../../css/components/common/TopOverlay.css';
</style>
