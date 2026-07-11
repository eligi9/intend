<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFloatingPlacement } from '../../composables/useFloatingPlacement'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    focusable?: boolean
  }>(),
  {
    disabled: false,
    focusable: true,
  },
)

const tooltipRoot = ref<HTMLElement | null>(null)
const { placement, updatePlacement } = useFloatingPlacement(tooltipRoot)
const tabindex = computed(() => (!props.disabled && props.focusable ? 0 : undefined))
</script>

<template>
  <span
    ref="tooltipRoot"
    class="tooltip"
    :class="`tooltip--${placement}`"
    :tabindex="tabindex"
    @mouseenter="updatePlacement"
    @focusin="updatePlacement"
  >
    <slot />

    <span
      v-if="!disabled"
      class="tooltip__panel"
      role="tooltip"
    >
      <slot name="panel" />
    </span>
  </span>
</template>

<style scoped>
@import '../../css/components/common/Tooltip.css';
</style>
