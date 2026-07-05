import type { IntentRecord, PatternLabelKey } from '../types/intentData'
import {
  getActivePatternGroups,
  isPatternGroupActive,
} from './intentRecordPatterns'
import { parseStatementDate } from './timelineScale'

export type StatementSortMode = 'size' | 'time'

export const statementMainLabelOrder: PatternLabelKey[] = [
  'enemy_image',
  'rhetorical_foreclosure',
  'just_cause',
  'individual_needs',
]

export function sortStatementsBySize(records: readonly IntentRecord[]) {
  return [...records].sort((first, second) => {
    const sizeDifference = getMainLabelCount(second) - getMainLabelCount(first)

    if (sizeDifference !== 0) {
      return sizeDifference
    }

    return compareStatementsByMainLabelOrder(first, second)
  })
}

export function sortStatementsBySubLabelCount(records: readonly IntentRecord[]) {
  return [...records].sort((first, second) => {
    const subLabelCountDifference = getSubLabelCount(second) - getSubLabelCount(first)

    if (subLabelCountDifference !== 0) {
      return subLabelCountDifference
    }

    return compareStatementsByMainLabelOrder(first, second)
  })
}

export function sortStatementsByTime(records: readonly IntentRecord[]) {
  return [...records].sort((first, second) => {
    const firstTime = parseStatementDate(first.date)?.getTime() ?? Number.NEGATIVE_INFINITY
    const secondTime = parseStatementDate(second.date)?.getTime() ?? Number.NEGATIVE_INFINITY

    return secondTime - firstTime
  })
}

export function getSubLabelCount(record: IntentRecord) {
  return record.patterns.reduce(
    (count, group) => count + group.subLabels.filter((annotation) => annotation.active === 'yes').length,
    0,
  )
}

export function getMainLabelCount(record: IntentRecord) {
  return getActivePatternGroups(record).length
}

export function getActiveMainLabels(record: IntentRecord) {
  return statementMainLabelOrder.filter((labelKey) => isPatternGroupActive(record, labelKey))
}

export function getActiveSubLabelCount(record: IntentRecord, mainLabel: PatternLabelKey) {
  const group = record.patterns.find((item) => item.key === mainLabel)

  return group?.subLabels.filter((annotation) => annotation.active === 'yes').length ?? 0
}

function getMainLabelSortSignature(record: IntentRecord) {
  const activeLabels = getActiveMainLabels(record)

  return statementMainLabelOrder
    .map((labelKey) => (activeLabels.includes(labelKey) ? '1' : '0'))
    .join('')
}

function compareStatementsByMainLabelOrder(first: IntentRecord, second: IntentRecord) {
  const firstOrderIndex = getFirstMainLabelOrderIndex(first)
  const secondOrderIndex = getFirstMainLabelOrderIndex(second)

  if (firstOrderIndex !== secondOrderIndex) {
    return firstOrderIndex - secondOrderIndex
  }

  const firstSignature = getMainLabelSortSignature(first)
  const secondSignature = getMainLabelSortSignature(second)

  return secondSignature.localeCompare(firstSignature)
}

function getFirstMainLabelOrderIndex(record: IntentRecord) {
  const activeLabels = getActiveMainLabels(record)
  const firstIndex = statementMainLabelOrder.findIndex((labelKey) => activeLabels.includes(labelKey))

  return firstIndex === -1 ? statementMainLabelOrder.length : firstIndex
}
