import type { AuthorInstance, AuthorProfile } from '../types/authorData'
import type { IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'
import { getTopLevelStrategies } from './statementPatterns'

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

export function createAuthorInstance(
  author: AuthorProfile,
  statements: IntentRecord[],
  referenceDate = new Date(),
): AuthorInstance {
  const usedTopLevelStrategies = getTopLevelStrategies(statements)
  const topLevelStrategyCount = intentTaxonomy.length

  return {
    ...author,
    age: calculateAge(author.dateOfBirth, referenceDate),
    statementCount: statements.length,
    usedTopLevelStrategies,
    usedTopLevelStrategyLabels: usedTopLevelStrategies.map((strategy) => strategy.labelKey),
    usedTopLevelStrategyCount: usedTopLevelStrategies.length,
    topLevelStrategyCount,
    usesAllTopLevelStrategies: usedTopLevelStrategies.length === topLevelStrategyCount,
  }
}
