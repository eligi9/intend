<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { intentLabelNames, taxonomyButtonColors } from '../utils/intentLabels'

const props = defineProps<{
  records: IntentRecord[]
}>()

const emit = defineEmits<{
  mainLabelClick: [selection: StrategyMainLabelSelection]
  segmentClick: [segment: StrategyIcicleSegment]
  segmentHover: [segment: StrategyIcicleSegment | null]
}>()

interface StrategyMainLabelChild {
  color: string
  count: number
  id: IntentLabelKey
  label: string
  sharePercent: number
}

interface StrategyMainLabelSelection {
  children: StrategyMainLabelChild[]
  color: string
  count: number
  description: string
  groupId: string
  id: IntentLabelKey
  label: string
  selected: boolean
}

interface StrategyIcicleSegment {
  color: string
  count: number
  description?: string
  depth: 'main' | 'sub'
  groupId: string
  heightPercent: number
  id: IntentLabelKey
  label: string
  startPercent: number
  widthPercent: number
}

interface StrategyIcicleGroup {
  children: StrategyIcicleSegment[]
  color: string
  heightPercent: number
  labelKey: IntentLabelKey
  main: StrategyIcicleSegment
}

type SegmentTone = 'active' | 'dimmed' | 'neutral' | 'related'

const maxStatementsPerSide = 160
const countStep = 20
const verticalScaleSegments = Array.from({ length: 5 }, (_, index) => ({
  id: index,
  label: `${index * 20}%`,
  bottomLabel: index === 4 ? '100%' : '',
}))
const hoveredSegment = ref<StrategyIcicleSegment | null>(null)
const selectedSegmentId = ref<IntentLabelKey | null>(null)
const diagramElement = ref<HTMLElement | null>(null)

const horizontalScaleAreas = computed(() =>
  Array.from({ length: (maxStatementsPerSide * 2) / countStep }, (_, index) => {
    const startValue = -maxStatementsPerSide + index * countStep
    const labelValue = Math.abs(startValue)

    return {
      hasAxisTitle: startValue === maxStatementsPerSide - countStep,
      id: startValue,
      label: labelValue === 0 || labelValue === maxStatementsPerSide ? '' : `${labelValue}`,
      labelWidth: `${String(labelValue).length}ch`,
      side: startValue < 0 ? 'left' : 'right',
    }
  }),
)

const groups = computed<StrategyIcicleGroup[]>(() => {
  const mainCounts = intentTaxonomy.map((group) => ({
    group,
    count: group.childLabels.reduce((total, label) => total + countLabel(label), 0),
  }))
  const mainTotal = mainCounts.reduce((total, item) => total + item.count, 0)
  let childStartPercent = 0
  let mainStartPercent = 0

  return mainCounts.map(({ group, count }) => {
    const color = taxonomyButtonColors[group.parentLabel] ?? 'var(--color-neutral)'
    const childCounts = group.childLabels.map((label) => ({
      count: countLabel(label),
      label,
    }))
    const groupId = group.parentLabel
    const groupHeightPercent = getPercent(count, mainTotal)
    const groupStartPercent = mainStartPercent
    mainStartPercent += groupHeightPercent

    return {
      children: childCounts.map(({ count: childCount, label }) => {
        const heightPercent = getPercent(childCount, mainTotal)
        const startPercent = childStartPercent
        childStartPercent += heightPercent

        return {
          color,
          count: childCount,
          depth: 'sub' as const,
          groupId,
          heightPercent,
          id: label,
          label: intentLabelNames[label],
          startPercent,
          widthPercent: getPercent(childCount, maxStatementsPerSide),
        }
      }),
      color,
      heightPercent: groupHeightPercent,
      labelKey: groupId,
      main: {
        color,
        count,
        description: group.description,
        depth: 'main' as const,
        groupId,
        heightPercent: 100,
        id: group.parentLabel,
        label: group.label,
        startPercent: groupStartPercent,
        widthPercent: getPercent(count, maxStatementsPerSide),
      },
    }
  })
})

const subSegments = computed(() => groups.value.flatMap((group) => group.children))

const activeSegment = computed(
  () =>
    hoveredSegment.value ??
    groups.value
      .flatMap((group) => [group.main, ...group.children])
      .find((segment) => segment.id === selectedSegmentId.value) ??
    null,
)

const hoverIndicator = computed(() => {
  const segment = hoveredSegment.value
  const diagram = diagramElement.value

  if (segment === null || diagram === null) {
    return null
  }

  const rect = diagram.getBoundingClientRect()
  const xPercent =
    segment.depth === 'main' ? 50 - segment.widthPercent / 2 : 50 + segment.widthPercent / 2

  return {
    count: segment.count,
    leftPx: rect.left + (rect.width * xPercent) / 100,
  }
})

function countLabel(label: IntentLabelKey) {
  return props.records.filter((record) => record[label] === 'yes').length
}

function getPercent(value: number, total: number) {
  return total > 0 ? Math.min(100, (value / total) * 100) : 0
}

function handleHover(segment: StrategyIcicleSegment) {
  hoveredSegment.value = segment
  emit('segmentHover', segment)
}

function handleLeave() {
  hoveredSegment.value = null
  emit('segmentHover', null)
}

