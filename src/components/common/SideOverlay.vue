<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  color?: string
  side?: 'left' | 'right'
  title: string
  text: string
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const overlayStyle = computed(() => {
  return {
    '--side-overlay-background': props.color,
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="side-overlay">
      <aside
        v-if="visible"
        class="side-overlay"
        :class="[
          `side-overlay--${side ?? 'right'}`,
          { 'side-overlay--colored': color },
        ]"
        :style="overlayStyle"
        aria-live="polite"
        @click.stop="emit('close')"
      >
        <h3>{{ title }}</h3>
        <p>{{ text }}</p>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '../../css/components/common/SideOverlay.css';
</style>
