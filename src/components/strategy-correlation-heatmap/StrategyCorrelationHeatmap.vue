<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import StrategyBadge from '../strategy-badge/StrategyBadge.vue'
import {
  buildStrategyCorrelationMatrix,
  type StrategyCorrelationCell,
  type StrategyCorrelationLabel,
} from '../../utils/strategyCorrelation'

const props = defineProps<{
  records: IntentRecord[]
}>()

const hoveredCell = ref<StrategyCorrelationCell | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })
const correlationColors = [
  '#1f4260',
  '#005e7d',
  '#007c92',
  '#009a9c',
  '#17b79c',
  '#67d294',
  '#abeb88',
  '#f3ff82',
]
const neutralCorrelationColor = 'rgb(48 48 48)'
const labelAbbreviations: Record<IntentLabelKey, string> = {
  dehumanization: 'Deh',
  enemy_image: 'EI',
  essentialization: 'Ess',
  external_criticism_rejection: 'Ext',
  homogenization: 'Hom',
  hope_for_victory: 'Vic',
  humanity_as_weakness: 'Hum',
  immutability: 'Imm',
  individual_needs: 'IN',
  just_cause: 'JC',
  meaning: 'Mea',
  no_alternative_framing: 'Alt',
  retaliation: 'Ret',
  rhetorical_foreclosure: 'RF',
  security_rationale: 'Sec',
  selfdefence_counterterrorism: 'Def',
  status: 'Sta',
  threat_construction: 'Thr',
}
const legendStops = correlationColors.map((color, index) => ({
  color,
  label:
    index === 0
      ? '0'
      : index === correlationColors.length - 1
        ? '1'
        : (index / (correlationColors.length - 1)).toFixed(2),
}))

const matrix = computed(() => buildStrategyCorrelationMatrix(props.records))
const heatmapColumns = computed(() =>
  matrix.value.labels.flatMap((label, index) => [
    ...(isGroupStart(label, index)
      ? [{ id: `column-separator-${label.groupId}`, type: 'separator' as const }]
      : []),
    { id: label.label, label, labelIndex: index, type: 'label' as const },
  ]),
)
const heatmapRows = computed(() =>
  matrix.value.labels.flatMap((label, index) => [
    ...(isGroupStart(label, index)
      ? [{ id: `row-separator-${label.groupId}`, type: 'separator' as const }]
      : []),
    { cells: matrix.value.cells[index], id: label.label, label, labelIndex: index, type: 'label' as const },
  ]),
)
const labelByKey = computed(
  () => new Map(matrix.value.labels.map((label) => [label.label, label])),
)
const selectedSource = computed(() =>
  hoveredCell.value ? labelByKey.value.get(hoveredCell.value.source) ?? null : null,
)
const selectedTarget = computed(() =>
  hoveredCell.value ? labelByKey.value.get(hoveredCell.value.target) ?? null : null,
)
const tooltipStyle = computed(() => ({
  left: `${tooltipPosition.value.x}px`,
  top: `${tooltipPosition.value.y}px`,
}))
const tooltipVenn = computed(() => {
  if (!hoveredCell.value || !selectedSource.value || !selectedTarget.value) return null

  const sourceCount = getStatementCount(hoveredCell.value.source)
  const targetCount = getStatementCount(hoveredCell.value.target)
  const bothCount = hoveredCell.value.source === hoveredCell.value.target
    ? sourceCount
    : hoveredCell.value.bothCount
  const largestCount = Math.max(sourceCount, targetCount, 1)
  const maxRadius = 31
  const areaScale = Math.PI * maxRadius * maxRadius / largestCount
  const sourceRadius = getRadius(sourceCount, areaScale)
  const targetRadius = getRadius(targetCount, areaScale)
  const distance = getDistanceForOverlap(sourceRadius, targetRadius, bothCount * areaScale)
  const overlapCenterX = 90
  const sourceX = overlapCenterX - distance / 2
  const targetX = overlapCenterX + distance / 2

  return {
    bothCount,
    sourceCount,
    sourceRadius,
    sourceX,
    targetCount,
    targetRadius,
    targetX,
  }
})

function getCellStyle(cell: StrategyCorrelationCell) {
  if (cell.source === cell.target) {
    return {
      backgroundColor: 'transparent',
      color: '#f5f3ee',
    }
  }

  const color = getCorrelationColor(cell.correlation)

  return {
    backgroundColor: color,
    color: cell.correlation >= 0 && cell.correlation > 0.34 ? '#20242b' : '#f5f3ee',
  }
}

function getLabelHeaderStyle(label: StrategyCorrelationLabel) {
  return {
    '--label-color': label.color,
  }
}

