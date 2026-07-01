<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import MirroredLineGrid from '../../components/common/MirroredLineGrid.vue'
import SideOverlay from '../../components/common/SideOverlay.vue'
import ExploreHeader from '../../components/explore/ExploreHeader.vue'
import StrategyIcicleDiagram from '../../components/strategy/StrategyIcicleDiagram.vue'
import StrategySubLabelOverlay from '../../components/strategy/StrategySubLabelOverlay.vue'
import { useStatementStore } from '../../stores/statementStore'
import type { ExploreHeaderProps, ExploreViewSection } from '../../types/exploreView'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'

defineProps<ExploreHeaderProps>()

const emit = defineEmits<{
  'section-select': [section: ExploreViewSection]
}>()

const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)
const icicleDiagram = ref<{ clearSelection: () => void } | null>(null)
const maxStatementsPerSide = 160
const countStep = 20
const selectedSegment = ref<StrategyIcicleSegment | null>(null)
const gridMarker = ref<MirroredLineGridMarker | null>(null)

function handleSegmentClick(segment: StrategyIcicleSegment) {
  selectedSegment.value = selectedSegment.value?.id === segment.id ? null : segment
}

function closeOverlay() {
  selectedSegment.value = null
  gridMarker.value = null
  icicleDiagram.value?.clearSelection()
}
</script>

<template>
  <section class="strategy-view strategy-view--structure">
    <MirroredLineGrid
      :max-value="maxStatementsPerSide"
      :marker="gridMarker"
      scale-label="Number of Statements"
      :step-size="countStep"
    />

    <ExploreHeader
      :active-section="activeSection"
      :sections="sections"
      subline="How are the pattern labels distributed?"
      title="Patterns"
      @select="emit('section-select', $event)"
    />

    <div class="strategy-view__content">
      <section
        class="strategy-view__structure"
        aria-label="Pattern label structure"
      >
        <StrategyIcicleDiagram
          ref="icicleDiagram"
          :records="records"
          @grid-marker-change="gridMarker = $event"
          @segment-click="handleSegmentClick"
        />
      </section>
    </div>

    <SideOverlay
      :visible="Boolean(selectedSegment && selectedSegment.parent === null)"
      :title="selectedSegment?.label ?? ''"
      :text="selectedSegment?.description ?? ''"
      :color="selectedSegment?.color"
    />

    <StrategySubLabelOverlay
      :segment="selectedSegment?.parent ? selectedSegment : null"
      @close="closeOverlay"
    />
  </section>
</template>

<style scoped>
@import '../../css/views/explore/PatternsView.css';
</style>
