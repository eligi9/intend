<script setup lang="ts">
defineProps<{
  active: boolean
  ariaLabel?: string
  label: string
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="text-button"
    :class="{ 'text-button--active': active }"
    :aria-label="ariaLabel"
    :disabled="active"
    @click="emit('select')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
@import '../../css/components/button/TextButton.css';
</style>
