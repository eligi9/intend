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

const props = withDefaults(
  defineProps<{
    author: AuthorInstance
    size?: number
  }>(),
  {
    size: 148,
  },
)

const ringStroke = computed(() => Math.max(2, props.size * 0.03))
const ringGap = computed(() => ringStroke.value * 0.25)
const maxRingCount = strategyDisplayOrder.length
const totalRingSpace = computed(
  () => maxRingCount * ringStroke.value + (maxRingCount - 1) * ringGap.value,
)
const imageSize = computed(() => Math.max(32, props.size - totalRingSpace.value * 2))

const outerRingColor = computed(() =>
  rings.value.length ? rings.value[rings.value.length - 1].color : '#858b94',
)

const rings = computed(() => {
  const usedLabels = new Set(props.author.usedTopLevelStrategyLabels)

  return strategyDisplayOrder
    .filter((label) => usedLabels.has(label))
    .map((label, index) => ({
      label,
      color: strategyColors[label] ?? '#858b94',
      index,
    }))
})

const imageAlt = computed(() => `Portrait von ${props.author.name}`)
</script>

<template>
  <figure
    class="author-portrait"
    :style="{
      '--author-portrait-size': `${size}px`,
      '--author-image-size': `${imageSize}px`,
      '--author-ring-gap': `${ringGap}px`,
      '--author-ring-stroke': `${ringStroke}px`,
      '--author-shadow-color': `${outerRingColor}`,
      '--author-image-shadow-color': 'var(--author-view-background, #303030)',
    }"
  >
    <span class="author-portrait__rings" aria-hidden="true">
      <span
        v-for="ring in rings"
        :key="ring.label"
        class="author-portrait__ring"
        :style="{ '--ring-color': ring.color, '--ring-index': ring.index }"
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
