import type { PatternLabelKey } from './intentData'

export interface IntentSubLabelDescription {
  description: string
  label: string
  labelKey: PatternLabelKey
}

export interface IntentTaxonomyGroup {
  childLabels: PatternLabelKey[]
  description: string
  label: string
  labelKey: PatternLabelKey
  parentLabel: PatternLabelKey
  subLabels: IntentSubLabelDescription[]
}
