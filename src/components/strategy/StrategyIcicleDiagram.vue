<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import type {
  StrategyIcicleGroup,
  StrategyIcicleSegment,
  StrategyMainLabelSelection,
} from '../../types/strategyIcicle'
import { intentTaxonomy, type IntentTaxonomyGroup } from '../../types/intentTaxonomy'
import { intentLabelNames, taxonomyButtonColors } from '../../utils/intentLabels'
import { getPercent } from '../../utils/numbers'
import { getStrategyIcicleSegmentState } from '../../utils/strategyIcicle'
import StrategyIcicleButton from './StrategyIcicleButton.vue'
import MirroredLineGrid from './MirroredLineGrid.vue'
import VerticalScale from './VerticalScale.vue'

const props = defineProps<{
  records: IntentRecord[]
}>()

const emit = defineEmits<{
  mainLabelClick: [selection: StrategyMainLabelSelection]
  segmentClick: [segment: StrategyIcicleSegment]
}>()

const maxStatementsPerSide = 160
const countStep = 20
const verticalScaleSteps = 5
const hoveredSegment = ref<StrategyIcicleSegment | null>(null)
const selectedSegmentId = ref<IntentLabelKey | null>(null)

const groups = computed(() => createIcicleGroups())

const subSegments = computed(() => groups.value.flatMap((group) => group.children))

const activeSegment = computed(
  () =>
    hoveredSegment.value ??
    groups.value
      .flatMap((group) => [group.main, ...group.children])
      .find((segment) => segment.id === selectedSegmentId.value) ??
    null,
)

function createIcicleGroups() {
  const countedGroups = countTaxonomyGroups()
  const totalOccurrences = countedGroups.reduce((total, item) => total + item.occurrences, 0)

  return countedGroups.map(({ group, occurrences }) => {
    const groupHeightPercent = getPercent(occurrences, totalOccurrences)
    return createIcicleGroup(group, occurrences, groupHeightPercent, totalOccurrences)
  })
}

function countTaxonomyGroups() {
  return intentTaxonomy.map((group) => ({
    occurrences: group.childLabels.reduce((total, label) => total + countLabelOccurrences(label), 0),
    group,
  }))
}

function createIcicleGroup(
  group: IntentTaxonomyGroup,
  occurrences: number,
  heightPercent: number,
  totalOccurrences: number,
): StrategyIcicleGroup {
  const color = taxonomyButtonColors[group.parentLabel] ?? 'var(--color-neutral)'

  return {
    children: createSubSegments(group, color, totalOccurrences),
    color,
    heightPercent,
    labelKey: group.parentLabel,
    main: createMainSegment(group, color, occurrences),
  }
}

function createSubSegments(
  group: IntentTaxonomyGroup,
  color: string,
  totalOccurrences: number,
) {
  return group.childLabels.map((label) => {
    const occurrences = countLabelOccurrences(label)
    const heightPercent = getPercent(occurrences, totalOccurrences)

    return createSubSegment(group.parentLabel, label, color, occurrences, heightPercent)
  })
}

function createMainSegment(
  group: IntentTaxonomyGroup,
  color: string,
  occurrences: number,
): StrategyIcicleSegment {
  return {
    color,
    description: group.description,
    depth: 'main',
    groupId: group.parentLabel,
    heightPercent: 100,
    id: group.parentLabel,
    label: group.label,
    occurrences,
    widthPercent: getPercent(occurrences, maxStatementsPerSide),
  }
}

function createSubSegment(
  groupId: IntentLabelKey,
  label: IntentLabelKey,
  color: string,
  occurrences: number,
  heightPercent: number,
): StrategyIcicleSegment {
  return {
    color,
    depth: 'sub',
    groupId,
    heightPercent,
    id: label,
    label: intentLabelNames[label],
    occurrences,
    widthPercent: getPercent(occurrences, maxStatementsPerSide),
  }
}

function countLabelOccurrences(label: IntentLabelKey) {
  return props.records.filter((record) => record[label] === 'yes').length
}

function handleClick(segment: StrategyIcicleSegment) {
  const nextSelectedId = selectedSegmentId.value === segment.id ? null : segment.id
  selectedSegmentId.value = nextSelectedId
  emit('segmentClick', segment)

  if (segment.depth === 'main') {
    emit('mainLabelClick', {
      color: segment.color,
      description: segment.description ?? '',
      groupId: segment.groupId,
      id: segment.id,
      label: segment.label,
      selected: nextSelectedId === segment.id,
    })
  }
}

function clearSelection() {
  selectedSegmentId.value = null
  hoveredSegment.value = null
}

defineExpose({
  clearSelection,
})

function shouldShowSubLabel(segment: StrategyIcicleSegment) {
  const activeHover = hoveredSegment.value

  if (activeHover !== null) {
    return activeHover.groupId === segment.groupId || segment.heightPercent >= 3
  }

  return segment.heightPercent >= 3
}
</script>

<template>
  <article class="strategy-icicle" aria-label="Pattern label distribution">
    <MirroredLineGrid
      :max-value="maxStatementsPerSide"
      scale-label="Number of Statements"
      :step-size="countStep"
    />

    <div class="strategy-icicle__diagram">
      <VerticalScale
        label="Percentage Distribution Across Patterns"
        :steps="verticalScaleSteps"
      />

      <div class="strategy-icicle__side strategy-icicle__side--left" aria-label="Main label counts">
        <div
          v-for="group in groups"
          :key="group.labelKey"
          class="strategy-icicle__main-row"
          :style="{ '--row-height': `${group.heightPercent}%` }"
        >
          <StrategyIcicleButton
            v-model:hovered-segment="hoveredSegment"
            :active-segment="activeSegment"
            align="left"
            :aria-label="`${group.main.label}: ${group.main.occurrences}`"
            :label="group.main.label"
            :segment="group.main"
            :selected="selectedSegmentId === group.main.id"
            @select="handleClick(group.main)"
          />
        </div>
      </div>

      <div class="strategy-icicle__side strategy-icicle__side--right" aria-label="Sublabel counts">
        <div
          v-for="child in subSegments"
          :key="child.id"
          class="strategy-icicle__sub-row"
          :class="`strategy-icicle__sub-row--${getStrategyIcicleSegmentState(child, activeSegment)}`"
          :style="{ '--row-height': `${child.heightPercent}%` }"
        >
          <StrategyIcicleButton
            v-model:hovered-segment="hoveredSegment"
            :active-segment="activeSegment"
            align="right"
            :aria-label="`${child.label}: ${child.occurrences}`"
            :segment="child"
            :selected="selectedSegmentId === child.id"
            @select="handleClick(child)"
          />
          <span
            v-if="shouldShowSubLabel(child)"
            class="strategy-icicle__sub-label"
          >
            {{ child.label }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyIcicleDiagram.css';
</style>
