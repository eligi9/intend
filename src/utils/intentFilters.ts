import type { IntentFilters, PatternLabelKey, Statement } from '../types/intentData'
import { isPatternActive } from './intentRecordPatterns'

function includesText(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false
}

function isLabelActive(record: Statement, label: PatternLabelKey) {
  return isPatternActive(record, label)
}

export function matchesIntentFilters(record: Statement, filters: IntentFilters) {
  const query = filters.query.trim().toLowerCase()
  const matchesQuery =
    query.length === 0 ||
    includesText(record.author, query) ||
    includesText(record.context, query) ||
    includesText(record.source, query) ||
    includesText(record.statement, query)

  const matchesAllLabels =
    filters.labelsAll.length === 0 ||
    filters.labelsAll.every((label) => isLabelActive(record, label))
  const matchesMeasureCategories =
    filters.measureCategories.length === 0 ||
    filters.measureCategories.every((category) => record.measureCategories.includes(category))

  return matchesQuery && matchesAllLabels && matchesMeasureCategories
}
