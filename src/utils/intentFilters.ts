import type { IntentFilters, IntentLabelKey, IntentRecord } from '../types/intentData'

export function includesText(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false
}

export function isLabelActive(record: IntentRecord, label: IntentLabelKey) {
  return record[label] === 'yes'
}

export function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export function matchesIntentFilters(record: IntentRecord, filters: IntentFilters) {
  const query = filters.query.trim().toLowerCase()
  const matchesQuery =
    query.length === 0 ||
    includesText(record.author, query) ||
    includesText(record.position, query) ||
    includesText(record.context, query) ||
    includesText(record.statement, query)

  const matchesSector =
    filters.sectors.length === 0 || filters.sectors.every((sector) => record.sector === sector)
  const matchesAuthor = filters.authors.length === 0 || filters.authors.includes(record.author)
  const matchesAnyLabel =
    filters.labelsAny.length === 0 ||
    filters.labelsAny.some((label) => isLabelActive(record, label))
  const matchesAllLabels =
    filters.labelsAll.length === 0 ||
    filters.labelsAll.every((label) => isLabelActive(record, label))

  return matchesQuery && matchesSector && matchesAuthor && matchesAnyLabel && matchesAllLabels
}
