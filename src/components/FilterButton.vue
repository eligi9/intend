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
.filter-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 10px;
  border: 2px solid var(--filter-button-color);
  border-radius: 30px;
  color: var(--filter-button-color);
  background: transparent;
  cursor: pointer;
}

.filter-button:hover {
  color: white;
  background: var(--filter-button-color);
}

.filter-button--active {
  color: white;
  background: var(--filter-button-color);
}

.filter-button span {
  flex: 1 0 0;
  min-width: 0;
  font-size: 10px;
  font-weight: 800;
  line-height: normal;
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
