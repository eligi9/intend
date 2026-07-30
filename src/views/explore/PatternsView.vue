<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import MirroredLineGrid from '../../components/grid/MirroredLineGrid.vue'
import SelectionView from '../../components/detail/SelectionView.vue'
import SideOverlay from '../../components/overlay/SideOverlay.vue'
import AppHeader from '../../components/ui/AppHeader.vue'
import FilterBar from '../../components/ui/FilterBar.vue'
import IcicleDiagram from '../../components/diagram/IcicleDiagram.vue'
import { useStatementStore } from '../../stores/statementStore'
import type { AppHeaderProps, ExploreViewSection } from '../../types/exploreView'
import { intentSubLabelDescriptions } from '../../utils/intentTaxonomy'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import type { IcicleSegment } from '../../types/icicle'
import { isPatternActive, isPatternGroupActive } from '../../utils/intentRecordPatterns'

defineProps<AppHeaderProps>()

const emit = defineEmits<{
  'establishment-select': []
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const { filteredRecords } = storeToRefs(statementStore)
const maxStatementsPerSide = 80
const countStep = 10
const selectedSegment = ref<IcicleSegment | null>(null)
const detailSegment = ref<IcicleSegment | null>(null)
const gridMarker = ref<MirroredLineGridMarker | null>(null)
const selectedSubpatternDescription = computed(() => {
  const segment = selectedSegment.value
  if (!segment?.parent) return ''

  return (
    intentSubLabelDescriptions[segment.id] ??
    `${segment.label} describes statements where this pattern appears inside ${segment.parent.label}.`
  )
})
const detailRecords = computed(() => {
  const segment = detailSegment.value
  if (!segment) return []

  return filteredRecords.value.filter((record) =>
    segment.parent
      ? isPatternActive(record, segment.id)
      : isPatternGroupActive(record, segment.id),
  )
})
const detailLabels = computed(() => {
  const segment = detailSegment.value
  if (!segment) return []

  return (segment.parent ? [segment.parent, segment] : [segment]).map((label) => ({
    color: label.color,
    label: label.label,
  }))
})

function handleSegmentHover(segment: IcicleSegment | null) {
  if (detailSegment.value) return

  selectedSegment.value = segment
}

function handleSegmentClick(segment: IcicleSegment) {
  selectedSegment.value = null
  gridMarker.value = null
  detailSegment.value = segment
}

function closeOverlay() {
  selectedSegment.value = null
  gridMarker.value = null
}

function closeDetail() {
  detailSegment.value = null
}

</script>

<template>
  <section
    class="strategy-view strategy-view--structure"
  >
    <MirroredLineGrid
      class="strategy-view__line-grid"
      highlight-center
      :max-value="maxStatementsPerSide"
      :marker="gridMarker"
      scale-label="Number of Statements"
      :step-size="countStep"
    />

    <AppHeader
      :active-section="activeSection"
      :sections="sections"
      subline="Hover for an explanation. Click to explore statements containing the pattern."
      title="How are patterns organized?"
      @establishment-select="emit('establishment-select')"
      @select="emit('section-select', $event)"
    />

    <div class="strategy-view__content">
      <section
        class="strategy-view__structure"
        aria-label="Pattern label structure"
      >
        <IcicleDiagram
          :records="filteredRecords"
          @grid-marker-change="gridMarker = $event"
          @segment-click="handleSegmentClick"
          @segment-hover="handleSegmentHover"
        />
      </section>
    </div>

    <FilterBar
      aria-label="Pattern Filter"
      select-label="Filter patterns by content category"
      :z-index="200"
    />

    <SideOverlay
      :visible="Boolean(selectedSegment && selectedSegment.parent === null)"
      :title="selectedSegment?.label ?? ''"
      :text="selectedSegment?.description ?? ''"
      :color="selectedSegment?.color"
      @close="closeOverlay"
    />

    <SideOverlay
      :visible="Boolean(selectedSegment?.parent)"
      :title="selectedSegment?.label ?? ''"
      :text="selectedSubpatternDescription"
      :color="selectedSegment?.color"
      side="left"
      @close="closeOverlay"
    />

    <button
      v-if="detailSegment"
      type="button"
      class="strategy-view__scrim"
      aria-label="Pattern detail view schliessen"
      @click.stop="closeDetail"
      @mousedown.stop
      @mouseup.stop
      @pointerdown.stop
      @pointerup.stop
    />

    <Teleport to="body">
      <Transition name="detail-overlay">
        <SelectionView
          v-if="detailSegment"
          :labels="detailLabels"
          :records="detailRecords"
          title="Selection"
        />
      </Transition>
    </Teleport>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/PatternsView.css';
</style>
