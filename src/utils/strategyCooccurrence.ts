import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { taxonomyButtonColors } from './intentLabels'

export interface StrategyNode {
  color: string
  groupId: string
  groupName: string
  index: number
  label: IntentLabelKey
  name: string
  standaloneCount: number
  statementCount: number
}

export interface StrategyLink {
  source: IntentLabelKey
  sourceIndex: number
  sourceName: string
  target: IntentLabelKey
  targetIndex: number
  targetName: string
  value: number
}

export interface StrategyCooccurrence {
  links: StrategyLink[]
  matrix: number[][]
  nodes: StrategyNode[]
  totalStatements: number
}

const superLabels = intentTaxonomy
  .filter((group) => group.parentLabel)
  .map((group) => ({
    color: taxonomyButtonColors[group.id] ?? '#858b94',
    groupId: group.id,
    groupName: group.label,
    label: group.parentLabel as IntentLabelKey,
    name: group.label,
  }))

export function buildStrategyCooccurrence(records: IntentRecord[]): StrategyCooccurrence {
  const nodes = superLabels.map((item, index): StrategyNode => ({
    ...item,
    index,
    standaloneCount: 0,
    statementCount: 0,
  }))
  const labelIndex = new Map(nodes.map((node) => [node.label, node.index]))
  const matrix = nodes.map(() => nodes.map(() => 0))
  const links: StrategyLink[] = []

  for (const record of records) {
    const activeLabels = nodes
      .map((node) => node.label)
      .filter((label) => record[label] === 'yes')

    for (const label of activeLabels) {
      const index = labelIndex.get(label)
      if (index !== undefined) nodes[index].statementCount += 1
    }

    if (activeLabels.length === 1) {
      const index = labelIndex.get(activeLabels[0])
      if (index !== undefined) nodes[index].standaloneCount += 1
    }

    for (let sourceOffset = 0; sourceOffset < activeLabels.length; sourceOffset += 1) {
      for (let targetOffset = sourceOffset + 1; targetOffset < activeLabels.length; targetOffset += 1) {
        const sourceIndex = labelIndex.get(activeLabels[sourceOffset])
        const targetIndex = labelIndex.get(activeLabels[targetOffset])

        if (sourceIndex === undefined || targetIndex === undefined) continue

        matrix[sourceIndex][targetIndex] += 1
        matrix[targetIndex][sourceIndex] += 1
      }
    }
  }

  for (const source of nodes) {
    for (const target of nodes.slice(source.index + 1)) {
      const value = matrix[source.index][target.index]
      if (value === 0) continue

      links.push({
        source: source.label,
        sourceIndex: source.index,
        sourceName: source.name,
        target: target.label,
        targetIndex: target.index,
        targetName: target.name,
        value,
      })
    }
  }

  return {
    links,
    matrix,
    nodes,
    totalStatements: records.length,
  }
}
