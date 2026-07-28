import type {
  IntentRecord,
  PatternAnnotation,
  PatternGroupAnnotation,
  PatternLabelKey,
  RawIntentRecord,
} from '../types/intentData'
import { intentTaxonomy } from './intentTaxonomy'
import { intentLabelNames, splitAnchors } from './intentLabels'

function normalizeIntentRecord(record: RawIntentRecord): IntentRecord {
  return {
    ...record,
    patterns: createPatternGroups(record),
  }
}

export function normalizeIntentRecords(records: RawIntentRecord[]): IntentRecord[] {
  return records.map((record) => normalizeIntentRecord(record))
}

function getPatternGroup(record: IntentRecord, label: PatternLabelKey) {
  return record.patterns.find((group) => group.key === label) ?? null
}

export function getPatternAnnotation(record: IntentRecord, label: PatternLabelKey) {
  return (
    record.patterns
      .flatMap((group) => group.subLabels)
      .find((annotation) => annotation.key === label) ?? null
  )
}

export function isPatternActive(record: IntentRecord, label: PatternLabelKey) {
  return record[label] === 'yes'
}

export function isPatternGroupActive(record: IntentRecord, label: PatternLabelKey) {
  const group = getPatternGroup(record, label)

  return group?.active === 'yes' || Boolean(group?.subLabels.some((annotation) => annotation.active === 'yes'))
}

export function getActivePatternGroups(record: IntentRecord) {
  return record.patterns.filter((group) => isPatternGroupActive(record, group.key))
}

export function getActivePatternAnnotations(record: IntentRecord) {
  return record.patterns.flatMap((group) =>
    group.subLabels.filter((annotation) => annotation.active === 'yes' || annotation.anchors.length > 0),
  )
}

function createPatternGroups(record: RawIntentRecord): PatternGroupAnnotation[] {
  return intentTaxonomy.map((group) => ({
    active: record[group.parentLabel],
    key: group.parentLabel,
    label: group.label,
    subLabels: group.childLabels.map((label) => createPatternAnnotation(record, label)),
  }))
}

function createPatternAnnotation(
  record: RawIntentRecord,
  label: PatternLabelKey,
): PatternAnnotation {
  const justification = record[`${label}_bj` as keyof RawIntentRecord]

  return {
    active: record[label],
    anchors: splitAnchors(record[`${label}_anchor` as keyof RawIntentRecord]),
    justification: typeof justification === 'string' && justification.length > 0 ? justification : null,
    key: label,
    label: intentLabelNames[label],
  }
}
