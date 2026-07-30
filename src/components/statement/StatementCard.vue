<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useInlineFragmentRects } from '../../composables/useInlineFragmentRects'
import { useAuthorDetailStore } from '../../stores/authorDetailStore'
import type { Statement } from '../../types/intentData'
import type { OverlaySide } from '../../types/overlay'
import { splitMeasureText, splitStatementText } from '../../utils/statementHighlights'
import InlineFragmentLayer from './InlineFragmentLayer.vue'
import SideOverlay from '../overlay/SideOverlay.vue'

const props = withDefaults(
  defineProps<{
    anchorColor?: string
    anchorTexts?: readonly string[]
    authorDetailRecordIds?: readonly string[]
    overlaySide?: OverlaySide
    record: Statement
    showAuthor?: boolean
    showContextButton?: boolean
    showDate?: boolean
    showSource?: boolean
    underlineDate?: boolean
  }>(),
  {
    anchorColor: 'var(--color-highlight)',
    anchorTexts: () => [],
    overlaySide: 'left',
    showAuthor: false,
    showContextButton: true,
    showDate: true,
    showSource: true,
    underlineDate: true,
  },
)

const showContext = ref(false)
const authorDetailStore = useAuthorDetailStore()
const quoteElement = ref<HTMLElement | null>(null)
const anchorLayerElement = ref<HTMLElement | null>(null)
const measureLayerElement = ref<HTMLElement | null>(null)
const showContextButton = computed(() => props.showContextButton)
const emit = defineEmits<{
  contextHoverChange: [visible: boolean]
}>()
const anchorHighlights = computed(() => {
  return props.anchorTexts.map((text) => ({
    color: props.anchorColor,
    text,
  }))
})
const statementMetaItems = computed(() =>
  [
    props.showDate
      ? { interactive: false, text: props.record.date, underlined: props.underlineDate }
      : null,
    props.showAuthor ? { interactive: true, text: props.record.author, underlined: true } : null,
    props.showSource && props.record.source
      ? { interactive: false, text: props.record.source, underlined: false }
      : null,
  ]
    .filter(
      (item): item is { interactive: boolean; text: string; underlined: boolean } =>
        item !== null,
    ),
)
const anchorSegments = computed(() => splitStatementText(props.record.statement, anchorHighlights.value))
const measureSegments = computed(() => splitMeasureText(props.record.statement, props.record.measures))
const { fragmentRects: anchorBoxes, requestMeasurement: requestAnchorMeasurement } = useInlineFragmentRects(
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
  () => [props.record.statement, props.anchorTexts.join('\u0000')],
  requestAnchorMeasurement,
  { flush: 'post' },
)

function setContextVisible(visible: boolean) {
  if (showContext.value === visible) return

  showContext.value = visible
  emit('contextHoverChange', visible)
}

function openAuthorDetail() {
  authorDetailStore.openAuthorDetail(props.record.author, {
    recordIds: props.authorDetailRecordIds,
    side: 'left',
  })
}

onBeforeUnmount(() => {
  emit('contextHoverChange', false)
})
</script>

<template>
  <article
    class="statement-card"
  >
    <div class="statement-card__contents">
      <span v-if="statementMetaItems.length" class="statement-card__meta">
        <template
          v-for="(item, index) in statementMetaItems"
          :key="`${item.text}-${index}`"
        >
          <button
            v-if="item.interactive"
            type="button"
            class="statement-card__meta-author statement-card__meta-underlined"
            @click.stop="openAuthorDetail"
          >
            {{ item.text }}
          </button>
          <span
            v-else
            :class="{ 'statement-card__meta-underlined': item.underlined }"
          >
            {{ item.text }}
          </span>
          <span v-if="index < statementMetaItems.length - 1"> · </span>
        </template>
      </span>

      <span ref="quoteElement" class="statement-card__quote">
        <InlineFragmentLayer
          :rects="anchorBoxes"
          :color="anchorColor"
          :gap="6"
          :stroke-width="1"
        />

        <span
          ref="anchorLayerElement"
          class="statement-card__quote-layer statement-card__quote-layer--anchors"
        >
          <span
            v-for="(segment, index) in anchorSegments"
            :key="`anchor-${segment.text}-${index}`"
            :class="{
              'statement-card__quote-part': true,
              'statement-card__quote-muted': segment.muted,
              'statement-card__quote-highlight': segment.color,
            }"
            :data-anchor-highlight="Boolean(segment.color)"
          >
            {{ segment.text }}
          </span>
        </span>

        <span
          ref="measureLayerElement"
          class="statement-card__quote-layer statement-card__quote-layer--measures"
          aria-hidden="true"
        >
          <span
            v-for="(segment, index) in measureSegments"
            :key="`measure-${segment.text}-${index}`"
            :class="{
              'statement-card__quote-part': true,
              'statement-card__quote-muted': segment.muted,
            }"
            :data-measure-highlight="Boolean(segment.color)"
          >
            {{ segment.text }}
          </span>
        </span>

        <InlineFragmentLayer
          :rects="measureBoxes"
          color="var(--color-black)"
          :gap="6"
          mode="outline"
          :stroke-width="1"
        />
      </span>

      <button
        v-if="record.context && showContextButton"
        type="button"
        class="statement-card__context-button"
        @click.stop
        @mouseenter="setContextVisible(true)"
        @mouseleave="setContextVisible(false)"
        @focusin="setContextVisible(true)"
        @focusout="setContextVisible(false)"
      >
        seeContext
      </button>
    </div>

    <SideOverlay
      :visible="Boolean(record.context && showContextButton && showContext)"
      :side="overlaySide"
      color="var(--color-text)"
      title="Context"
      :text="record.context ?? ''"
    />

  </article>
</template>

<style scoped>
@import '../../css/components/statement/StatementCard.css';
</style>
