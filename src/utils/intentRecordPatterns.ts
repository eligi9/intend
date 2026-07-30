import type {
  Pattern,
  PatternLabelKey,
  RawIntentRecord,
  Statement,
} from '../types/intentData'
import { intentTaxonomy } from './intentTaxonomy'
import { splitAnchors } from './intentLabels'

/**
 * Wandelt einen flachen Datensatz aus dem JSON-Datensatz in die normalisierte
 * Statement-Struktur der Anwendung um. Pattern-Status, Textanker und
 * Begründungen werden dabei im verschachtelten patterns-Array gesammelt.
 */
function normalizeIntentRecord(record: RawIntentRecord): Statement {
  return {
    author: record.author,
    context: record.context,
    date: record.date,
    id: record.id,
    measureCategories: record.measure_categories,
    measures: record.measures,
    patterns: createPatterns(record),
    source: record.source,
    statement: record.statement,
  }
}

/**
 * Normalisiert alle ursprünglichen JSON-Datensätze zu Statement-Objekten und
 * behält dabei ihre Reihenfolge aus der Quelldatei bei.
 */
export function normalizeIntentRecords(records: RawIntentRecord[]): Statement[] {
  return records.map((record) => normalizeIntentRecord(record))
}

/**
 * Sucht anhand des technischen Schlüssels nach einem aktiven Pattern in einem
 * Statement. Ist das Pattern nicht vorhanden, wird null zurückgegeben.
 */
export function getPattern(statement: Statement, label: PatternLabelKey) {
  return statement.patterns.find((pattern) => pattern.key === label) ?? null
}

/**
 * Prüft, ob ein bestimmter Pattern-Schlüssel im normalisierten patterns-Array
 * eines Statements vorhanden ist.
 */
export function isPatternActive(statement: Statement, label: PatternLabelKey) {
  return Boolean(getPattern(statement, label))
}

/**
 * Prüft, ob ein Statement zu einer übergeordneten Pattern-Gruppe gehört. Eine
 * Gruppe ist aktiv, wenn entweder ihr eigener Schlüssel oder der parentKey eines
 * ihrer Unter-Patterns mit dem gesuchten Schlüssel übereinstimmt.
 */
export function isPatternGroupActive(statement: Statement, label: PatternLabelKey) {
  return statement.patterns.some(
    (pattern) => pattern.key === label || pattern.parentKey === label,
  )
}

/**
 * Gibt alle Taxonomie-Gruppen zurück, die für ein Statement aktiv sind. Dazu
 * zählen auch Gruppen, die indirekt über eines ihrer Unter-Patterns aktiv sind.
 */
export function getActivePatternGroups(statement: Statement) {
  return intentTaxonomy.filter((group) =>
    isPatternGroupActive(statement, group.parentLabel),
  )
}

/**
 * Gibt ausschließlich die Unter-Patterns eines Statements zurück.
 * Übergeordnete Gruppen werden ausgeschlossen, da ihr parentKey null ist.
 */
export function getActiveSubPatterns(statement: Statement) {
  return statement.patterns.filter((pattern) => pattern.parentKey !== null)
}

/**
 * Erstellt das normalisierte patterns-Array eines ursprünglichen Datensatzes.
 * Dafür wird die Taxonomie durchlaufen und aktive Hauptgruppen sowie deren
 * aktive Unter-Patterns werden hinzugefügt.
 */
function createPatterns(record: RawIntentRecord): Pattern[] {
  return intentTaxonomy.flatMap((group) => {
    const groupPattern = isRawPatternActive(record, group.parentLabel)
      ? [createPattern(group.parentLabel, null)]
      : []
    const subPatterns = group.childLabels.flatMap((label) =>
      createSubPattern(record, label, group.parentLabel),
    )

    return [...groupPattern, ...subPatterns]
  })
}

/**
 * Erstellt ein normalisiertes Unter-Pattern, wenn sein ursprünglicher Status
 * aktiv ist oder mindestens ein Textanker vorhanden ist. Zusätzlich werden die
 * übergeordnete Gruppe, die Textanker und eine optionale Begründung zugeordnet.
 */
function createSubPattern(
  record: RawIntentRecord,
  label: PatternLabelKey,
  parentKey: PatternLabelKey,
): Pattern[] {
  const anchors = splitAnchors(record[`${label}_anchor`])
  if (!isRawPatternActive(record, label) && anchors.length === 0) return []

  const justification = record[`${label}_bj`]

  return [{
    ...createPattern(label, parentKey),
    anchors,
    justification:
      typeof justification === 'string' && justification.length > 0
        ? justification
        : null,
  }]
}

/**
 * Erstellt die gemeinsame Grundstruktur eines Patterns. Hauptgruppen erhalten
 * den parentKey null, Unter-Patterns den Schlüssel ihrer Taxonomie-Gruppe.
 */
function createPattern(
  key: PatternLabelKey,
  parentKey: PatternLabelKey | null,
): Pattern {
  return {
    anchors: [],
    justification: null,
    key,
    parentKey,
  }
}

/**
 * Liest den ursprünglichen Status eines Patterns. Nur der exakte Wert "yes"
 * wird als aktiv behandelt.
 */
function isRawPatternActive(record: RawIntentRecord, label: PatternLabelKey) {
  return record[label] === 'yes'
}
