import type { AuthorInstance, AuthorProfile, AuthorTopLevelStrategyUsage } from '../types/authorData'
import type { IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'

export function calculateAge(dateOfBirth: string | null, referenceDate = new Date()) {
  if (!dateOfBirth) return null

  const [year, month = '1', day = '1'] = dateOfBirth.split('-')
  const birthYear = Number(year)
  const birthMonth = Number(month)
  const birthDay = Number(day)

  if (!Number.isFinite(birthYear)) return null

  let age = referenceDate.getFullYear() - birthYear
  const hasMonthAndDay = dateOfBirth.split('-').length === 3
  if (!hasMonthAndDay) return age

  const birthdayPassed =
    referenceDate.getMonth() + 1 > birthMonth ||
    (referenceDate.getMonth() + 1 === birthMonth && referenceDate.getDate() >= birthDay)

  if (!birthdayPassed) age -= 1

  return age
}

export function groupStatementsByAuthor(records: IntentRecord[]) {
  return records.reduce<Record<string, IntentRecord[]>>((index, record) => {
    index[record.author] ??= []
    index[record.author].push(record)
    return index
  }, {})
}

export function getUsedTopLevelStrategies(records: IntentRecord[]): AuthorTopLevelStrategyUsage[] {
  return intentTaxonomy.flatMap((group) => {
    if (!group.parentLabel) return []

    const matchingRecords = records.filter((record) => record[group.parentLabel!] === 'yes')

    if (matchingRecords.length === 0) return []

    return {
      id: group.id,
      label: group.label,
      labelKey: group.parentLabel,
      statementCount: matchingRecords.length,
      statementIds: matchingRecords.map((record) => record.id),
    }
  })
}

export function createAuthorInstance(
  author: AuthorProfile,
  statements: IntentRecord[],
  referenceDate = new Date(),
): AuthorInstance {
  const usedTopLevelStrategies = getUsedTopLevelStrategies(statements)
  const topLevelStrategyCount = intentTaxonomy.filter((group) => group.parentLabel).length

  return {
    ...author,
    age: calculateAge(author.dateOfBirth, referenceDate),
    statements,
    statementCount: statements.length,
    usedTopLevelStrategies,
    usedTopLevelStrategyLabels: usedTopLevelStrategies.map((strategy) => strategy.labelKey),
    usedTopLevelStrategyCount: usedTopLevelStrategies.length,
    topLevelStrategyCount,
    usesAllTopLevelStrategies: usedTopLevelStrategies.length === topLevelStrategyCount,
  }
}
