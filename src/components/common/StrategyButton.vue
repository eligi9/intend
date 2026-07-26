<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    active?: boolean
    color: string
    interactionType?: 'click' | 'hover'
    label: string
    minWidth?: string
  }>(),
  {
    active: false,
    interactionType: 'click',
    minWidth: '0',
  },
)

const emit = defineEmits<{
  'interaction-change': [active: boolean]
  select: []
}>()

function select() {
  emit('select')
}

function setInteraction(active: boolean) {
  if (props.interactionType === 'hover') emit('interaction-change', active)
}
</script>

<template>
  <button
    type="button"
    class="strategy-button"
    :class="{
      'strategy-button--active': active,
      [`strategy-button--${interactionType}`]: true,
    }"
    :style="{ '--strategy-button-color': color, minWidth }"
    :aria-pressed="active"
    @click.stop="select"
    @mouseenter="setInteraction(true)"
    @mouseleave="setInteraction(false)"
    @focus="setInteraction(true)"
    @blur="setInteraction(false)"
  >
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
@import '../../css/components/common/StrategyButton.css';
</style>
