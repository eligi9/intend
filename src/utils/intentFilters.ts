import type { IntentFilters, PatternLabelKey, IntentRecord } from '../types/intentData'
import { isPatternActive } from './intentRecordPatterns'

export function includesText(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false
}

export function isLabelActive(record: IntentRecord, label: PatternLabelKey) {
  return isPatternActive(record, label)
}

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export function matchesIntentFilters(record: IntentRecord, filters: IntentFilters) {
  const query = filters.query.trim().toLowerCase()
  const matchesQuery =
    query.length === 0 ||
    includesText(record.author, query) ||
    includesText(record.speakerPosition, query) ||
    includesText(record.context, query) ||
    includesText(record.source, query) ||
    includesText(record.statement, query)

  const matchesAuthor = filters.authors.length === 0 || filters.authors.includes(record.author)
  const matchesAnyLabel =
    filters.labelsAny.length === 0 ||
    filters.labelsAny.some((label) => isLabelActive(record, label))
  const matchesAllLabels =
    filters.labelsAll.length === 0 ||
    filters.labelsAll.every((label) => isLabelActive(record, label))
  const matchesMeasureCategories =
    filters.measureCategories.length === 0 ||
    filters.measureCategories.every((category) => record.measure_categories.includes(category))

  return matchesQuery && matchesAuthor && matchesAnyLabel && matchesAllLabels && matchesMeasureCategories
}
