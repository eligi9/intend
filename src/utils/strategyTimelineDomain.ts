import type { IntentRecord } from '../types/intentData'
import type { TimelineDomain, TimelineEvent } from '../types/timeline'
import {
  getEndOfCalendarMonth,
  parseDayFirstDate,
  parseIsoDate,
} from './time'

const TIMELINE_START_DATE = new Date(2023, 9, 1)

export function createStrategyTimelineDomain(
  statements: IntentRecord[],
  events: TimelineEvent[],
): TimelineDomain {
  const dates = [
    ...statements.map((statement) => parseDayFirstDate(statement.date)),
    ...events.flatMap((event) => [
      parseIsoDate(event.date),
      event.endDate ? parseIsoDate(event.endDate) : null,
    ]),
  ].filter((date): date is Date => date !== null)
  const latestDate = dates.reduce<Date>(
    (latest, date) => (date > latest ? date : latest),
    TIMELINE_START_DATE,
  )

  return {
    startDate: TIMELINE_START_DATE,
    endDate: getEndOfCalendarMonth(latestDate),
  }
}
