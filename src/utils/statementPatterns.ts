import type { Statement, PatternLabelKey, TopLevelStrategyUsage } from '../types/intentData'
import { intentTaxonomy } from './intentTaxonomy'
import {
  getActiveSubPatterns,
  getPattern,
  isPatternGroupActive,
} from './intentRecordPatterns'
import { subLabelColors } from './intentLabels'

interface StatementPatternBadge {
  color: string
  label: PatternLabelKey
}

export function getStatementPatternBadges(record: Statement): StatementPatternBadge[] {
  return getActiveSubPatterns(record)
    .map((annotation) => ({
      color: getStatementPatternColor(annotation.key),
      label: annotation.key,
    }))
}

export function getStatementPatternAnchors(record: Statement, label: PatternLabelKey) {
  return getPattern(record, label)?.anchors ?? []
}

export function getStatementPatternBriefJustification(
  record: Statement,
  label: PatternLabelKey,
) {
  return getPattern(record, label)?.justification ?? null
}

export function getStatementPatternColor(label: PatternLabelKey) {
  return subLabelColors.get(label) ?? 'var(--color-neutral)'
}

export function getTopLevelStrategies(
  records: readonly Statement[],
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
