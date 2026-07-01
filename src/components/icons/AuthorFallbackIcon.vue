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
.author-fallback-icon {
  width: 54%;
  height: 54%;
  fill: currentColor;
}

.author-fallback-icon--unknown {
  display: grid;
  place-items: center;
  width: auto;
  height: auto;
  font-size: calc(var(--author-image-size) * 0.48);
  font-weight: 800;
  line-height: 1;
}
</style>
