<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PatternLabelKey, IntentRecord } from '../../types/intentData'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import type { StrategyIcicleSegment } from '../../types/strategyIcicle'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import { intentLabelNames, strategyColors } from '../../utils/intentLabels'
import { getPercent } from '../../utils/numbers'
import {
  getStrategyIcicleRootId,
  isMainStrategyIcicleSegment,
} from '../../utils/strategyIcicle'
import StrategyIcicleButton from './StrategyIcicleButton.vue'
import VerticalScale from '../common/VerticalScale.vue'

const props = defineProps<{
  records: IntentRecord[]
}>()

const emit = defineEmits<{
  gridMarkerChange: [marker: MirroredLineGridMarker | null]
  segmentClick: [segment: StrategyIcicleSegment]
}>()

const maxStatementsPerSide = 160
const verticalScaleSteps = 5
const hoveredSegment = ref<StrategyIcicleSegment | null>(null)
const selectedSegmentId = ref<PatternLabelKey | null>(null)

const mainSegments = computed(() => createMainSegments())

const subSegments = computed(() => mainSegments.value.flatMap((segment) => segment.children))

const allSegments = computed(() =>
  mainSegments.value.flatMap((segment) => [segment, ...segment.children]),
)

const activeSegment = computed(
  () =>
    hoveredSegment.value ??
    allSegments.value.find((segment) => segment.id === selectedSegmentId.value) ??
    null,
)

function createGridMarker(segment: StrategyIcicleSegment): MirroredLineGridMarker {
  return {
    label: `${segment.occurrences}`,
    side: isMainStrategyIcicleSegment(segment) ? 'left' : 'right',
    value: segment.occurrences,
  }
}

function createMainSegments() {
  const countedGroups = countTaxonomyGroups()
  const totalOccurrences = countedGroups.reduce((total, item) => total + item.occurrences, 0)

  return countedGroups.map(({ group, occurrences }) => {
    const color = strategyColors[group.parentLabel] ?? 'var(--color-neutral)'
    const mainSegment = createSegment({
      children: [],
      color,
      description: group.description,
      heightPercent: getPercent(occurrences, totalOccurrences),
      id: group.parentLabel,
      label: group.label,
      occurrences,
      parent: null,
    })

    mainSegment.children = group.childLabels.map((label) => {
      const childOccurrences = countLabelOccurrences(label)

      return createSegment({
        children: [],
        color,
        heightPercent: getPercent(childOccurrences, totalOccurrences),
        id: label,
        label: intentLabelNames[label],
        occurrences: childOccurrences,
        parent: mainSegment,
      })
    })

    return mainSegment
  })
}

function countTaxonomyGroups() {
  return intentTaxonomy.map((group) => ({
    occurrences: group.childLabels.reduce((total, label) => total + countLabelOccurrences(label), 0),
    group,
  }))
}

function createSegment(
  segment: Omit<StrategyIcicleSegment, 'widthPercent'>,
): StrategyIcicleSegment {
  return {
    ...segment,
    widthPercent: getPercent(segment.occurrences, maxStatementsPerSide),
  }
}

function countLabelOccurrences(label: PatternLabelKey) {
  return props.records.filter((record) => record[label] === 'yes').length
}

function handleHover(segment: StrategyIcicleSegment) {
  hoveredSegment.value = segment
  emit('gridMarkerChange', createGridMarker(segment))
}

function handleLeave(segment: StrategyIcicleSegment) {
  if (hoveredSegment.value?.id === segment.id) {
    hoveredSegment.value = null
    emit('gridMarkerChange', null)
  }
}

function handleClick(segment: StrategyIcicleSegment) {
  const nextSelectedId = selectedSegmentId.value === segment.id ? null : segment.id
  selectedSegmentId.value = nextSelectedId
  emit('segmentClick', segment)
}

function clearSelection() {
  selectedSegmentId.value = null
  hoveredSegment.value = null
  emit('gridMarkerChange', null)
}

defineExpose({
  clearSelection,
})

function shouldShowSubLabel(segment: StrategyIcicleSegment) {
  const activeHover = hoveredSegment.value
  const isValidSize = segment.heightPercent >= 3
  if (activeHover !== null) {
    return getStrategyIcicleRootId(activeHover) === getStrategyIcicleRootId(segment) || isValidSize
  }
  return isValidSize
}
</script>

<template>
  <article class="strategy-icicle" aria-label="Pattern label distribution">
    <div class="strategy-icicle__diagram">
      <VerticalScale
        label="Percentage Distribution Across Patterns"
        :steps="verticalScaleSteps"
      />

      <div class="strategy-icicle__side strategy-icicle__side--left" aria-label="Main label counts">
        <StrategyIcicleButton
          v-for="mainSegment in mainSegments"
          :key="mainSegment.id"
          :active-segment="activeSegment"
          align="left"
          :accessibility-label="`${mainSegment.label}: ${mainSegment.occurrences}`"
          :label="mainSegment.label"
          :segment="mainSegment"
          :selected="selectedSegmentId === mainSegment.id"
          @hover="handleHover"
          @leave="handleLeave"
          @select="handleClick"
        />
      </div>

      <div class="strategy-icicle__side strategy-icicle__side--right" aria-label="Sublabel counts">
        <StrategyIcicleButton
          v-for="child in subSegments"
          :key="child.id"
          :active-segment="activeSegment"
          align="right"
          :accessibility-label="`${child.label}: ${child.occurrences}`"
          :segment="child"
          :selected="selectedSegmentId === child.id"
          @hover="handleHover"
          @leave="handleLeave"
          @select="handleClick"
        >
          <span
            v-if="shouldShowSubLabel(child)"
            class="strategy-icicle__sub-label"
          >
            {{ child.label }}
          </span>
        </StrategyIcicleButton>
      </div>
    </div>
  </article>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyIcicleDiagram.css';
</style>
