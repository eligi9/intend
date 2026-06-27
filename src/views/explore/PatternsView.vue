<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import MirroredLineGrid from '../../components/common/MirroredLineGrid.vue'
import StrategyIcicleDiagram from '../../components/strategy/StrategyIcicleDiagram.vue'
import StrategySubLabelOverlay from '../../components/strategy/StrategySubLabelOverlay.vue'
import { useStatementStore } from '../../stores/statementStore'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'

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

    <header class="strategy-view__header">
      <div class="strategy-view__header-copy">
        <h2>Patterns</h2>
        <p>How are the pattern labels distributed?</p>
      </div>
    </header>

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

    <Transition name="strategy-main-overlay">
      <aside
        v-if="selectedSegment && selectedSegment.parent === null"
        class="strategy-view__main-overlay"
        :style="{ '--strategy-main-overlay-accent': selectedSegment.color }"
        aria-label="Main label details"
      >
        <header class="strategy-view__main-overlay-header">
          <h3>{{ selectedSegment.label }}</h3>
          <p class="strategy-view__main-overlay-description">
            {{ selectedSegment.description }}
          </p>
        </header>
      </aside>
    </Transition>

    <StrategySubLabelOverlay
      :segment="selectedSegment?.parent ? selectedSegment : null"
      @close="closeOverlay"
    />
  </section>
</template>

<style scoped>
@import '../../css/views/explore/PatternsView.css';
</style>
