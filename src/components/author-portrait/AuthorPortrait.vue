<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentLabelKey } from '../../types/intentData'

const strategyColors: Partial<Record<IntentLabelKey, string>> = {
  enemy_image: 'var(--intent-color-enemy-image)',
  rhetorical_foreclosure: 'var(--intent-color-rhetorical-foreclosure)',
  just_cause: 'var(--intent-color-just-cause)',
  individual_needs: 'var(--intent-color-individual-needs)',
}

const strategyDisplayOrder: IntentLabelKey[] = [
  'enemy_image',
  'rhetorical_foreclosure',
  'just_cause',
  'individual_needs',
]

const ringSizes = [270, 250, 232, 212]

const props = withDefaults(
  defineProps<{
    author: AuthorInstance
    size?: number
  }>(),
  {
    size: 270,
  },
)

const scale = computed(() => props.size / 270)

const rings = computed(() => {
  const usedLabels = new Set(props.author.usedTopLevelStrategyLabels)

  return strategyDisplayOrder
    .filter((label) => usedLabels.has(label))
    .map((label, index) => ({
      label,
      color: strategyColors[label] ?? '#858b94',
      size: ringSizes[index],
    }))
})

const imageAlt = computed(() => `Portrait von ${props.author.name}`)
</script>

<template>
  <figure class="author-portrait" :style="{ '--author-portrait-scale': scale }">
    <span class="author-portrait__rings" aria-hidden="true">
      <span
        v-for="ring in rings"
        :key="ring.label"
        class="author-portrait__ring"
        :style="{ '--ring-color': ring.color, '--ring-size': `${ring.size}px` }"
      />
    </span>

    <span class="author-portrait__image-shell">
      <img
        v-if="author.image"
        class="author-portrait__image"
        :src="author.image.url"
        :alt="imageAlt"
        draggable="false"
      />
      <span v-else class="author-portrait__fallback" aria-hidden="true">
        {{ author.name.slice(0, 1) }}
      </span>
    </span>
  </figure>
</template>

<style scoped>
@import './AuthorPortrait.css';
</style>
