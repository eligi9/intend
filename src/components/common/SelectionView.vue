<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { useCompactStickyHeader } from '../../composables/useCompactStickyHeader'
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
  labels?: SelectionFilterLabel[]
  searchTerm?: string
  title: string
  records: readonly IntentRecord[]
}>()

const hoveredBadgeStatementId = ref<string | null>(null)
const hoveredContextStatementId = ref<string | null>(null)
const {
  compactHeaderContent,
  compactHeaderHeight,
  handleScroll: handleDetailScroll,
  isHeaderCompact,
} = useCompactStickyHeader()

const emit = defineEmits<{
  close: []
}>()

usePageScrollLock()

const selectionTitle = computed(() => `${props.title} (${props.records.length})`)
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
    class="detail-view"
    aria-label="Selection detail"
    @scroll.stop="handleDetailScroll"
    @touchmove.stop
    @wheel.stop
  >
    <section
      class="detail detail--selection"
      :class="{ 'detail--header-compact': isHeaderCompact }"
      :style="{ '--detail-compact-header-height': compactHeaderHeight }"
    >
      <header class="detail__header">
        <div class="detail__header-inner">
          <div ref="compactHeaderContent" class="detail__headline-block">
            <ViewHeadline
              class="detail__headline"
              :title="selectionTitle"
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
          :class="{
            'detail__statement--dimmed':
              (hoveredBadgeStatementId !== null && hoveredBadgeStatementId !== statement.id) ||
              (hoveredContextStatementId !== null && hoveredContextStatementId !== statement.id),
          }"
          :record="statement"
          :show-context-button="true"
          @badge-hover-change="setBadgeHovered(statement.id, $event)"
          @context-hover-change="setContextHovered(statement.id, $event)"
        />
      </section>
    </section>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/DetailView.css';
</style>
