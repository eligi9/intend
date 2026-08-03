import type { AuthorInstance, AuthorProfile } from '../types/authorData'
import type { Statement } from '../types/intentData'
import { getActiveSubPatterns } from './intentRecordPatterns'
import { intentTaxonomy } from './intentTaxonomy'
import { getTopLevelStrategies } from './statementPatterns'

const measureCategoryDisplayOrder = [
  'Destruction',
  'Aid Control / Deprivation',
  'Forced Displacement',
  'Physical Harm',
  'Occupation / Settlement',
] as const

function getMostUsedContentCategory(statements: Statement[]) {
  return measureCategoryDisplayOrder.reduce<AuthorInstance['mostUsedContentCategory']>(
    (mostUsedCategory, label) => {
      const statementCount = statements.filter((statement) =>
        statement.measureCategories.includes(label),
      ).length

      if (statementCount === 0 || statementCount <= (mostUsedCategory?.statementCount ?? 0)) {
        return mostUsedCategory
      }

      return { label, statementCount }
    },
    null,
  )
}

function getMostUsedPattern(statements: Statement[]) {
  const patternCounts = new Map<string, number>()

  statements.forEach((statement) => {
    getActiveSubPatterns(statement).forEach((pattern) => {
      patternCounts.set(pattern.key, (patternCounts.get(pattern.key) ?? 0) + 1)
    })
  })

  return intentTaxonomy
    .flatMap((group) => group.subLabels)
    .reduce<AuthorInstance['mostUsedPattern']>((mostUsedPattern, pattern) => {
      const statementCount = patternCounts.get(pattern.labelKey) ?? 0

      if (statementCount === 0 || statementCount <= (mostUsedPattern?.statementCount ?? 0)) {
        return mostUsedPattern
      }

      return {
        label: pattern.label,
        labelKey: pattern.labelKey,
        statementCount,
      }
    }, null)
}

export function groupStatementsByAuthor(records: Statement[]) {
  return records.reduce<Record<string, Statement[]>>((index, record) => {
    index[record.author] ??= []
    index[record.author].push(record)
    return index
  }, {})
}

export function createAuthorInstance(
  author: AuthorProfile,
  statements: Statement[],
): AuthorInstance {
  const usedTopLevelStrategies = getTopLevelStrategies(statements)
  const topLevelStrategyCount = intentTaxonomy.length

  return {
    ...author,
    mostUsedContentCategory: getMostUsedContentCategory(statements),
    mostUsedPattern: getMostUsedPattern(statements),
    statementCount: statements.length,
    usedTopLevelStrategies,
    usedTopLevelStrategyLabels: usedTopLevelStrategies.map((strategy) => strategy.labelKey),
    usedTopLevelStrategyCount: usedTopLevelStrategies.length,
    topLevelStrategyCount,
    usesAllTopLevelStrategies: usedTopLevelStrategies.length === topLevelStrategyCount,
  }
}
