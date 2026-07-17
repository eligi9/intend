<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: string
    opacity?: number
    visible?: boolean
  }>(),
  {
    color: '#ff00ff',
    opacity: 0.32,
    visible: true,
  },
)

const isVisible = ref(props.visible)

watch(
  () => props.visible,
  (visible) => {
    isVisible.value = visible
  },
)

function toggleGrid(event: KeyboardEvent) {
  if (event.altKey && event.code === 'KeyG') {
    isVisible.value = !isVisible.value
  }
}

onMounted(() => window.addEventListener('keydown', toggleGrid))
onBeforeUnmount(() => window.removeEventListener('keydown', toggleGrid))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="four-point-grid"
      :style="{
        '--four-point-grid-color': color,
        '--four-point-grid-opacity': opacity,
      }"
      aria-hidden="true"
    />
  </Teleport>
</template>

<style scoped>
@import '../../css/components/common/FourPointGrid.css';
</style>
