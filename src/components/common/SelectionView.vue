<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { useCompactStickyHeader } from '../../composables/useCompactStickyHeader'
import { useDetailStatementScroll } from '../../composables/useDetailStatementScroll'
import type { IntentRecord } from '../../types/intentData'
import StatementPatternCard from './StatementPatternCard.vue'
import ViewHeadline from './ViewHeadline.vue'

interface SelectionFilterLabel {
  color: string
  label: string
}

interface SelectionTerm {
  color?: string
  id: string
  text: string
}

const props = defineProps<{
  headerColor?: string
  labels?: SelectionFilterLabel[]
  searchTerm?: string
  title: string
  records: readonly IntentRecord[]
  targetStatementId?: string | null
}>()

const detailView = ref<HTMLElement | null>(null)
const hoveredBadgeStatementId = ref<string | null>(null)
const hoveredContextStatementId = ref<string | null>(null)
const {
  compactHeaderContent,
  compactHeaderHeight,
  handleScroll: handleDetailScroll,
  isHeaderCompact,
} = useCompactStickyHeader({
  compactPaddingToken: '--space-5',
  initialCompact: Boolean(props.targetStatementId),
})

usePageScrollLock()
useDetailStatementScroll({
  container: detailView,
  targetStatementId: toRef(props, 'targetStatementId'),
})

const selectionStyle = computed(() => ({
  '--detail-header-background': props.headerColor ?? 'var(--app-background)',
  '--detail-header-color': props.headerColor ? 'var(--color-white)' : 'var(--color-text)',
}))
const selectionTerms = computed<SelectionTerm[]>(() => {
  const terms: SelectionTerm[] = []
  const searchTerm = props.searchTerm?.trim()

  if (searchTerm) {
    terms.push({
      id: `search-${searchTerm}`,
      text: `»${searchTerm}«`,
    })
  }

  props.labels?.forEach((label) => {
    terms.push({
      color: label.color,
      id: `label-${label.label}`,
      text: label.label,
    })
  })

  return terms
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

</script>

<template>
  <aside
    ref="detailView"
    class="detail-view"
    aria-label="Selection detail"
    @scroll.stop="handleDetailScroll"
    @touchmove.stop
    @wheel.stop
  >
    <section
      class="detail detail--selection"
      :class="{
        'detail--header-colored': Boolean(headerColor),
        'detail--header-compact': isHeaderCompact,
      }"
      :style="{
        ...selectionStyle,
        '--detail-compact-header-height': compactHeaderHeight,
      }"
    >
      <header class="detail__header">
        <div class="detail__header-inner">
          <div ref="compactHeaderContent" class="detail__headline-block">
            <ViewHeadline
              class="detail__headline"
              :title="title"
              :title-suffix="`(${records.length})`"
            />

            <p v-if="selectionTerms.length > 0" class="selection-view__terms">
              <span
                v-for="(term, index) in selectionTerms"
                :key="term.id"
                class="selection-view__term"
                :style="{ '--selection-term-color': term.color ?? 'rgba(var(--color-text-rgb), 0.74)' }"
              >
                <span
                  class="selection-view__term-text"
                  :class="{ 'selection-view__term-text--colored': term.color }"
                >
                  {{ term.text }}
                </span>
                <span v-if="index < selectionTerms.length - 1">,</span>
              </span>
            </p>
          </div>
        </div>
      </header>

      <section class="detail__content" aria-label="Selected statements">
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
          :show-author="true"
          :show-context-button="true"
          @badge-hover-change="setBadgeHovered(statement.id, $event)"
          @context-hover-change="setContextHovered(statement.id, $event)"
        />
      </section>
    </section>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/SelectionView.css';
</style>
