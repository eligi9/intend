import strategyLabelsDataset from '../../data/strategy-labels.json'
import type { IntentLabelKey } from './intentData'

export interface IntentSubLabelDescription {
  description: string
  label: string
  labelKey: IntentLabelKey
}

export interface IntentTaxonomyGroup {
  childLabels: IntentLabelKey[]
  description: string
  label: string
  labelKey: IntentLabelKey
  parentLabel: IntentLabelKey
  subLabels: IntentSubLabelDescription[]
}

interface StrategyLabelGroup {
  description: string
  label: string
  labelKey: IntentLabelKey
  subLabels: IntentSubLabelDescription[]
}

interface StrategyLabelsDataset {
  mainLabels: StrategyLabelGroup[]
}

const strategyLabels = strategyLabelsDataset as StrategyLabelsDataset

export const intentTaxonomy = strategyLabels.mainLabels.map((group) => ({
  childLabels: group.subLabels.map((label) => label.labelKey),
  description: group.description,
  label: group.label,
  labelKey: group.labelKey,
  parentLabel: group.labelKey,
  subLabels: group.subLabels,
})) satisfies IntentTaxonomyGroup[]

export const intentSubLabelDescriptions = Object.fromEntries(
  intentTaxonomy.flatMap((group) =>
    group.subLabels.map((label) => [label.labelKey, label.description] as const),
  ),
) as Partial<Record<IntentLabelKey, string>>
