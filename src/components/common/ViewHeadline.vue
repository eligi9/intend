<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    level?: 1 | 2 | 3
    subline?: string | null
    title: string
  }>(),
  {
    level: 2,
    subline: null,
  },
)

const headingTag = computed(() => `h${props.level}`)
</script>

<template>
  <div class="view-headline">
    <component :is="headingTag" class="view-headline__title">
      {{ title }}
    </component>
    <p v-if="subline" class="view-headline__subline">
      {{ subline }}
    </p>
  </div>
</template>

<style scoped>
@import '../../css/components/common/ViewHeadline.css';
</style>
