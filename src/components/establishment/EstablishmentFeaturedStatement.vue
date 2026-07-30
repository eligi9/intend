<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useInlineFragmentRects } from '../../composables/useInlineFragmentRects'
import type { Statement, PatternLabelKey } from '../../types/intentData'
import {
  splitMeasureText,
  splitStatementTextExcludingMeasures,
} from '../../utils/statementHighlights'
import {
  getStatementPatternAnchors,
  getStatementPatternBadges,
} from '../../utils/statementPatterns'
import InlineFragmentLayer from '../statement/InlineFragmentLayer.vue'

const props = defineProps<{
  highlightLabel?: PatternLabelKey
  record: Statement
}>()

const quoteElement = ref<HTMLElement | null>(null)
const anchorLayerElement = ref<HTMLElement | null>(null)
const measureLayerElement = ref<HTMLElement | null>(null)
const anchorHighlights = computed(() =>
  getStatementPatternBadges(props.record)
    .filter((badge) => !props.highlightLabel || badge.label === props.highlightLabel)
    .flatMap((badge) =>
      getStatementPatternAnchors(props.record, badge.label).map((text) => ({
        color: badge.color,
        text,
      })),
    ),
)
const anchorSegments = computed(() =>
  splitStatementTextExcludingMeasures(
    props.record.statement,
    anchorHighlights.value,
    props.record.measures,
    1,
  ),
)
const measureSegments = computed(() =>
  splitMeasureText(props.record.statement, props.record.measures),
)
const {
  fragmentRects: anchorBoxes,
  requestMeasurement: requestAnchorMeasurement,
} = useInlineFragmentRects(
  quoteElement,
  anchorLayerElement,
  '[data-anchor-highlight="true"]',
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

watch(
  () => [
    props.record.statement,
    props.record.measures.join('\u0000'),
    anchorHighlights.value.map((anchor) => `${anchor.color}:${anchor.text}`).join('\u0000'),
  ],
  requestAnchorMeasurement,
  { flush: 'post' },
)

</script>

<template>
  <article class="establishment-featured-statement">
    <p class="establishment-featured-statement__meta">
      {{ record.date }} · {{ record.author }}
    </p>

    <blockquote ref="quoteElement" class="establishment-featured-statement__quote">
      <InlineFragmentLayer
        :rects="anchorBoxes"
        color="var(--color-highlight)"
        :gap="6"
        :stroke-width="1"
      />

      <span
        ref="anchorLayerElement"
        class="establishment-featured-statement__quote-layer establishment-featured-statement__quote-layer--anchors"
      >
        <span
          v-for="(segment, index) in anchorSegments"
          :key="`anchor-${segment.text}-${index}`"
          :class="{
            'establishment-featured-statement__quote-part': true,
            'establishment-featured-statement__quote-part--highlighted': segment.color,
            'establishment-featured-statement__quote-part--muted': segment.muted,
          }"
          :data-anchor-highlight="Boolean(segment.color)"
          :data-fragment-color="segment.color ?? undefined"
        >
          {{ segment.text }}
        </span>
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
