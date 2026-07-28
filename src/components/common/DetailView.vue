<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import AuthorPortrait from '../author/AuthorPortrait.vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentRecord } from '../../types/intentData'
import type { OverlaySide } from '../../types/overlay'
import ImageCreditsView from '../../views/ImageCreditsView.vue'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { useCompactStickyHeader } from '../../composables/useCompactStickyHeader'
import { useDetailStatementScroll } from '../../composables/useDetailStatementScroll'
import StatementContainer from './StatementContainer.vue'
import ViewHeadline from './ViewHeadline.vue'

const props = withDefaults(
  defineProps<{
    author: AuthorInstance | null
    records: readonly IntentRecord[]
    side?: OverlaySide
    targetStatementId?: string | null
  }>(),
  {
    side: 'right',
  },
)

const detailView = ref<HTMLElement | null>(null)
const showImageCredits = ref(false)
const {
  compactHeaderContent,
  compactHeaderHeight,
  handleScroll: handleDetailScroll,
  isHeaderCompact,
} = useCompactStickyHeader({ initialCompact: Boolean(props.targetStatementId) })

usePageScrollLock()

const statementSideOverlaySide = computed<OverlaySide>(() =>
  props.side === 'left' ? 'right' : 'left',
)
const authorPositionSubline = computed(
  () =>
    props.author?.position ??
    props.records[0]?.speakerPosition ??
    props.records[0]?.sector ??
    'Position unbekannt',
)
const {
  clearFocusedStatement,
  focusedStatementId,
} = useDetailStatementScroll({
  container: detailView,
  targetStatementId: toRef(props, 'targetStatementId'),
})

function clearFocusOnButtonInteraction(event: Event) {
  if (event.target instanceof Element && event.target.closest('button')) {
    clearFocusedStatement()
  }
}

function openImageCredits() {
  showImageCredits.value = true
}

function closeImageCredits() {
  showImageCredits.value = false
}

</script>

<template>
  <aside
    ref="detailView"
    class="detail-view"
    :class="`detail-view--${side}`"
    aria-label="Detail"
    @focusin.capture="clearFocusOnButtonInteraction"
    @pointerdown.capture="clearFocusOnButtonInteraction"
    @scroll.stop="handleDetailScroll"
    @touchmove.stop="clearFocusedStatement"
    @wheel.stop="clearFocusedStatement"
  >
    <section
      class="detail"
      :class="{ 'detail--header-compact': isHeaderCompact }"
      :style="{ '--detail-compact-header-height': compactHeaderHeight }"
    >
      <header class="detail__header">
        <div class="detail__header-inner">
          <div ref="compactHeaderContent" class="detail__author-portrait">
            <AuthorPortrait
              v-if="author"
              :author="author"
              :size="148"
              :show-tooltip="false"
              variant="detail"
            />
            <div v-else class="detail__author-fallback" aria-hidden="true" />

            <div class="detail__headline-block">
              <ViewHeadline
                class="detail__headline"
                :title="author?.name ?? records[0]?.author ?? 'Autor nicht gefunden'"
                :title-suffix="`(${records.length})`"
                :subline="authorPositionSubline"
              />

              <button
                v-if="author?.image"
                class="detail__image-source"
                type="button"
                aria-label="Image credits and licenses"
                title="Image credits and licenses"
                @click.stop="openImageCredits"
              >
                Image: Credits and licenses
              </button>
            </div>
          </div>
        </div>
      </header>

      <StatementContainer
        :focused-statement-id="focusedStatementId"
        :overlay-side="statementSideOverlaySide"
        :records="records"
        @interaction-start="clearFocusedStatement"
      />
    </section>

    <Teleport to="body">
      <Transition name="image-credits-overlay">
        <ImageCreditsView
          v-if="showImageCredits"
          @close="closeImageCredits"
        />
      </Transition>
    </Teleport>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/DetailView.css';
</style>
