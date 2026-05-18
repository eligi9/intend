<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    color?: string
    active?: boolean
    minWidth?: string
  }>(),
  {
    color: 'var(--intent-color-individual-needs)',
    active: false,
    minWidth: '100px',
  },
)

defineEmits<{
  click: [MouseEvent]
}>()
</script>

<template>
  <button
    type="button"
    class="filter-button"
    :class="{ 'filter-button--active': active }"
    :style="{ '--filter-button-color': color, minWidth }"
    :aria-pressed="active"
    @click="$emit('click', $event)"
  >
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
@import './FilterButton.css';
</style>
