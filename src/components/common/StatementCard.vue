<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { IntentRecord } from '../../types/intentData'
import { splitMeasureText, splitStatementText } from '../../utils/statementHighlights'
import SideOverlay from './SideOverlay.vue'

const props = withDefaults(
  defineProps<{
    anchorColor?: string
    anchorTexts?: readonly string[]
    record: IntentRecord
    showAuthor?: boolean
    showContextButton?: boolean
    showDate?: boolean
    showSource?: boolean
  }>(),
  {
    anchorColor: 'var(--color-highlight)',
    anchorTexts: () => [],
    showAuthor: false,
    showContextButton: true,
    showDate: true,
    showSource: true,
  },
)

const showContext = ref(false)
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
const statementMeta = computed(() =>
  [
    props.showDate ? props.record.date : null,
    props.showAuthor ? props.record.author : null,
    props.showSource ? props.record.source : null,
  ]
    .filter(Boolean)
    .join(' · '),
)
const anchorSegments = computed(() => splitStatementText(props.record.statement, anchorHighlights.value))
const measureSegments = computed(() => splitMeasureText(props.record.statement, props.record.measures))

function setContextVisible(visible: boolean) {
  if (showContext.value === visible) return

  showContext.value = visible
  emit('contextHoverChange', visible)
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
      <span v-if="statementMeta" class="statement-card__meta">
        {{ statementMeta }}
      </span>

      <span class="statement-card__quote">
        <span class="statement-card__quote-layer statement-card__quote-layer--anchors">
          <span
            v-for="(segment, index) in anchorSegments"
            :key="`anchor-${segment.text}-${index}`"
            :class="{
              'statement-card__quote-part': true,
              'statement-card__quote-muted': segment.muted,
              'statement-card__quote-highlight': segment.color,
            }"
            :style="{ '--statement-card-highlight-color': segment.color ?? 'var(--color-neutral)' }"
          >
            {{ segment.text }}
          </span>
        </span>

        <span
          class="statement-card__quote-layer statement-card__quote-layer--measures"
          aria-hidden="true"
        >
          <span
            v-for="(segment, index) in measureSegments"
            :key="`measure-${segment.text}-${index}`"
            :class="{
              'statement-card__quote-part': true,
              'statement-card__quote-muted': segment.muted,
              'statement-card__quote-highlight--measure': segment.color,
            }"
            :style="{ '--statement-card-highlight-color': segment.color ?? 'var(--color-neutral)' }"
          >
            {{ segment.text }}
          </span>
        </span>
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
      side="left"
      color="var(--color-text)"
      title="Context"
      :text="record.context ?? ''"
    />

  </article>
</template>

<style scoped>
@import '../../css/components/common/StatementCard.css';
</style>
