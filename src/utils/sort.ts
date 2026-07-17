import type { IntentRecord, PatternLabelKey } from '../types/intentData'
import {
  getActivePatternGroups,
  isPatternGroupActive,
} from './intentRecordPatterns'

const statementMainLabelOrder: PatternLabelKey[] = [
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

function getMainLabelCount(record: IntentRecord) {
  return getActivePatternGroups(record).length
}

export function getActiveMainLabels(record: IntentRecord) {
  return statementMainLabelOrder.filter((labelKey) => isPatternGroupActive(record, labelKey))
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
