import type { Statement } from '../types/intentData'
import { parseDayFirstDate } from './time'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function createTimelinePoints(
  statements: Statement[],
  startDate = new Date(2023, 9, 7),
  endDateOverride?: Date,
) {
  const parsedStatements = statements
    .map((record) => ({ record, date: parseDayFirstDate(record.date) }))
    .filter((item): item is { record: Statement; date: Date } => item.date !== null)
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
