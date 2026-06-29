<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  color?: string
  title: string
  text: string
  visible: boolean
}>()

const overlayStyle = computed(() => {
  const hasColor = Boolean(props.color)

  return {
    '--side-overlay-background': props.color ?? 'var(--color-white)',
    '--side-overlay-background-effect': hasColor
      ? 'linear-gradient(180deg, rgba(var(--color-ink-rgb), 0.04), rgba(var(--color-ink-rgb), 0.2))'
      : 'none',
    '--side-overlay-heading-color': hasColor ? 'var(--color-white)' : 'var(--app-background)',
    '--side-overlay-text-color': hasColor
      ? 'rgba(var(--color-white-rgb), 0.9)'
      : 'rgba(var(--color-background-rgb), 0.9)',
  }
})
</script>

<template>
  <Transition name="side-overlay">
    <aside
      v-if="visible"
      class="side-overlay"
      :style="overlayStyle"
      aria-live="polite"
      @click.stop
    >
      <h3>{{ title }}</h3>
      <p>{{ text }}</p>
    </aside>
  </Transition>
</template>

<style scoped>
@import '../../css/components/common/SideOverlay.css';
</style>
