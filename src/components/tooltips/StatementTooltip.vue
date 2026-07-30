<script setup lang="ts">
import type { FloatingPlacement } from '../../composables/useFloatingPlacement'
import type { Statement } from '../../types/intentData'
import Tooltip from './Tooltip.vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    focusable?: boolean
    placement?: FloatingPlacement
    record: Statement
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
    class="statement-tooltip"
    :disabled="props.disabled || record.measures.length === 0"
    :focusable="focusable"
    :placement="placement"
    :show-arrow="showArrow"
    :visible="visible"
  >
    <slot />

    <template #panel>
      <span class="statement-tooltip__content">
        <span class="statement-tooltip__meta">
          <strong>{{ record.author }}</strong> · {{ record.date }}
        </span>

        <strong class="statement-tooltip__title">Proposals and Actions</strong>

        <span class="statement-tooltip__labels">
          <span
            v-for="measure in record.measures"
            :key="measure"
            class="statement-tooltip__label"
          >
            »{{ measure }}«
          </span>
        </span>

        <small class="statement-tooltip__note">
          Note: shortened excerpts — click to see full statement
        </small>
      </span>
    </template>
  </Tooltip>
</template>

<style scoped>
@import '../../css/components/tooltips/StatementTooltip.css';
</style>
