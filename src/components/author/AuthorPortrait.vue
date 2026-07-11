<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import type { PatternLabelKey } from '../../types/intentData'
import { strategyColors } from '../../utils/intentLabels'
import AuthorTooltip from './AuthorTooltip.vue'
import AuthorFallbackIcon from '../icons/AuthorFallbackIcon.vue'

const strategyDisplayOrder: PatternLabelKey[] = [
  'enemy_image',
  'rhetorical_foreclosure',
  'just_cause',
  'individual_needs',
]

const props = withDefaults(
  defineProps<{
    author: AuthorInstance
    showTooltip?: boolean
    showRings?: boolean
    size?: number
  }>(),
  {
    showTooltip: true,
    showRings: true,
    size: 148,
  },
)

const goldenRatio = 1.61803398875
const maxRingCount = strategyDisplayOrder.length
const ringStroke = computed(() => Math.max(2, Math.round(props.size * 0.03)))
const ringGap = computed(() => {
  const goldenImageSize = props.size / goldenRatio
  const ringStep = (props.size - goldenImageSize) / (maxRingCount * 2)

  return Math.max(0, ringStep - ringStroke.value)
})
const totalRingSpace = computed(
  () => props.showRings ? maxRingCount * (ringStroke.value + ringGap.value) : 0,
)
const imageSize = computed(() => Math.max(32, props.size - totalRingSpace.value * 2))

const outerRingColor = computed(() =>
  rings.value.length ? rings.value[rings.value.length - 1].color : 'var(--color-neutral)',
)

const rings = computed(() => {
  const usedLabels = new Set(props.author.usedTopLevelStrategyLabels)

  return strategyDisplayOrder
    .filter((label) => usedLabels.has(label))
    .map((label, index) => ({
      label,
      color: strategyColors[label] ?? 'var(--color-neutral)',
      index,
    }))
})

const imageAlt = computed(() => `Portrait von ${props.author.name}`)
</script>

<template>
  <template v-if="showTooltip">
    <AuthorTooltip :author="author">
      <figure
        class="author-portrait"
        :style="{
          '--author-portrait-size': `${size}px`,
          '--author-image-size': `${imageSize}px`,
          '--author-ring-gap': `${ringGap}px`,
          '--author-ring-stroke': `${ringStroke}px`,
          '--author-shadow-color': `${outerRingColor}`,
          '--author-image-shadow-color': 'var(--author-view-background, var(--app-background))',
        }"
      >
        <span v-if="showRings" class="author-portrait__rings" aria-hidden="true">
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
          <span v-else class="author-portrait__fallback">
            <AuthorFallbackIcon :gender="author.gender" />
          </span>
        </span>
      </figure>
    </AuthorTooltip>
  </template>

  <template v-else>
    <figure
      class="author-portrait"
      :style="{
        '--author-portrait-size': `${size}px`,
        '--author-image-size': `${imageSize}px`,
        '--author-ring-gap': `${ringGap}px`,
        '--author-ring-stroke': `${ringStroke}px`,
        '--author-shadow-color': `${outerRingColor}`,
        '--author-image-shadow-color': 'var(--author-view-background, var(--app-background))',
      }"
    >
      <span v-if="showRings" class="author-portrait__rings" aria-hidden="true">
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
        <span v-else class="author-portrait__fallback">
          <AuthorFallbackIcon :gender="author.gender" />
        </span>
      </span>
    </figure>
  </template>
</template>

<style scoped>
@import '../../css/components/author/AuthorPortrait.css';
</style>
