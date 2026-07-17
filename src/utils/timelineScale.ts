import type { IntentRecord } from '../types/intentData'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function parseStatementDate(value: string) {
  const [day, month, year] = value.split('/').map(Number)

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function createTimelinePoints(
  statements: IntentRecord[],
  startDate = new Date(2023, 9, 7),
  endDateOverride?: Date,
) {
  const parsedStatements = statements
    .map((record) => ({ record, date: parseStatementDate(record.date) }))
    .filter((item): item is { record: IntentRecord; date: Date } => item.date !== null)
    .sort((first, second) => first.date.getTime() - second.date.getTime())

  const latestStatementDate = parsedStatements[parsedStatements.length - 1]?.date
  const endDate =
    endDateOverride && endDateOverride > startDate
      ? endDateOverride
      : latestStatementDate && latestStatementDate > startDate
      ? latestStatementDate
      : new Date(startDate.getTime() + MS_PER_DAY)
  const range = Math.max(MS_PER_DAY, endDate.getTime() - startDate.getTime())

  return parsedStatements.map(({ record, date }) => ({
    id: record.id,
    record,
    date,
    ratio: clampRatio((date.getTime() - startDate.getTime()) / range),
  }))
}

function clampRatio(value: number) {
  return Math.min(1, Math.max(0, value))
}