function getLabelAbbreviation(labelKey: IntentLabelKey) {
  return labelAbbreviations[labelKey]
}

function getCorrelationColor(value: number) {
  if (value <= 0) return neutralCorrelationColor

  const normalizedValue = Math.min(1, value)
  const index = Math.min(
    correlationColors.length - 1,
    Math.floor(normalizedValue * correlationColors.length),
  )

  return correlationColors[index]
}

function isGroupStart(label: StrategyCorrelationLabel, index: number) {
  if (index === 0) return false
  return matrix.value.labels[index - 1]?.groupId !== label.groupId
}

function formatCorrelation(value: number) {
  return value.toFixed(2)
}

function getStatementCount(labelKey: IntentLabelKey) {
  return labelByKey.value.get(labelKey)?.statementCount ?? 0
}

function getRadius(count: number, areaScale: number) {
  if (count === 0) return 0
  return Math.sqrt((count * areaScale) / Math.PI)
}

function getDistanceForOverlap(firstRadius: number, secondRadius: number, targetArea: number) {
  if (firstRadius === 0 || secondRadius === 0 || targetArea <= 0) {
    return firstRadius + secondRadius + 10
  }

  const smallerCircleArea = Math.PI * Math.min(firstRadius, secondRadius) ** 2
  if (targetArea >= smallerCircleArea) {
    return Math.abs(firstRadius - secondRadius)
  }

  let low = Math.abs(firstRadius - secondRadius)
  let high = firstRadius + secondRadius

  for (let step = 0; step < 42; step += 1) {
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

function showTooltip(cell: StrategyCorrelationCell, event: MouseEvent) {
  hoveredCell.value = cell
  moveTooltip(event)
}

function showKeyboardTooltip(cell: StrategyCorrelationCell, event: FocusEvent) {
  hoveredCell.value = cell

  const cellElement = event.currentTarget as HTMLElement
  const rect = cellElement.getBoundingClientRect()
  tooltipPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
  }
}

function moveTooltip(event: MouseEvent) {
  tooltipPosition.value = {
    x: event.clientX,
    y: event.clientY,
  }
}

function hideTooltip() {
  hoveredCell.value = null
}
</script>

<template>
  <section class="strategy-heatmap" aria-label="Strategy co-occurrence">
    <div class="strategy-heatmap__table-wrap">
      <table class="strategy-heatmap__table">
        <colgroup>
          <col class="strategy-heatmap__row-heading-column" />
          <col
            v-for="column in heatmapColumns"
            :key="column.id"
            :class="column.type === 'separator'
              ? 'strategy-heatmap__separator-column'
              : 'strategy-heatmap__value-column'"
          />
        </colgroup>
        <caption>
          <strong>Strategy co-occurrence</strong>
          <span>{{ matrix.totalStatements }} Statements</span>
        </caption>
        <thead>
          <tr>
            <th rowspan="2" scope="col" class="strategy-heatmap__corner">Strategy</th>
            <template v-for="column in heatmapColumns" :key="column.id">
              <th
                v-if="column.type === 'separator'"
                aria-hidden="true"
                class="strategy-heatmap__column-separator"
                scope="col"
              ></th>
              <th
                v-else
                aria-hidden="true"
                class="strategy-heatmap__column-color"
                :style="getLabelHeaderStyle(column.label)"
              >
                <span aria-hidden="true"></span>
              </th>
            </template>
          </tr>
          <tr>
            <template v-for="column in heatmapColumns" :key="`label-${column.id}`">
              <th
                v-if="column.type === 'separator'"
                aria-hidden="true"
                class="strategy-heatmap__column-separator"
                scope="col"
              ></th>
              <th
                v-else
                scope="col"
                class="strategy-heatmap__column-heading"
                :style="getLabelHeaderStyle(column.label)"
              >
                <b class="strategy-heatmap__label-name">{{ column.label.name }}</b>
                <abbr class="strategy-heatmap__label-short" :title="column.label.name">
                  {{ getLabelAbbreviation(column.label.label) }}
                </abbr>
              </th>
            </template>
          </tr>
        </thead>
        <tbody>
          <template v-for="row in heatmapRows" :key="row.id">
            <tr v-if="row.type === 'separator'" class="strategy-heatmap__row-separator" aria-hidden="true">
              <th class="strategy-heatmap__row-separator-heading" scope="row"></th>
              <td :colspan="heatmapColumns.length"></td>
            </tr>
            <tr v-else>
              <th
                scope="row"
                class="strategy-heatmap__row-heading"
                :style="getLabelHeaderStyle(row.label)"
              >
                <span aria-hidden="true"></span>
                <b class="strategy-heatmap__label-name">{{ row.label.name }}</b>
                <abbr class="strategy-heatmap__label-short" :title="row.label.name">
                  {{ getLabelAbbreviation(row.label.label) }}
                </abbr>
              </th>
              <template v-for="column in heatmapColumns" :key="`${row.id}-${column.id}`">
                <td
                  v-if="column.type === 'separator'"
                  aria-hidden="true"
                  class="strategy-heatmap__cell-separator"
                ></td>
                <td
                  v-else
                  class="strategy-heatmap__cell"
                  :class="{
                    'strategy-heatmap__cell--diagonal':
                      row.cells[column.labelIndex].source === row.cells[column.labelIndex].target,
                  }"
                  :style="getCellStyle(row.cells[column.labelIndex])"
                  @mouseenter="showTooltip(row.cells[column.labelIndex], $event)"
                  @mousemove="moveTooltip"
                  @mouseleave="hideTooltip"
                  @focusin="showKeyboardTooltip(row.cells[column.labelIndex], $event)"
                  @focusout="hideTooltip"
                  tabindex="0"
                >
                  <span class="strategy-heatmap__cell-value">
                    {{ row.cells[column.labelIndex].source === row.cells[column.labelIndex].target ? row.cells[column.labelIndex].labelCount : formatCorrelation(row.cells[column.labelIndex].correlation) }}
                  </span>
                  <small class="strategy-heatmap__cell-count">
                    {{ row.cells[column.labelIndex].source === row.cells[column.labelIndex].target ? 'n' : row.cells[column.labelIndex].bothCount }}
                  </small>
                </td>
              </template>
            </tr>
          </template>
        </tbody>
      </table>

      <div class="strategy-heatmap__legend" aria-label="Co-occurrence from low to high">
        <strong>Co-occurrence</strong>
        <span>Low</span>
        <div class="strategy-heatmap__legend-scale">
          <i
            v-for="stop in legendStops"
            :key="stop.color"
            :style="{ background: stop.color }"
            :aria-label="`Skalenwert ${stop.label}`"
          ></i>
        </div>
        <span>High</span>
        <div class="strategy-heatmap__legend-values">
          <span v-for="stop in legendStops" :key="`label-${stop.color}`">{{ stop.label }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="hoveredCell && selectedSource && selectedTarget"
      class="strategy-heatmap__tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      <div class="strategy-heatmap__tooltip-badges">
        <div class="strategy-heatmap__tooltip-badge-slot strategy-heatmap__tooltip-badge-slot--left">
          <StrategyBadge
            :color="selectedSource.color"
            :label="selectedSource.name"
          />
        </div>
        <span
          v-if="hoveredCell.source !== hoveredCell.target"
          class="strategy-heatmap__tooltip-plus"
          aria-hidden="true"
        >
          +
        </span>
        <div
          v-if="hoveredCell.source !== hoveredCell.target"
          class="strategy-heatmap__tooltip-badge-slot strategy-heatmap__tooltip-badge-slot--right"
        >
          <StrategyBadge
            :color="selectedTarget.color"
            :label="selectedTarget.name"
          />
        </div>
      </div>

      <svg
        v-if="tooltipVenn"
        class="strategy-heatmap__tooltip-venn"
        viewBox="0 0 180 86"
        aria-hidden="true"
      >
        <circle
          :cx="tooltipVenn.sourceX"
          cy="38"
          :fill="selectedSource.color"
          :r="tooltipVenn.sourceRadius"
        />
        <circle
          v-if="hoveredCell.source !== hoveredCell.target"
          :cx="tooltipVenn.targetX"
          cy="38"
          :fill="selectedTarget.color"
          :r="tooltipVenn.targetRadius"
        />
      </svg>

      <dl v-if="hoveredCell.source === hoveredCell.target">
        <div>
          <dt>Statements with this strategy</dt>
          <dd>{{ hoveredCell.labelCount }}</dd>
        </div>
        <div>
          <dt>Total statements</dt>
          <dd>{{ matrix.totalStatements }}</dd>
        </div>
      </dl>
      <dl v-else>
        <div>
          <dt>Shared statements</dt>
          <dd>{{ hoveredCell.bothCount }}</dd>
        </div>
        <div>
          <dt>{{ selectedSource.name }}</dt>
          <dd>{{ getStatementCount(hoveredCell.source) }}</dd>
        </div>
        <div>
          <dt>{{ selectedTarget.name }}</dt>
          <dd>{{ getStatementCount(hoveredCell.target) }}</dd>
        </div>
        <div>
          <dt>Association score</dt>
          <dd>{{ formatCorrelation(hoveredCell.correlation) }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
@import './StrategyCorrelationHeatmap.css';
</style>
