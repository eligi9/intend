<script setup lang="ts">
import { computed } from 'vue'
import IconFemale from './IconFemale.vue'
import IconMale from './IconMale.vue'

const props = defineProps<{
  gender: string | null
}>()

const iconType = computed(() => {
  if (props.gender === 'female') return 'female'
  if (props.gender === 'male') return 'male'
  return 'unknown'
})

const fallbackLabel = computed(() => {
  if (props.gender === 'female') return 'weibliches Piktogramm'
  if (props.gender === 'male') return 'maennliches Piktogramm'
  return 'Geschlecht unbekannt'
})
</script>

<template>
  <IconFemale
    v-if="iconType === 'female'"
    class="author-fallback-icon"
    role="img"
    :aria-label="fallbackLabel"
  />
  <IconMale
    v-else-if="iconType === 'male'"
    class="author-fallback-icon"
    role="img"
    :aria-label="fallbackLabel"
  />

  <span
    v-else
    class="author-fallback-icon author-fallback-icon--unknown"
    role="img"
    :aria-label="fallbackLabel"
  >
    ?
  </span>
</template>

<style scoped>
@import '../../css/components/icons/AuthorFallbackIcon.css';
</style>
