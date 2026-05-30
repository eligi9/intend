<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import {
  buildStrategyCorrelationMatrix,
  type StrategyCorrelationCell,
  type StrategyCorrelationLabel,
} from '../../utils/strategyCorrelation'

const props = defineProps<{
  records: IntentRecord[]
}>()

const hoveredCell = ref<StrategyCorrelationCell | null>(null)

const matrix = computed(() => buildStrategyCorrelationMatrix(props.records))
const labelByKey = computed(
  () => new Map(matrix.value.labels.map((label) => [label.label, label])),
)
const labelOrder = computed(
  () => new Map(matrix.value.labels.map((label, index) => [label.label, index])),
)
const selectedSource = computed(() =>
  hoveredCell.value ? labelByKey.value.get(hoveredCell.value.source) ?? null : null,
)
const selectedTarget = computed(() =>
  hoveredCell.value ? labelByKey.value.get(hoveredCell.value.target) ?? null : null,
)
const strongestCorrelations = computed(() =>
  matrix.value.cells
    .flatMap((row) => row)
    .filter((cell) => (labelOrder.value.get(cell.source) ?? 0) < (labelOrder.value.get(cell.target) ?? 0))
    .sort((first, second) => Math.abs(second.correlation) - Math.abs(first.correlation))
    .slice(0, 8),
)

function getCellStyle(cell: StrategyCorrelationCell) {
  if (cell.source === cell.target) {
    return {
      background: 'rgba(245, 243, 238, 0.22)',
      color: '#f5f3ee',
    }
  }

  const intensity = Math.min(0.92, 0.12 + Math.abs(cell.correlation) * 1.34)
  const color =
    cell.correlation >= 0
      ? `rgba(245, 243, 238, ${intensity})`
      : `rgba(32, 36, 43, ${0.24 + Math.abs(cell.correlation) * 0.64})`

  return {
    background: color,
    color: cell.correlation >= 0 && intensity > 0.52 ? '#20242b' : '#f5f3ee',
  }
}

function getCellTitle(cell: StrategyCorrelationCell) {
  const source = labelByKey.value.get(cell.source)?.name ?? cell.source
  const target = labelByKey.value.get(cell.target)?.name ?? cell.target

  if (cell.source === cell.target) {
    return `${source}: ${cell.labelCount} Statements`
  }

  return `${source} + ${target}: r=${formatCorrelation(cell.correlation)}, ${cell.bothCount} gemeinsam`
}

function isGroupStart(label: StrategyCorrelationLabel, index: number) {
  if (index === 0) return false
  return matrix.value.labels[index - 1]?.groupId !== label.groupId
}

function formatCorrelation(value: number) {
  return value.toFixed(2)
}
</script>

<template>
  <section class="strategy-heatmap" aria-label="Sublabel Korrelations-Heatmap">
    <aside class="strategy-heatmap__panel" aria-live="polite">
      <div class="strategy-heatmap__panel-focus">
        <span>Analyse</span>
        <h3 v-if="hoveredCell && selectedSource && selectedTarget">
          {{ selectedSource.name }}<template v-if="hoveredCell.source !== hoveredCell.target"> + {{ selectedTarget.name }}</template>
        </h3>
        <h3 v-else>Stärkste Korrelationen</h3>

        <strong v-if="hoveredCell && selectedSource && selectedTarget">
          <template v-if="hoveredCell.source === hoveredCell.target">
            {{ hoveredCell.labelCount }} Statements
          </template>
          <template v-else>
            r={{ formatCorrelation(hoveredCell.correlation) }}
            <span>{{ hoveredCell.bothCount }} gemeinsame Statements</span>
          </template>
        </strong>
        <strong v-else>{{ strongestCorrelations.length }} auffällige Paare</strong>
      </div>

      <ol>
        <li v-for="cell in strongestCorrelations" :key="`${cell.source}-${cell.target}`">
          <span>
            {{ labelByKey.get(cell.source)?.name }} + {{ labelByKey.get(cell.target)?.name }}
          </span>
          <strong>{{ formatCorrelation(cell.correlation) }}</strong>
        </li>
      </ol>
    </aside>

    <div class="strategy-heatmap__table-wrap">
      <table class="strategy-heatmap__table">
        <caption>
          <strong>Sublabel Korrelationen</strong>
          <span>{{ matrix.totalStatements }} Statements · Phi-Koeffizient</span>
        </caption>
        <thead>
          <tr>
            <th scope="col" class="strategy-heatmap__corner">Sublabel</th>
            <th
              v-for="(label, index) in matrix.labels"
              :key="label.label"
              scope="col"
              class="strategy-heatmap__column-heading"
              :class="{ 'strategy-heatmap__column-heading--group-start': isGroupStart(label, index) }"
            >
              <span :style="{ background: label.color }"></span>
              <b>{{ label.name }}</b>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in matrix.cells" :key="matrix.labels[rowIndex].label">
            <th
              scope="row"
              class="strategy-heatmap__row-heading"
              :class="{ 'strategy-heatmap__row-heading--group-start': isGroupStart(matrix.labels[rowIndex], rowIndex) }"
            >
              <span :style="{ background: matrix.labels[rowIndex].color }"></span>
              <b>{{ matrix.labels[rowIndex].name }}</b>
            </th>
            <td
              v-for="(cell, columnIndex) in row"
              :key="`${cell.source}-${cell.target}`"
              class="strategy-heatmap__cell"
              :class="{
                'strategy-heatmap__cell--diagonal': cell.source === cell.target,
                'strategy-heatmap__cell--group-start': isGroupStart(matrix.labels[columnIndex], columnIndex),
              }"
              :style="getCellStyle(cell)"
              :title="getCellTitle(cell)"
              @mouseenter="hoveredCell = cell"
              @focusin="hoveredCell = cell"
              tabindex="0"
            >
              <span>{{ cell.source === cell.target ? cell.labelCount : formatCorrelation(cell.correlation) }}</span>
              <small>{{ cell.source === cell.target ? 'n' : cell.bothCount }}</small>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
@import './StrategyCorrelationHeatmap.css';
</style>
