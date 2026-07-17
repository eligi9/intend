<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useFloatingPlacement,
  type FloatingPlacement,
} from '../../composables/useFloatingPlacement'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    focusable?: boolean
    placement?: FloatingPlacement
    showArrow?: boolean
    visible?: boolean
  }>(),
  {
    disabled: false,
    focusable: true,
    showArrow: true,
    visible: false,
  },
)

const tooltipRoot = ref<HTMLElement | null>(null)
const { placement: automaticPlacement, updatePlacement } = useFloatingPlacement(tooltipRoot)
const resolvedPlacement = computed(() => props.placement ?? automaticPlacement.value)
const tabindex = computed(() => (!props.disabled && props.focusable ? 0 : undefined))
</script>

<template>
  <span
    ref="tooltipRoot"
    class="tooltip"
    :class="[
      `tooltip--${resolvedPlacement}`,
      {
        'tooltip--visible': visible,
        'tooltip--without-arrow': !showArrow,
      },
    ]"
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
