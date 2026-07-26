<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { useCompactStickyHeader } from '../../composables/useCompactStickyHeader'
import { useDetailStatementScroll } from '../../composables/useDetailStatementScroll'
import type { IntentRecord } from '../../types/intentData'
import StatementContainer from './StatementContainer.vue'
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
const {
  clearFocusedStatement,
  focusedStatementId,
} = useDetailStatementScroll({
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

function clearFocusOnButtonInteraction(event: Event) {
  if (event.target instanceof Element && event.target.closest('button')) {
    clearFocusedStatement()
  }
}

</script>

<template>
  <aside
    ref="detailView"
    class="detail-view"
    aria-label="Selection detail"
    @focusin.capture="clearFocusOnButtonInteraction"
    @pointerdown.capture="clearFocusOnButtonInteraction"
    @scroll.stop="handleDetailScroll"
    @touchmove.stop="clearFocusedStatement"
    @wheel.stop="clearFocusedStatement"
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

      <StatementContainer
        aria-label="Selected statements"
        :focused-statement-id="focusedStatementId"
        :records="records"
        :show-author="true"
        @interaction-start="clearFocusedStatement"
      />
    </section>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/SelectionView.css';
</style>
