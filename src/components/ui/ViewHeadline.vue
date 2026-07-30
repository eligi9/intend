<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    level?: 1 | 2 | 3
    subline?: string | null
    title: string
    titleSuffix?: string | null
  }>(),
  {
    level: 2,
    subline: null,
    titleSuffix: null,
  },
)

const headingTag = computed(() => `h${props.level}`)
</script>

<template>
  <div class="view-headline">
    <component :is="headingTag" class="view-headline__title">
      {{ title }}
      <span v-if="titleSuffix" class="view-headline__title-suffix">
        {{ titleSuffix }}
      </span>
    </component>
    <p v-if="subline" class="view-headline__subline">
      {{ subline }}
    </p>
  </div>
</template>

<style scoped>
@import '../../css/components/ui/ViewHeadline.css';
</style>
