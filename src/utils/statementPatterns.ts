import type { IntentRecord, PatternLabelKey } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { splitAnchors, subLabelColors } from './intentLabels'

export interface StatementPatternBadge {
  color: string
  label: PatternLabelKey
}

const statementPatternLabels = intentTaxonomy.flatMap((group) => group.childLabels)

export function getStatementPatternBadges(record: IntentRecord): StatementPatternBadge[] {
  return statementPatternLabels
    .filter((label) => record[label] === 'yes' || getStatementPatternAnchors(record, label).length > 0)
    .map((label) => ({
      color: getStatementPatternColor(label),
      label,
    }))
}

export function getStatementPatternAnchors(record: IntentRecord, label: PatternLabelKey) {
  return splitAnchors(record[`${label}_anchor` as keyof IntentRecord])
}

export function getStatementPatternBriefJustification(
  record: IntentRecord,
  label: PatternLabelKey,
) {
  const value = record[`${label}_bj` as keyof IntentRecord]

  return typeof value === 'string' && value.length > 0 ? value : null
}

export function getStatementPatternColor(label: PatternLabelKey) {
  return subLabelColors.get(label) ?? 'var(--color-neutral)'
}
