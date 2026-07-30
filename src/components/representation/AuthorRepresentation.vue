<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import type { PatternLabelKey } from '../../types/intentData'
import { strategyColors } from '../../utils/intentLabels'

const strategyDisplayOrder: PatternLabelKey[] = [
  'enemy_image',
  'rhetorical_foreclosure',
  'just_cause',
  'individual_needs',
]

const props = withDefaults(
  defineProps<{
    author: AuthorInstance
    backgroundColor?: string
    showRings?: boolean
    size?: number
    variant?: 'default' | 'detail'
  }>(),
  {
    backgroundColor: 'transparent',
    showRings: true,
    size: 148,
    variant: 'default',
  },
)

const ringStrokeByVariant = {
  default: 3,
  detail: 4,
} as const
const ringGapByVariant = {
  default: 1,
  detail: 2,
} as const
const ringStroke = computed(() => ringStrokeByVariant[props.variant])
const ringGap = computed(() => ringGapByVariant[props.variant])
const maxRingCount = strategyDisplayOrder.length
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
const totalRingSpace = computed(
  () => props.showRings ? maxRingCount * (ringStroke.value + ringGap.value) : 0,
)
const imageSize = computed(() => Math.max(32, props.size - totalRingSpace.value * 2))
const backgroundSize = computed(
  () =>
    imageSize.value +
    (props.showRings ? rings.value.length * (ringStroke.value + ringGap.value) * 2 : 0),
)

const outerRingColor = computed(() =>
  rings.value.length ? rings.value[rings.value.length - 1].color : 'var(--color-neutral)',
)

const imageAlt = computed(() => `Portrait von ${props.author.name}`)
</script>

<template>
  <figure
    class="author-representation"
    :style="{
      '--author-representation-size': `${size}px`,
      '--author-background-color': backgroundColor,
      '--author-background-size': `${backgroundSize}px`,
      '--author-image-size': `${imageSize}px`,
      '--author-ring-gap': `${ringGap}px`,
      '--author-ring-stroke': `${ringStroke}px`,
      '--author-shadow-color': `${outerRingColor}`,
      '--author-image-shadow-color': 'var(--author-view-background, var(--app-background))',
    }"
  >
    <span class="author-representation__background" aria-hidden="true" />
    <span v-if="showRings" class="author-representation__rings" aria-hidden="true">
      <span
        v-for="ring in rings"
        :key="ring.label"
        class="author-representation__ring"
        :style="{ '--ring-color': ring.color, '--ring-index': ring.index }"
      />
    </span>

    <span class="author-representation__image-shell">
      <img
        v-if="author.image"
        class="author-representation__image"
        :src="author.image.url"
        :alt="imageAlt"
        draggable="false"
      />
      <span v-else class="author-representation__fallback" aria-hidden="true" />
    </span>
  </figure>
</template>

<style scoped>
@import '../../css/components/representation/AuthorRepresentation.css';
</style>