function handleClick(segment: StrategyIcicleSegment) {
  const nextSelectedId = selectedSegmentId.value === segment.id ? null : segment.id
  selectedSegmentId.value = nextSelectedId
  emit('segmentClick', segment)

  if (segment.depth === 'main') {
    const group = groups.value.find((item) => item.labelKey === segment.groupId)
    emit('mainLabelClick', {
      children:
        group?.children.map((child) => ({
          color: child.color,
          count: child.count,
          id: child.id,
          label: child.label,
          sharePercent: getPercent(child.count, Math.max(segment.count, 1)),
        })) ?? [],
      color: segment.color,
      count: segment.count,
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

function getSegmentTone(segment: StrategyIcicleSegment): SegmentTone {
  const active = activeSegment.value

  if (active === null) {
    return 'neutral'
  }

  if (
    active.id === segment.id ||
    (active.depth === 'sub' && segment.depth === 'main' && active.groupId === segment.groupId) ||
    (active.depth === 'main' && active.groupId === segment.groupId)
  ) {
    return 'active'
  }

  return active.groupId === segment.groupId ? 'related' : 'dimmed'
}

function getSegmentToneClass(segment: StrategyIcicleSegment) {
  return `strategy-icicle__tone--${getSegmentTone(segment)}`
}

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
    <div class="strategy-icicle__background" aria-hidden="true">
      <div
        v-for="area in horizontalScaleAreas"
        :key="area.id"
        class="strategy-icicle__background-area"
        :class="{
          'strategy-icicle__background-area--center': area.id === 0,
          'strategy-icicle__background-area--right': area.side === 'right',
        }"
      >
        <span
          v-if="area.label"
          class="strategy-icicle__background-label"
          :class="{
            'strategy-icicle__background-label--axis-anchor': area.hasAxisTitle,
          }"
          :style="{ '--axis-title-value-width': area.labelWidth }"
        >
          <span v-if="area.hasAxisTitle" class="strategy-icicle__background-title">
            Number of Statements
          </span>
          <span class="strategy-icicle__background-value">{{ area.label }}</span>
        </span>
      </div>
    </div>

    <div ref="diagramElement" class="strategy-icicle__diagram">
      <div class="strategy-icicle__vertical-scale" aria-hidden="true">
        <span class="strategy-icicle__vertical-scale-title">
          Percentage<br />
          Distribution<br />
          Across Patterns
        </span>
        <span
          v-for="segment in verticalScaleSegments"
          :key="segment.id"
          class="strategy-icicle__vertical-scale-segment"
        >
          <span class="strategy-icicle__vertical-scale-label">
            {{ segment.label }}
          </span>
          <span
            v-if="segment.bottomLabel"
            class="strategy-icicle__vertical-scale-label strategy-icicle__vertical-scale-label--bottom"
          >
            {{ segment.bottomLabel }}
          </span>
        </span>
      </div>

      <div class="strategy-icicle__side strategy-icicle__side--left" aria-label="Main label counts">
        <div
          v-for="group in groups"
          :key="group.labelKey"
          class="strategy-icicle__main-row"
          :style="{ '--row-height': `${group.heightPercent}%` }"
        >
          <button
            type="button"
            class="strategy-icicle__bar strategy-icicle__bar--main"
            :class="[
              getSegmentToneClass(group.main),
              { 'strategy-icicle__bar--selected': selectedSegmentId === group.main.id },
            ]"
            :style="{
              '--bar-color': group.color,
              '--bar-width': `${group.main.widthPercent}%`,
            }"
            :aria-label="`${group.main.label}: ${group.main.count}`"
            @click="handleClick(group.main)"
            @focus="handleHover(group.main)"
            @blur="handleLeave"
            @mouseenter="handleHover(group.main)"
            @mouseleave="handleLeave"
          >
            <span>{{ group.main.label }}</span>
          </button>
        </div>
      </div>

      <div class="strategy-icicle__side strategy-icicle__side--right" aria-label="Sublabel counts">
        <div
          v-for="child in subSegments"
          :key="child.id"
          class="strategy-icicle__sub-row"
          :class="getSegmentToneClass(child)"
          :style="{ '--row-height': `${child.heightPercent}%` }"
        >
          <button
            type="button"
            class="strategy-icicle__bar strategy-icicle__bar--sub"
            :class="[
              getSegmentToneClass(child),
              { 'strategy-icicle__bar--selected': selectedSegmentId === child.id },
            ]"
            :style="{
              '--bar-color': child.color,
              '--bar-width': `${child.widthPercent}%`,
            }"
            :aria-label="`${child.label}: ${child.count}`"
            @click="handleClick(child)"
            @focus="handleHover(child)"
            @blur="handleLeave"
            @mouseenter="handleHover(child)"
            @mouseleave="handleLeave"
          ></button>
          <span
            v-if="shouldShowSubLabel(child)"
            class="strategy-icicle__sub-label"
          >
            {{ child.label }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-if="hoverIndicator"
      class="strategy-icicle__hover-indicator"
      :style="{
        '--hover-indicator-left': `${hoverIndicator.leftPx}px`,
      }"
      aria-hidden="true"
    >
      <span class="strategy-icicle__hover-pill">{{ hoverIndicator.count }}</span>
    </div>
  </article>
</template>

<style scoped>
@import '../css/components/StrategyIcicleDiagram.css';
</style>
