<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import {
  buildStrategyCooccurrence,
  type StrategyLink,
  type StrategyNode,
} from '../../utils/strategyCooccurrence'

interface PositionedNode extends StrategyNode {
  arcPath: string
  connectedEndAngle: number
  endAngle: number
  labelAnchor: 'start' | 'middle' | 'end'
  labelX: number
  labelY: number
  midAngle: number
  rowTotal: number
  startAngle: number
}

interface PositionedLink extends StrategyLink {
  gradientId: string
  gradientStartX: number
  gradientStartY: number
  gradientEndX: number
  gradientEndY: number
  path: string
  sourceRibbonColor: string
  sourceShare: number
  targetRibbonColor: string
  targetShare: number
}

interface ChordEndpoint {
  endAngle: number
  midAngle: number
  startAngle: number
}

const props = defineProps<{
  records: IntentRecord[]
}>()

const hoveredLabel = ref<IntentLabelKey | null>(null)
const hoveredLink = ref<PositionedLink | null>(null)

const size = 760
const center = size / 2
const outerRadius = 260
const innerRadius = 232
const ribbonRadius = 218
const ribbonControlRadius = 54
const labelRadius = 316
const gapAngle = 0.022

const cooccurrence = computed(() => buildStrategyCooccurrence(props.records))
const positionedNodes = computed<PositionedNode[]>(() => {
  const nodes = cooccurrence.value.nodes
  const rowTotals = cooccurrence.value.matrix.map((row) => row.reduce((sum, value) => sum + value, 0))
  const layoutTotals = nodes.map((node, index) => rowTotals[index] + node.standaloneCount)
  const drawableAngle = Math.PI * 2 - gapAngle * nodes.length
  const totalCount = layoutTotals.reduce((sum, count) => sum + Math.max(count, 1), 0)
  let angle = -Math.PI / 2

  return nodes.map((node, index) => {
    const rowTotal = rowTotals[index]
    const layoutTotal = layoutTotals[index]
    const span = (Math.max(layoutTotal, 1) / totalCount) * drawableAngle
    const startAngle = angle
    const endAngle = startAngle + span
    const connectedSpan = layoutTotal === 0 ? 0 : (span * rowTotal) / layoutTotal
    const connectedEndAngle = startAngle + connectedSpan
    const midAngle = startAngle + span / 2
    const labelPosition = polarToCartesian(labelRadius, midAngle)

    angle = endAngle + gapAngle

    return {
      ...node,
      arcPath: describeArc(innerRadius, outerRadius, startAngle, endAngle),
      connectedEndAngle,
      endAngle,
      labelAnchor: getLabelAnchor(midAngle),
      labelX: labelPosition.x,
      labelY: labelPosition.y,
      midAngle,
      rowTotal,
      startAngle,
    }
  })
})
const nodeByLabel = computed(
  () => new Map(positionedNodes.value.map((node) => [node.label, node])),
)
const positionedLinks = computed<PositionedLink[]>(() => {
  const endpoints = getLinkEndpoints()

  return cooccurrence.value.links.map((link) => {
    const sourceEndpoint = endpoints.get(getEndpointKey(link.sourceIndex, link.targetIndex))
    const targetEndpoint = endpoints.get(getEndpointKey(link.targetIndex, link.sourceIndex))
    const source = positionedNodes.value[link.sourceIndex]
    const target = positionedNodes.value[link.targetIndex]

    if (!sourceEndpoint || !targetEndpoint) {
      return {
        ...link,
        gradientEndX: center,
        gradientEndY: center,
        gradientId: `strategy-chord-gradient-${link.source}-${link.target}`,
        gradientStartX: center,
        gradientStartY: center,
        path: '',
        sourceRibbonColor: target.color,
        sourceShare: 0,
        targetRibbonColor: source.color,
        targetShare: 0,
      }
    }

    return {
      ...link,
      gradientEndX: polarToCartesian(ribbonRadius, targetEndpoint.midAngle).x,
      gradientEndY: polarToCartesian(ribbonRadius, targetEndpoint.midAngle).y,
      gradientId: `strategy-chord-gradient-${link.source}-${link.target}`,
      gradientStartX: polarToCartesian(ribbonRadius, sourceEndpoint.midAngle).x,
      gradientStartY: polarToCartesian(ribbonRadius, sourceEndpoint.midAngle).y,
      path: describeRibbon(sourceEndpoint, targetEndpoint),
      sourceRibbonColor: target.color,
      sourceShare: source.rowTotal === 0 ? 0 : link.value / source.rowTotal,
      targetRibbonColor: source.color,
      targetShare: target.rowTotal === 0 ? 0 : link.value / target.rowTotal,
    }
  })
})
const activeLinks = computed(() =>
  hoveredLabel.value
    ? positionedLinks.value
        .filter((link) => link.source === hoveredLabel.value || link.target === hoveredLabel.value)
        .sort((first, second) => second.value - first.value)
    : positionedLinks.value.slice().sort((first, second) => second.value - first.value).slice(0, 6),
)
const renderedLinks = computed(() => {
  if (hoveredLink.value) {
    return [
      ...positionedLinks.value.filter((link) => link !== hoveredLink.value),
      hoveredLink.value,
    ]
  }

  if (hoveredLabel.value) {
    return positionedLinks.value
      .slice()
      .sort((first, second) => Number(isLinkConnectedToHovered(first)) - Number(isLinkConnectedToHovered(second)))
  }

  return positionedLinks.value
})
const selectedNode = computed(() =>
  hoveredLabel.value ? nodeByLabel.value.get(hoveredLabel.value) ?? null : null,
)

