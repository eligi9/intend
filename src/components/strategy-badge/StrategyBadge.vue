<script setup lang="ts">
defineProps<{
  label: string
  color: string
  count?: number
}>()
</script>

<template>
  <span
    class="strategy-badge"
    :class="{ 'strategy-badge--with-count': count !== undefined }"
    :style="{ '--strategy-badge-color': color }"
  >
    <span class="strategy-badge__label">{{ label }}</span>
    <small v-if="count !== undefined" class="strategy-badge__count">{{ count }}</small>
  </span>
</template>

<style scoped>
@import './StrategyBadge.css';
</style>
