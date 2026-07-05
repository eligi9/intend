import type { IntentRecord, PatternLabelKey } from '../types/intentData'
import {
  getActivePatternAnnotations,
  getPatternAnnotation,
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
