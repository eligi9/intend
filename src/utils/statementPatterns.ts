import type { IntentRecord, PatternLabelKey, TopLevelStrategyUsage } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import {
  getActivePatternAnnotations,
  getPatternAnnotation,
  isPatternGroupActive,
} from './intentRecordPatterns'
import { subLabelColors } from './intentLabels'

export interface StatementPatternBadge {
  color: string
  label: PatternLabelKey
}

export function getStatementPatternBadges(record: IntentRecord): StatementPatternBadge[] {
  return getActivePatternAnnotations(record)
    .map((annotation) => ({
      color: getStatementPatternColor(annotation.key),
      label: annotation.key,
    }))
}

export function getStatementPatternAnchors(record: IntentRecord, label: PatternLabelKey) {
  return getPatternAnnotation(record, label)?.anchors ?? []
}

export function getStatementPatternBriefJustification(
  record: IntentRecord,
  label: PatternLabelKey,
) {
  return getPatternAnnotation(record, label)?.justification ?? null
}

export function getStatementPatternColor(label: PatternLabelKey) {
  return subLabelColors.get(label) ?? 'var(--color-neutral)'
}

export function getTopLevelStrategies(
  records: readonly IntentRecord[],
): TopLevelStrategyUsage[] {
  return intentTaxonomy.flatMap((group) => {
    const matchingRecords = records.filter((record) =>
      isPatternGroupActive(record, group.parentLabel),
    )

    if (matchingRecords.length === 0) return []

    return {
      label: group.label,
      labelKey: group.parentLabel,
      statementCount: matchingRecords.length,
      statementIds: matchingRecords.map((record) => record.id),
    }
  })
}
