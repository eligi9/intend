<script setup lang="ts">
import { computed } from 'vue'
import type { PatternLabelKey, IntentRecord } from '../../types/intentData'
import { intentLabelNames, subLabelColors } from '../../utils/intentLabels'
import { isPatternActive } from '../../utils/intentRecordPatterns'

const props = defineProps<{
  firstLabel: PatternLabelKey
  records: IntentRecord[]
  secondLabel: PatternLabelKey
}>()

const svgWidth = 520
const svgHeight = 260
const maxRadius = 82
const circleY = 114

const counts = computed(() => {
  const firstCount = countLabel(props.firstLabel)
  const secondCount = countLabel(props.secondLabel)
  const bothCount = props.records.filter(
    (record) => isPatternActive(record, props.firstLabel) && isPatternActive(record, props.secondLabel),
  ).length

  return {
    bothCount,
    firstCount,
    firstOnlyCount: firstCount - bothCount,
    secondCount,
    secondOnlyCount: secondCount - bothCount,
    totalStatements: props.records.length,
  }
})

const geometry = computed(() => {
  const largestCount = Math.max(counts.value.firstCount, counts.value.secondCount, 1)
  const areaScale = Math.PI * maxRadius * maxRadius / largestCount
  const firstRadius = getRadius(counts.value.firstCount, areaScale)
  const secondRadius = getRadius(counts.value.secondCount, areaScale)
  const targetOverlapArea = counts.value.bothCount * areaScale
  const distance = getDistanceForOverlap(firstRadius, secondRadius, targetOverlapArea)
  const totalWidth = firstRadius + distance + secondRadius
  const startX = (svgWidth - totalWidth) / 2
  const firstX = startX + firstRadius
  const secondX = firstX + distance

  return {
    firstRadius,
    firstX,
    secondRadius,
    secondX,
  }
})

const firstLabelName = computed(() => intentLabelNames[props.firstLabel])
const secondLabelName = computed(() => intentLabelNames[props.secondLabel])
const firstColor = computed(() => subLabelColors.get(props.firstLabel) ?? 'var(--color-neutral)')
const secondColor = computed(() => subLabelColors.get(props.secondLabel) ?? 'var(--color-neutral)')
const overlapShare = computed(() =>
  counts.value.totalStatements === 0 ? 0 : counts.value.bothCount / counts.value.totalStatements,
)

function countLabel(label: PatternLabelKey) {
  return props.records.filter((record) => isPatternActive(record, label)).length
}

function getRadius(count: number, areaScale: number) {
  if (count === 0) return 0
  return Math.sqrt((count * areaScale) / Math.PI)
}

function getDistanceForOverlap(firstRadius: number, secondRadius: number, targetArea: number) {
  if (firstRadius === 0 || secondRadius === 0 || targetArea <= 0) {
    return firstRadius + secondRadius + 18
  }

  const smallerCircleArea = Math.PI * Math.min(firstRadius, secondRadius) ** 2
  if (targetArea >= smallerCircleArea) {
    return Math.abs(firstRadius - secondRadius)
  }

  let low = Math.abs(firstRadius - secondRadius)
  let high = firstRadius + secondRadius

  for (let step = 0; step < 48; step += 1) {
    const middle = (low + high) / 2
    const area = getCircleIntersectionArea(firstRadius, secondRadius, middle)

    if (area > targetArea) low = middle
    else high = middle
  }

  return (low + high) / 2
}

function getCircleIntersectionArea(firstRadius: number, secondRadius: number, distance: number) {
  if (distance >= firstRadius + secondRadius) return 0
  if (distance <= Math.abs(firstRadius - secondRadius)) {
    return Math.PI * Math.min(firstRadius, secondRadius) ** 2
  }

  const firstAngle = Math.acos(
    (distance ** 2 + firstRadius ** 2 - secondRadius ** 2) / (2 * distance * firstRadius),
  )
  const secondAngle = Math.acos(
    (distance ** 2 + secondRadius ** 2 - firstRadius ** 2) / (2 * distance * secondRadius),
  )
  const lensArea = 0.5 * Math.sqrt(
    Math.max(
      0,
      (-distance + firstRadius + secondRadius) *
        (distance + firstRadius - secondRadius) *
        (distance - firstRadius + secondRadius) *
        (distance + firstRadius + secondRadius),
    ),
  )

  return firstRadius ** 2 * firstAngle + secondRadius ** 2 * secondAngle - lensArea
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: 1,
    style: 'percent',
  }).format(value)
}
</script>

<template>
  <article class="strategy-venn" aria-label="Venn diagram for two patterns">
    <svg
      class="strategy-venn__figure"
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      role="img"
      :aria-label="`${firstLabelName} and ${secondLabelName}: ${counts.bothCount} shared statements`"
    >
      <circle
        v-if="geometry.firstRadius > 0"
        class="strategy-venn__circle strategy-venn__circle--first"
        :cx="geometry.firstX"
        :cy="circleY"
        :fill="firstColor"
        :r="geometry.firstRadius"
      />
      <circle
        v-if="geometry.secondRadius > 0"
        class="strategy-venn__circle strategy-venn__circle--second"
        :cx="geometry.secondX"
        :cy="circleY"
        :fill="secondColor"
        :r="geometry.secondRadius"
      />

      <text class="strategy-venn__count" :x="geometry.firstX" :y="circleY - 4">
        {{ counts.firstOnlyCount }}
      </text>
      <text
        class="strategy-venn__count strategy-venn__count--overlap"
        :x="(geometry.firstX + geometry.secondX) / 2"
        :y="circleY - 4"
      >
        {{ counts.bothCount }}
      </text>
      <text class="strategy-venn__count" :x="geometry.secondX" :y="circleY - 4">
        {{ counts.secondOnlyCount }}
      </text>

      <text class="strategy-venn__label" :x="geometry.firstX" y="226">
        {{ firstLabelName }}
      </text>
      <text class="strategy-venn__label" :x="geometry.secondX" y="226">
        {{ secondLabelName }}
      </text>
    </svg>

    <dl class="strategy-venn__facts">
      <div>
        <dt>{{ firstLabelName }}</dt>
        <dd>{{ counts.firstCount }}</dd>
      </div>
      <div>
        <dt>Shared</dt>
        <dd>{{ counts.bothCount }}</dd>
      </div>
      <div>
        <dt>{{ secondLabelName }}</dt>
        <dd>{{ counts.secondCount }}</dd>
      </div>
      <div>
        <dt>Share of all statements</dt>
        <dd>{{ formatPercent(overlapShare) }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyVennDiagram.css';
</style>