function polarToCartesian(radius: number, angle: number) {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  }
}

function describeArc(inner: number, outer: number, startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(outer, startAngle)
  const outerEnd = polarToCartesian(outer, endAngle)
  const innerEnd = polarToCartesian(inner, endAngle)
  const innerStart = polarToCartesian(inner, startAngle)
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

function describeRibbon(source: ChordEndpoint, target: ChordEndpoint) {
  const sourceStart = polarToCartesian(ribbonRadius, source.startAngle)
  const sourceEnd = polarToCartesian(ribbonRadius, source.endAngle)
  const targetStart = polarToCartesian(ribbonRadius, target.startAngle)
  const targetEnd = polarToCartesian(ribbonRadius, target.endAngle)
  const sourceControl = polarToCartesian(ribbonControlRadius, source.midAngle)
  const targetControl = polarToCartesian(ribbonControlRadius, target.midAngle)
  const sourceLargeArc = source.endAngle - source.startAngle > Math.PI ? 1 : 0
  const targetLargeArc = target.endAngle - target.startAngle > Math.PI ? 1 : 0

  return [
    `M ${sourceStart.x} ${sourceStart.y}`,
    `A ${ribbonRadius} ${ribbonRadius} 0 ${sourceLargeArc} 1 ${sourceEnd.x} ${sourceEnd.y}`,
    `C ${sourceControl.x} ${sourceControl.y} ${targetControl.x} ${targetControl.y} ${targetEnd.x} ${targetEnd.y}`,
    `A ${ribbonRadius} ${ribbonRadius} 0 ${targetLargeArc} 0 ${targetStart.x} ${targetStart.y}`,
    `C ${targetControl.x} ${targetControl.y} ${sourceControl.x} ${sourceControl.y} ${sourceStart.x} ${sourceStart.y}`,
    'Z',
  ].join(' ')
}

function getEndpointKey(sourceIndex: number, targetIndex: number) {
  return `${sourceIndex}-${targetIndex}`
}

function getLinkEndpoints() {
  const endpoints = new Map<string, ChordEndpoint>()
  const linksByNode = new Map<number, StrategyLink[]>()

  for (const link of cooccurrence.value.links) {
    linksByNode.set(link.sourceIndex, [...(linksByNode.get(link.sourceIndex) ?? []), link])
    linksByNode.set(link.targetIndex, [...(linksByNode.get(link.targetIndex) ?? []), link])
  }

  for (const node of positionedNodes.value) {
    const incidentLinks = (linksByNode.get(node.index) ?? []).sort(
      (first, second) => getOtherIndex(first, node.index) - getOtherIndex(second, node.index),
    )
    let cursor = node.startAngle

    for (const link of incidentLinks) {
      const span =
        node.rowTotal === 0
          ? 0
          : ((node.connectedEndAngle - node.startAngle) * link.value) / node.rowTotal
      const startAngle = cursor
      const endAngle = cursor + span
      const targetIndex = getOtherIndex(link, node.index)

      endpoints.set(getEndpointKey(node.index, targetIndex), {
        endAngle,
        midAngle: startAngle + span / 2,
        startAngle,
      })
      cursor = endAngle
    }
  }

  return endpoints
}

function getOtherIndex(link: StrategyLink, index: number) {
  return link.sourceIndex === index ? link.targetIndex : link.sourceIndex
}

function getLabelAnchor(angle: number): 'start' | 'middle' | 'end' {
  const x = Math.cos(angle)
  if (Math.abs(x) < 0.2) return 'middle'
  return x > 0 ? 'start' : 'end'
}

function isNodeDimmed(node: StrategyNode) {
  return hoveredLabel.value !== null && node.label !== hoveredLabel.value && !isConnectedToHovered(node.label)
}

function isConnectedToHovered(label: IntentLabelKey) {
  return positionedLinks.value.some(
    (link) =>
      hoveredLabel.value &&
      ((link.source === hoveredLabel.value && link.target === label) ||
        (link.target === hoveredLabel.value && link.source === label)),
  )
}

function isLinkConnectedToHovered(link: StrategyLink) {
  return link.source === hoveredLabel.value || link.target === hoveredLabel.value
}

function isLinkDimmed(link: StrategyLink) {
  if (hoveredLink.value) return hoveredLink.value !== link
  if (!hoveredLabel.value) return false
  return link.source !== hoveredLabel.value && link.target !== hoveredLabel.value
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}
</script>

<template>
  <section class="strategy-chord" aria-label="Strategie Co-Occurrence Chord Diagramm">
    <div class="strategy-chord__chart" @mouseleave="hoveredLabel = null; hoveredLink = null">
      <svg :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Co-Occurrences zwischen Superlabels">
        <defs>
          <linearGradient
            v-for="link in positionedLinks"
            :id="link.gradientId"
            :key="link.gradientId"
            gradientUnits="userSpaceOnUse"
            :x1="link.gradientStartX"
            :y1="link.gradientStartY"
            :x2="link.gradientEndX"
            :y2="link.gradientEndY"
          >
            <stop offset="0%" :stop-color="link.sourceRibbonColor" />
            <stop offset="47%" :stop-color="link.sourceRibbonColor" />
            <stop offset="53%" :stop-color="link.targetRibbonColor" />
            <stop offset="100%" :stop-color="link.targetRibbonColor" />
          </linearGradient>
        </defs>

        <g class="strategy-chord__links">
          <path
            v-for="link in renderedLinks"
            :key="`${link.source}-${link.target}`"
            class="strategy-chord__link"
            :class="{ 'strategy-chord__link--dimmed': isLinkDimmed(link) }"
            :d="link.path"
            :fill="`url(#${link.gradientId})`"
            @mouseenter="hoveredLink = link"
            @mouseleave="hoveredLink = null"
          />
        </g>

        <g class="strategy-chord__nodes">
          <path
            v-for="node in positionedNodes"
            :key="node.label"
            class="strategy-chord__arc"
            :class="{ 'strategy-chord__arc--dimmed': isNodeDimmed(node) }"
            :d="node.arcPath"
            :fill="node.color"
            @mouseenter="hoveredLabel = node.label"
            @focusin="hoveredLabel = node.label"
            tabindex="0"
          />

          <text
            v-for="node in positionedNodes"
            :key="`${node.label}-label`"
            class="strategy-chord__label"
            :class="{ 'strategy-chord__label--dimmed': isNodeDimmed(node) }"
            :x="node.labelX"
            :y="node.labelY"
            :text-anchor="node.labelAnchor"
            dominant-baseline="middle"
            @mouseenter="hoveredLabel = node.label"
          >
            {{ node.name }}
          </text>
        </g>
      </svg>
    </div>

    <aside class="strategy-chord__panel" aria-live="polite">
      <span>Statements: {{ cooccurrence.totalStatements }}</span>
      <h3 v-if="hoveredLink">
        {{ hoveredLink.sourceName }} + {{ hoveredLink.targetName }}
      </h3>
      <h3 v-else-if="selectedNode">{{ selectedNode.name }}</h3>
      <h3 v-else>Co-Occurrences</h3>

      <strong v-if="hoveredLink">
        {{ hoveredLink.value }} gemeinsame Statements
        <span>
          · {{ formatPercent(hoveredLink.sourceShare) }} von {{ hoveredLink.sourceName }}
          · {{ formatPercent(hoveredLink.targetShare) }} von {{ hoveredLink.targetName }}
        </span>
      </strong>
      <strong v-else-if="selectedNode">
        {{ selectedNode.statementCount }} Statements
        <span>{{ selectedNode.standaloneCount }} ohne Verknüpfung</span>
      </strong>
      <strong v-else>{{ positionedLinks.length }} aktive Verbindungen</strong>

      <ol>
        <li v-for="link in activeLinks" :key="`${link.source}-${link.target}`">
          <span>{{ link.sourceName }} + {{ link.targetName }}</span>
          <strong>{{ link.value }}</strong>
        </li>
      </ol>
    </aside>
  </section>
</template>

<style scoped>
@import './StrategyChordDiagram.css';
</style>
