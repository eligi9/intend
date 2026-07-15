<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import strategyTimelineEventsDataset from '../../../data/strategy-timeline-events.json'
import DetailView from '../../components/common/DetailView.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StrategyBeeswarmPlotP5 from '../../components/strategy/StrategyBeeswarmPlotP5.vue'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { IntentRecord } from '../../types/intentData'
import type {
  BeeswarmDisplayMode,
  HoveredTimelineStatement,
} from '../../types/strategyBeeswarm'
import type { TimelineEvent } from '../../types/timeline'
import { wrapTextAtCharacterLimit } from '../../utils/textWrap'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const { records } = storeToRefs(statementStore)
const timelineEvents = strategyTimelineEventsDataset.events as TimelineEvent[]
const beeswarmMode = ref<BeeswarmDisplayMode>('statements')
const hoveredStatement = ref<HoveredTimelineStatement | null>(null)
const selectedStatement = ref<IntentRecord | null>(null)

const selectedAuthor = computed(() =>
  selectedStatement.value ? authorStore.getAuthorInstance(selectedStatement.value.author) : null,
)
const selectedAuthorRecords = computed(() =>
  selectedAuthor.value
    ? statementStore.getStatementsForAuthor(selectedAuthor.value.name)
    : selectedStatement.value
      ? [selectedStatement.value]
      : [],
)

watch(beeswarmMode, () => {
  hoveredStatement.value = null
})

function showHoveredStatement(statement: HoveredTimelineStatement | null) {
  hoveredStatement.value = statement
}

function showAuthorDetail(statement: HoveredTimelineStatement | null) {
  if (!statement) return

  selectedStatement.value = statement.record
}

function closeAuthorDetail() {
  selectedStatement.value = null
}
</script>

<template>
  <section class="timeline-view" aria-label="Pattern timeline">
    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      subline="All coded statements over time, filterable by top-level pattern."
      title="Timeline"
      @select="emit('section-select', $event)"
    />

    <section class="timeline-view__content" aria-label="All statements timeline">
      <div class="timeline-view__plot">
        <StrategyBeeswarmPlotP5
          :events="timelineEvents"
          :mode="beeswarmMode"
          :statements="records"
          :selected-labels="[]"
          @statement-hover="showHoveredStatement"
          @statement-press="showAuthorDetail"
        />
      </div>

      <Transition name="timeline-view-statement-hover">
        <aside
          v-if="beeswarmMode === 'statements' && hoveredStatement"
          class="timeline-view__statement-hover"
          aria-label="Hovered statement"
        >
          <p>{{ wrapTextAtCharacterLimit(hoveredStatement.statement, 50) }}</p>
          <span>
            <strong class="timeline-view__statement-hover-author">{{ hoveredStatement.author }}</strong>
            · {{ hoveredStatement.date }}
            <template v-if="hoveredStatement.source">
              · {{ hoveredStatement.source }}
            </template>
          </span>
        </aside>
      </Transition>

      <div class="timeline-view__switch" aria-label="Timeline display">
        <button
          type="button"
          :class="{ 'timeline-view__switch-button--active': beeswarmMode === 'statements' }"
          @click="beeswarmMode = 'statements'"
        >
          Statements
        </button>
        <button
          type="button"
          :class="{ 'timeline-view__switch-button--active': beeswarmMode === 'strategies' }"
          @click="beeswarmMode = 'strategies'"
        >
          Patterns
        </button>
      </div>
    </section>

    <button
      v-if="selectedStatement"
      type="button"
      class="timeline-view__scrim"
      aria-label="Author detail view schliessen"
      @click="closeAuthorDetail"
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <DetailView
          v-if="selectedStatement"
          :author="selectedAuthor"
          :records="selectedAuthorRecords"
          :show-author-facts="true"
          @close="closeAuthorDetail"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/TimelineView.css';
</style>
