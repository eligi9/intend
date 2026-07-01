<script setup lang="ts">
defineProps<{
  active: boolean
  label: string
}>()

const emit = defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    type="button"
    class="explore-nav-button"
    :class="{ 'explore-nav-button--active': active }"
    @click="emit('select')"
  >
    {{ label }}
  </button>
</template>

<style scoped>
@import '../../css/components/explore/ExploreNavButton.css';
</style>
