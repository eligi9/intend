<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import type { PatternLabelKey, Statement } from '../../types/intentData'
import type { MirroredLineGridMarker } from '../../types/mirroredLineGrid'
import type { IcicleSegment } from '../../types/icicle'
import { intentTaxonomy } from '../../utils/intentTaxonomy'
import { intentLabelNames, strategyColors } from '../../utils/intentLabels'
import { isPatternActive, isPatternGroupActive } from '../../utils/intentRecordPatterns'
import { getPercent } from '../../utils/numbers'
import {
  getIcicleRootId,
  isMainIcicleSegment,
} from '../../utils/icicle'
import IcicleButton from '../button/IcicleButton.vue'
import VerticalScale from '../grid/VerticalScale.vue'

const props = defineProps<{
  records: Statement[]
}>()

const emit = defineEmits<{
  gridMarkerChange: [marker: MirroredLineGridMarker | null]
  segmentClick: [segment: IcicleSegment]
  segmentHover: [segment: IcicleSegment | null]
}>()

const maxStatementsPerSide = 80
const verticalScaleSteps = 5
const rootElement = ref<HTMLElement | null>(null)
const hoveredSegment = ref<IcicleSegment | null>(null)
let motionMedia: gsap.MatchMedia | null = null

const mainSegments = computed(() => createMainSegments())

const subSegments = computed(() => mainSegments.value.flatMap((segment) => segment.children))

const activeSegment = computed(() => hoveredSegment.value)

function createGridMarker(segment: IcicleSegment): MirroredLineGridMarker {
  return {
    label: `${segment.occurrences}`,
    side: isMainIcicleSegment(segment) ? 'left' : 'right',
    value: segment.occurrences,
  }
}

function createMainSegments() {
  const subLabelOccurrences = new Map(
    intentTaxonomy.flatMap((group) =>
      group.childLabels.map((label) => [label, countLabelOccurrences(label)] as const),
    ),
  )
  const countedGroups = countTaxonomyGroups(subLabelOccurrences)
  const totalLabelOccurrences = countedGroups.reduce(
    (total, item) => total + item.labelOccurrences,
    0,
  )

  return countedGroups.map(({ group, labelOccurrences, statementOccurrences }) => {
    const color = strategyColors[group.parentLabel] ?? 'var(--color-neutral)'
    const mainSegment = createSegment({
      children: [],
      color,
      description: group.description,
      heightPercent: getPercent(labelOccurrences, totalLabelOccurrences),
      id: group.parentLabel,
      label: group.label,
      occurrences: statementOccurrences,
      parent: null,
    })

    mainSegment.children = group.childLabels.map((label) => {
      const childOccurrences = subLabelOccurrences.get(label) ?? 0

      return createSegment({
        children: [],
        color,
        heightPercent: getPercent(childOccurrences, totalLabelOccurrences),
        id: label,
        label: intentLabelNames[label],
        occurrences: childOccurrences,
        parent: mainSegment,
      })
    })

    return mainSegment
  })
}

function countTaxonomyGroups(
  subLabelOccurrences: ReadonlyMap<PatternLabelKey, number>,
) {
  return intentTaxonomy.map((group) => ({
    labelOccurrences: group.childLabels.reduce(
      (total, label) => total + (subLabelOccurrences.get(label) ?? 0),
      0,
    ),
    statementOccurrences: props.records.filter((record) =>
      isPatternGroupActive(record, group.parentLabel),
    ).length,
    group,
  }))
}

function createSegment(
  segment: Omit<IcicleSegment, 'widthPercent'>,
): IcicleSegment {
  return {
    ...segment,
    widthPercent: getPercent(segment.occurrences, maxStatementsPerSide),
  }
}

function countLabelOccurrences(label: PatternLabelKey) {
  return props.records.filter((record) => isPatternActive(record, label)).length
}

function handleHover(segment: IcicleSegment) {
  hoveredSegment.value = segment
  emit('gridMarkerChange', createGridMarker(segment))
  emit('segmentHover', segment)
}

function handleLeave(segment: IcicleSegment) {
  if (hoveredSegment.value?.id === segment.id) {
    hoveredSegment.value = null
    emit('gridMarkerChange', null)
    emit('segmentHover', null)
  }
}

function handleClick(segment: IcicleSegment) {
  hoveredSegment.value = null
  emit('gridMarkerChange', null)
  emit('segmentHover', null)
  emit('segmentClick', segment)
}

function shouldShowSubLabel(segment: IcicleSegment) {
  const activeHover = hoveredSegment.value
  const isValidSize = segment.heightPercent >= 3
  if (activeHover !== null) {
    return getIcicleRootId(activeHover) === getIcicleRootId(segment) || isValidSize
  }
  return isValidSize
}

onMounted(() => {
  const root = rootElement.value
  if (!root) return

  motionMedia = gsap.matchMedia()
  motionMedia.add(
    {
      allowMotion: '(prefers-reduced-motion: no-preference)',
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const buttons = Array.from(
        root.querySelectorAll<HTMLElement>('.icicle-button'),
      )
      const diagramBounds = root.getBoundingClientRect()
      const verticalRange = Math.max(1, diagramBounds.height)

      if (context.conditions?.reduceMotion) {
        gsap.set(buttons, { '--icicle-fill-scale': 1 })
        return
      }

      const delays = new Map(
        buttons.map((button) => [
          button,
          ((button.getBoundingClientRect().top - diagramBounds.top) / verticalRange) * 0.65,
        ]),
      )

      gsap.fromTo(
        buttons,
        { '--icicle-fill-scale': 0 },
        {
          '--icicle-fill-scale': 1,
          delay: (_, button) => delays.get(button as HTMLElement) ?? 0,
          duration: 0.55,
          ease: 'power2.out',
        },
      )
    },
    root,
  )
})

onUnmounted(() => {
  motionMedia?.revert()
  motionMedia = null
})
</script>

<template>
  <article ref="rootElement" class="icicle" aria-label="Pattern label distribution">
    <div class="icicle__diagram">
      <VerticalScale
        label="Percentage Distribution Across Patterns"
        :steps="verticalScaleSteps"
      />

      <span
        class="icicle__side-label icicle__side-label--left"
        aria-hidden="true"
      >
        Rhetorical Functions
      </span>
      <span
        class="icicle__side-label icicle__side-label--right"
        aria-hidden="true"
      >
        Rhetorical Patterns
      </span>

      <div
        class="icicle__side icicle__side--left"
        aria-label="Rhetorical Functions"
      >
        <IcicleButton
          v-for="mainSegment in mainSegments"
          :key="mainSegment.id"
          :active-segment="activeSegment"
          align="left"
          :accessibility-label="`${mainSegment.label}: ${mainSegment.occurrences}`"
          :label="mainSegment.label"
          :segment="mainSegment"
          :selected="false"
          @hover="handleHover"
          @leave="handleLeave"
          @select="handleClick"
        />
      </div>

      <div
        class="icicle__side icicle__side--right"
        aria-label="Rhetorical Patterns"
      >
        <IcicleButton
          v-for="child in subSegments"
          :key="child.id"
          :active-segment="activeSegment"
          align="right"
          :accessibility-label="`${child.label}: ${child.occurrences}`"
          :segment="child"
          :selected="false"
          @hover="handleHover"
          @leave="handleLeave"
          @select="handleClick"
        >
          <span
            v-if="shouldShowSubLabel(child)"
            class="icicle__sub-label"
          >
            {{ child.label }}
          </span>
        </IcicleButton>
      </div>
    </div>
  </article>
</template>

<style scoped>
@import '../../css/components/diagram/IcicleDiagram.css';
</style>
