<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'down' | 'up'
  }>(),
  {
    direction: 'down',
  },
)
</script>

<template>
  <svg
    class="timeline-event-icon"
    :class="`timeline-event-icon--${direction}`"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-if="direction === 'down'" d="M12 15l-2 -2h-3a1 1 0 0 1 -1 -1v-8a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v8a1 1 0 0 1 -1 1h-3l-2 2" />
    <path v-else d="M12 6l-2 2h-3a1 1 0 0 0 -1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1 -1v-8a1 1 0 0 0 -1 -1h-3l-2 -2" />
    <path v-if="direction === 'down'" d="M12 6v2" />
    <path v-else d="M12 11v2" />
    <path v-if="direction === 'down'" d="M12 11v.01" />
    <path v-else d="M12 16v.01" />
  </svg>
</template>

<style scoped>
@import '../../css/components/timeline/TimelineEventIcon.css';
</style>
