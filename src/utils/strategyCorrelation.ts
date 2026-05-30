import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { intentLabelNames, subLabelColors } from './intentLabels'

export interface StrategyCorrelationLabel {
  color: string
  groupId: string
  groupName: string
  label: IntentLabelKey
  name: string
  statementCount: number
}

export interface StrategyCorrelationCell {
  bothCount: number
  correlation: number
  labelCount: number
  source: IntentLabelKey
  target: IntentLabelKey
}

export interface StrategyCorrelationMatrix {
  cells: StrategyCorrelationCell[][]
  labels: StrategyCorrelationLabel[]
  totalStatements: number
}

const correlationLabels = intentTaxonomy.flatMap((group) =>
  group.childLabels.map((label) => ({
    color: subLabelColors.get(label) ?? '#858b94',
    groupId: group.id,
    groupName: group.label,
    label,
    name: intentLabelNames[label],
  })),
)

export function buildStrategyCorrelationMatrix(records: IntentRecord[]): StrategyCorrelationMatrix {
  const labels = correlationLabels.map((item): StrategyCorrelationLabel => ({
    ...item,
    statementCount: records.filter((record) => record[item.label] === 'yes').length,
  }))

  const cells = labels.map((source) =>
    labels.map((target): StrategyCorrelationCell => {
      if (source.label === target.label) {
        return {
          bothCount: source.statementCount,
          correlation: 1,
          labelCount: source.statementCount,
          source: source.label,
          target: target.label,
        }
      }

      const counts = records.reduce(
        (accumulator, record) => {
          const hasSource = record[source.label] === 'yes'
          const hasTarget = record[target.label] === 'yes'

          if (hasSource && hasTarget) accumulator.both += 1
          else if (hasSource) accumulator.sourceOnly += 1
          else if (hasTarget) accumulator.targetOnly += 1
          else accumulator.neither += 1

          return accumulator
        },
        { both: 0, neither: 0, sourceOnly: 0, targetOnly: 0 },
      )

      const denominator = Math.sqrt(
        (counts.both + counts.sourceOnly) *
          (counts.targetOnly + counts.neither) *
          (counts.both + counts.targetOnly) *
          (counts.sourceOnly + counts.neither),
      )

      return {
        bothCount: counts.both,
        correlation:
          denominator === 0
            ? 0
            : (counts.both * counts.neither - counts.sourceOnly * counts.targetOnly) / denominator,
        labelCount: source.statementCount,
        source: source.label,
        target: target.label,
      }
    }),
  )

  return {
    cells,
    labels,
    totalStatements: records.length,
  }
}
