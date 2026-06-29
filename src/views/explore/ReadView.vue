<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import StatementCard from '../../components/common/StatementCard.vue'
import SquareArrowButton from '../../components/common/SquareArrowButton.vue'
import ViewHeadline from '../../components/common/ViewHeadline.vue'
import { useHorizontalTrackpadSwipe } from '../../composables/useHorizontalTrackpadSwipe'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { useStatementStore } from '../../stores/statementStore'
import type { IntentLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { taxonomyButtonColors } from '../../utils/intentLabels'
import { toggleArrayItem } from '../../utils/arrays'

const store = useStatementStore()
const { currentRecord, currentRecordPosition, filters, sectors } = storeToRefs(store)
const readView = ref<HTMLElement | null>(null)
const swipeStart = ref<{ x: number; y: number } | null>(null)
const animatedTotal = ref(currentRecordPosition.value.total)
const countFeedbackKey = ref(0)
const countFeedbackTone = ref<'neutral' | 'increase' | 'decrease'>('neutral')

let countAnimationFrame = 0
let countFeedbackTimeout = 0

usePageScrollLock()

const sectorFilterLabels = computed(() =>
  sectors.value.map((sector) => ({
    active: filters.value.sectors.includes(sector),
    color: 'var(--color-neutral)',
    key: sector,
    label: sector,
  })),
)
const patternFilterLabels = computed(() =>
  intentTaxonomy.map((group) => ({
    active: filters.value.labelsAll.includes(group.parentLabel),
    color: taxonomyButtonColors[group.parentLabel] ?? 'var(--color-neutral)',
    key: group.parentLabel,
    label: group.label,
  })),
)

useHorizontalTrackpadSwipe(readView, (direction) => {
  if (direction === 'left') {
    store.nextRecord()
    return
  }

  store.previousRecord()
})

function toggleSector(sector: string) {
  store.setSectors(filters.value.sectors.includes(sector) ? [] : [sector])
}

function toggleOverLabel(label: IntentLabelKey) {
  store.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function toggleOverLabelByKey(label: string) {
  toggleOverLabel(label as IntentLabelKey)
}

function animateTotalCount(from: number, to: number) {
  cancelAnimationFrame(countAnimationFrame)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    animatedTotal.value = to
    return
  }

  const startedAt = performance.now()
  const duration = 360

  function tick(now: number) {
    const progress = Math.min((now - startedAt) / duration, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)

    animatedTotal.value = Math.round(from + (to - from) * easedProgress)

    if (progress < 1) {
      countAnimationFrame = requestAnimationFrame(tick)
    }
  }

  countAnimationFrame = requestAnimationFrame(tick)
}

watch(
  () => currentRecordPosition.value.total,
  (total, previousTotal) => {
    if (previousTotal === undefined) {
      animatedTotal.value = total
      return
    }

    countFeedbackTone.value =
      total > previousTotal ? 'increase' : total < previousTotal ? 'decrease' : 'neutral'
    countFeedbackKey.value += 1

    animateTotalCount(animatedTotal.value, total)

    window.clearTimeout(countFeedbackTimeout)
    countFeedbackTimeout = window.setTimeout(() => {
      countFeedbackTone.value = 'neutral'
    }, 420)
  },
)

onBeforeUnmount(() => {
  cancelAnimationFrame(countAnimationFrame)
  window.clearTimeout(countFeedbackTimeout)
})

function startStatementSwipe(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return

  swipeStart.value = {
    x: touch.clientX,
    y: touch.clientY,
  }
}

function finishStatementSwipe(event: TouchEvent) {
  if (!swipeStart.value) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - swipeStart.value.x
  const deltaY = touch.clientY - swipeStart.value.y
  swipeStart.value = null

  if (Math.abs(deltaX) < 56 || Math.abs(deltaY) > 72) return

  if (deltaX < 0) {
    store.nextRecord()
    return
  }

  store.previousRecord()
}

</script>

<template>
  <section ref="readView" class="read-view">
    <div class="read-top-area">
      <header class="read-toolbar">
        <ViewHeadline title="Statements" />
      </header>

      <div v-if="currentRecord" class="read-actions">
        <SquareArrowButton
          direction="left"
          aria-label="Vorheriges Statement"
          @click="store.previousRecord"
        />
        <div class="read-count">
          <strong>{{ currentRecordPosition.current }}</strong>
          <span
            :key="countFeedbackKey"
            class="read-count__total"
            :class="`read-count__total--${countFeedbackTone}`"
            aria-live="polite"
          >
            / {{ animatedTotal }}
          </span>
        </div>
        <SquareArrowButton
          direction="right"
          aria-label="Nächstes Statement"
          @click="store.nextRecord"
        />
      </div>
    </div>

    <section class="read-filter-overlay" aria-label="Statement Filter">
      <section class="read-filters">
        <div class="read-search-filter">
          <small>Search</small>
          <input
            :value="filters.query"
            type="search"
            placeholder="Autor, Kontext oder Statement"
            @input="store.setQuery(($event.target as HTMLInputElement).value)"
          />
        </div>

        <FilterButtonContainer
          title="Sector"
          :labels="sectorFilterLabels"
          @select="toggleSector"
        />

        <FilterButtonContainer
          title="Mobilization Pattern"
          :labels="patternFilterLabels"
          @select="toggleOverLabelByKey"
        />
      </section>
    </section>

    <div class="read-bottom-area">
      <StatementCard
        v-if="currentRecord"
        :record="currentRecord"
        meta-variant="full"
        @touchstart.passive="startStatementSwipe"
        @touchend.passive="finishStatementSwipe"
      />

      <div v-else class="empty-state">
        <strong>Keine Statements gefunden</strong>
        <span>Filter zurücksetzen oder Suchbegriff ändern.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/ReadView.css';
</style>
