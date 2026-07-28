<script setup lang="ts">
import type { FloatingPlacement } from '../../composables/useFloatingPlacement'
import Tooltip from '../common/Tooltip.vue'

const props = withDefaults(
  defineProps<{
    anchorTexts: readonly string[]
    author: string
    color: string
    date: string
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
</script>

<template>
  <Tooltip
    class="pattern-tooltip"
    :disabled="props.disabled || anchorTexts.length === 0"
    :focusable="focusable"
    :placement="placement"
    :show-arrow="showArrow"
    :visible="visible"
  >
    <slot />

    <template #panel>
      <span class="pattern-tooltip__content">
        <span class="pattern-tooltip__meta">
          <strong>{{ author }}</strong> · {{ date }}
        </span>

        <strong class="pattern-tooltip__title">Pattern</strong>

        <span class="pattern-tooltip__labels">
          <span
            v-for="anchorText in anchorTexts"
            :key="anchorText"
            class="pattern-tooltip__label"
            :style="{ '--pattern-tooltip-color': color }"
          >
            »{{ anchorText }}«
          </span>
        </span>

        <small class="pattern-tooltip__note">
          Note: shortened excerpts — click to see full statement
        </small>
      </span>
    </template>
  </Tooltip>
</template>

<style scoped>
@import '../../css/components/strategy/PatternTooltip.css';
</style>
