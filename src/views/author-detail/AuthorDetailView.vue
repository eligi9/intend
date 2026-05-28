<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AuthorTimelineP5 from '../../components/author-timeline/AuthorTimelineP5.vue'
import AuthorPortrait from '../../components/author-portrait/AuthorPortrait.vue'
import FilterButton from '../../components/filter-button/FilterButton.vue'
import StatementCard from '../../components/statement-card/StatementCard.vue'
import { useAuthorStore } from '../../stores/authorStore'
import type { IntentLabelKey } from '../../types/intentData'
import { toggleArrayItem } from '../../utils/arrays'
import { taxonomyButtonColors } from '../../utils/intentLabels'

const props = defineProps<{
  authorId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)
const selectedTimelineLabels = ref<IntentLabelKey[]>([])
const stageRef = ref<HTMLElement | null>(null)
const portraitRef = ref<HTMLElement | null>(null)
const canvasOffset = ref('calc(var(--author-detail-portrait-size) / 2)')
const canvasHeight = ref('clamp(18rem, 38vw, 28rem)')
let stageResizeObserver: ResizeObserver | null = null

const author = computed(
  () => authorInstances.value.find((authorInstance) => authorInstance.id === props.authorId) ?? null,
)
const strategyBadges = computed(() =>
  author.value
    ? author.value.usedTopLevelStrategies.map((strategy) => ({
        ...strategy,
        color: taxonomyButtonColors[strategy.id] ?? '#858b94',
      }))
    : [],
)
const ageLabel = computed(() => (author.value?.age === null ? 'unknown' : author.value?.age ?? 'unknown'))
const sexLabel = computed(() => {
  if (author.value?.gender === 'female') return 'female'
  if (author.value?.gender === 'male') return 'male'
  return 'unknown'
})

function toggleTimelineLabel(label: IntentLabelKey) {
  selectedTimelineLabels.value = toggleArrayItem(selectedTimelineLabels.value, label)
}

function updateCanvasOffset() {
  if (!stageRef.value || !portraitRef.value) return

  const stageBounds = stageRef.value.getBoundingClientRect()
  const portraitBounds = portraitRef.value.getBoundingClientRect()
  const portraitCenter = portraitBounds.top - stageBounds.top + portraitBounds.height / 2
  const sketchBottom = window.innerHeight * 0.58
  const sketchHeight = sketchBottom - (stageBounds.top + portraitCenter)

  canvasOffset.value = `${Math.max(0, Math.round(portraitCenter))}px`
  canvasHeight.value = `${Math.max(260, Math.round(sketchHeight))}px`
}

onMounted(async () => {
  await nextTick()
  updateCanvasOffset()

  stageResizeObserver = new ResizeObserver(updateCanvasOffset)

  if (stageRef.value) stageResizeObserver.observe(stageRef.value)
  if (portraitRef.value) stageResizeObserver.observe(portraitRef.value)

  window.addEventListener('resize', updateCanvasOffset)
})

watch(author, async () => {
  await nextTick()
  updateCanvasOffset()
})

onBeforeUnmount(() => {
  stageResizeObserver?.disconnect()
  window.removeEventListener('resize', updateCanvasOffset)
})
</script>

<template>
  <section class="author-detail-view">
    <button
      type="button"
      class="author-detail-view__close"
      aria-label="Autor Detailansicht schliessen"
      @click="emit('close')"
    >
      X
    </button>

    <article v-if="author" class="author-detail">
      <section
        ref="stageRef"
        class="author-detail__stage"
        :style="{
          '--author-detail-canvas-offset': canvasOffset,
          '--author-detail-canvas-height': canvasHeight,
        }"
        aria-label="Autor Timeline Uebersicht"
      >
        <header class="author-detail__hero">
          <span ref="portraitRef" class="author-detail__portrait-anchor">
            <AuthorPortrait :author="author" :size="168" />
          </span>

          <div class="author-detail__intro">
            <h2>{{ author.name }}</h2>
            <p>{{ author.position ?? 'Position unbekannt' }}</p>

            <dl class="author-detail__profile" aria-label="Autor Steckbrief">
              <div>
                <dt>Age</dt>
                <dd>{{ ageLabel }}</dd>
              </div>
              <div>
                <dt>Sex</dt>
                <dd>{{ sexLabel }}</dd>
              </div>
              <div>
                <dt>Party</dt>
                <dd>{{ author.party ?? 'unknown' }}</dd>
              </div>
              <div>
                <dt>Statements</dt>
                <dd>{{ author.statementCount }}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section class="author-detail__timeline" aria-label="Interaktive Timeline">
          <AuthorTimelineP5
            :statements="author.statements"
            :selected-labels="selectedTimelineLabels"
          />
        </section>

        <section class="author-detail__timeline-filters" aria-label="Timeline Strategie Filter">
          <FilterButton
            v-for="strategy in strategyBadges"
            :key="strategy.id"
            :label="strategy.label"
            :color="strategy.color"
            :active="selectedTimelineLabels.includes(strategy.labelKey)"
            @click="toggleTimelineLabel(strategy.labelKey)"
          />
        </section>
      </section>

      <section class="author-detail__statements" aria-label="Statements">
        <StatementCard
          v-for="statement in author.statements"
          :key="statement.id"
          :record="statement"
          :show-heading="false"
          compact-heading
        />
      </section>
    </article>

    <div v-else class="author-detail-view__empty">
      <strong>Autor nicht gefunden</strong>
      <button type="button" @click="emit('close')">Schliessen</button>
    </div>
  </section>
</template>

<style scoped>
@import './AuthorDetailView.css';
</style>
