<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useInlineFragmentRects } from '../../composables/useInlineFragmentRects'
import type { IntentRecord } from '../../types/intentData'
import { splitMeasureText } from '../../utils/statementHighlights'
import InlineFragmentLayer from '../common/InlineFragmentLayer.vue'

const props = defineProps<{
  record: IntentRecord
}>()

const quoteElement = ref<HTMLElement | null>(null)
const measureLayerElement = ref<HTMLElement | null>(null)
const measureSegments = computed(() =>
  splitMeasureText(props.record.statement, props.record.measures),
)
const { fragmentRects: measureBoxes, requestMeasurement } = useInlineFragmentRects(
  quoteElement,
  measureLayerElement,
  '[data-measure-highlight="true"]',
)

watch(
  () => [props.record.statement, props.record.measures.join('\u0000')],
  requestMeasurement,
  { flush: 'post' },
)

</script>

<template>
  <article class="establishment-featured-statement">
    <p class="establishment-featured-statement__meta">
      {{ record.date }} · {{ record.author }}
    </p>

    <blockquote ref="quoteElement" class="establishment-featured-statement__quote">
      <span class="establishment-featured-statement__quote-layer">
        {{ record.statement }}
      </span>

      <span
        ref="measureLayerElement"
        class="establishment-featured-statement__quote-layer establishment-featured-statement__quote-layer--measures"
        aria-hidden="true"
      >
        <span
          v-for="(segment, index) in measureSegments"
          :key="`measure-${segment.text}-${index}`"
          :data-measure-highlight="Boolean(segment.color)"
        >{{ segment.text }}</span>
      </span>

      <InlineFragmentLayer
        :rects="measureBoxes"
        color="var(--color-black-40)"
        :gap="6"
        mode="outline"
        :stroke-width="1"
      />
    </blockquote>
  </article>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentFeaturedStatement.css';
</style>
