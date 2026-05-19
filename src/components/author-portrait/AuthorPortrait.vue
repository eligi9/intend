<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentLabelKey } from '../../types/intentData'
import AuthorTooltip from '../author-tooltip/AuthorTooltip.vue'

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
const ringGap = computed(() => ringStroke.value * 0.5)
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
const fallbackIconType = computed(() => {
  if (props.author.gender === 'female') return '♀'
  if (props.author.gender === 'male') return '♂'
  return '?'
})
const fallbackLabel = computed(() => {
  if (props.author.gender === 'female') return 'weibliches Piktogramm'
  if (props.author.gender === 'male') return 'maennliches Piktogramm'
  return 'Geschlecht unbekannt'
})
</script>

<template>
  <AuthorTooltip :author="author">
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
        <span v-else class="author-portrait__fallback" :aria-label="fallbackLabel">
          <svg
            v-if="fallbackIconType === '♀'"
            class="author-portrait__fallback-icon"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <circle cx="32" cy="17" r="10" />
            <path d="M20 56h24l-5-23h5c0-8-5-13-12-13S20 25 20 33h5l-5 23Z" />
          </svg>
          <svg
            v-else-if="fallbackIconType === '♂'"
            class="author-portrait__fallback-icon"
            viewBox="0 0 64 64"
            aria-hidden="true"
          >
            <circle cx="32" cy="17" r="10" />
            <path d="M20 57V36c0-9 5-14 12-14s12 5 12 14v21h-9V41h-6v16h-9Z" />
          </svg>
          <span v-else class="author-portrait__fallback-unknown" aria-hidden="true">?</span>
        </span>
      </span>
    </figure>
  </AuthorTooltip>
</template>

<style scoped>
@import './AuthorPortrait.css';
</style>
