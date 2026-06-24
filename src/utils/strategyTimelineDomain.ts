import type { IntentRecord } from '../types/intentData'
import type { TimelineDomain, TimelineEvent } from '../types/timeline'
import { parseStatementDate } from './timelineScale'

const TIMELINE_START_DATE = new Date(2023, 9, 1)

export function createStrategyTimelineDomain(
  statements: IntentRecord[],
  events: TimelineEvent[],
): TimelineDomain {
  const dates = [
    ...statements.map((statement) => parseStatementDate(statement.date)),
    ...events.flatMap((event) => [
      parseEventDate(event.date),
      event.endDate ? parseEventDate(event.endDate) : null,
    ]),
  ].filter((date): date is Date => date !== null)
  const latestDate = dates.reduce<Date>(
    (latest, date) => (date > latest ? date : latest),
    TIMELINE_START_DATE,
  )

  return {
    startDate: TIMELINE_START_DATE,
    endDate: new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0),
  }
}

export function getMonthDivisionCount(domain: TimelineDomain) {
  return (
    (domain.endDate.getFullYear() - domain.startDate.getFullYear()) * 12 +
    domain.endDate.getMonth() -
    domain.startDate.getMonth() +
    1
  )
}

function parseEventDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }

  return new Date(year, month - 1, day)
}
