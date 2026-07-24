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
import StatementPatternCard from './StatementPatternCard.vue'
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
const hoveredBadgeStatementId = ref<string | null>(null)
const hoveredContextStatementId = ref<string | null>(null)
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
useDetailStatementScroll({
  container: detailView,
  targetStatementId: toRef(props, 'targetStatementId'),
})

function setContextHovered(statementId: string, visible: boolean) {
  hoveredContextStatementId.value = visible
    ? statementId
    : hoveredContextStatementId.value === statementId
      ? null
      : hoveredContextStatementId.value
}

function setBadgeHovered(statementId: string, visible: boolean) {
  hoveredBadgeStatementId.value = visible
    ? statementId
    : hoveredBadgeStatementId.value === statementId
      ? null
      : hoveredBadgeStatementId.value
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
    @scroll.stop="handleDetailScroll"
    @touchmove.stop
    @wheel.stop
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
            <div v-else class="detail__author-fallback" aria-hidden="true">
              ?
            </div>

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

      <section class="detail__content" aria-label="Statements">
        <StatementPatternCard
          v-for="statement in records"
          :key="statement.id"
          :data-statement-id="statement.id"
          :class="{
            'detail__statement--dimmed':
              (hoveredBadgeStatementId !== null && hoveredBadgeStatementId !== statement.id) ||
              (hoveredContextStatementId !== null && hoveredContextStatementId !== statement.id),
          }"
          :record="statement"
          :overlay-side="statementSideOverlaySide"
          :show-context-button="true"
          @badge-hover-change="setBadgeHovered(statement.id, $event)"
          @context-hover-change="setContextHovered(statement.id, $event)"
        />
      </section>
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
