import type { IntentRecord } from '../types/intentData'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export interface TimelineTick {
  id: string
  date: Date
  label: string
  ratio: number
}

export interface TimelinePoint {
  id: string
  record: IntentRecord
  date: Date
  label: string
  ratio: number
  stackIndex: number
  stackCount: number
}

export interface TimelineModel {
  startDate: Date
  endDate: Date
  ticks: TimelineTick[]
  points: TimelinePoint[]
}

export function parseStatementDate(value: string) {
  const [day, month, year] = value.split('/').map(Number)

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function createTimelineModel(
  statements: IntentRecord[],
  startDate = new Date(2023, 9, 7),
): TimelineModel {
  const parsedStatements = statements
    .map((record) => ({ record, date: parseStatementDate(record.date) }))
    .filter((item): item is { record: IntentRecord; date: Date } => item.date !== null)
    .sort((first, second) => first.date.getTime() - second.date.getTime())

  const latestStatementDate = parsedStatements[parsedStatements.length - 1]?.date
  const endDate =
    latestStatementDate && latestStatementDate > startDate
      ? latestStatementDate
      : new Date(startDate.getTime() + MS_PER_DAY)
  const range = Math.max(MS_PER_DAY, endDate.getTime() - startDate.getTime())
  const dateCounts = new Map<string, number>()

  const points = parsedStatements.map(({ record, date }) => {
    const key = getDateKey(date)
    const stackIndex = dateCounts.get(key) ?? 0
    dateCounts.set(key, stackIndex + 1)

    return {
      id: record.id,
      record,
      date,
      label: formatDateLabel(date),
      ratio: clampRatio((date.getTime() - startDate.getTime()) / range),
      stackIndex,
      stackCount: 1,
    }
  })

  points.forEach((point) => {
    point.stackCount = dateCounts.get(getDateKey(point.date)) ?? 1
  })

  return {
    startDate,
    endDate,
    ticks: createTicks(startDate, endDate),
    points,
  }
}

function createTicks(startDate: Date, endDate: Date) {
  const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / MS_PER_DAY)
  const ticks: Date[] = [new Date(startDate)]

  if (rangeDays <= 45) {
    let current = addDays(startDate, 7)
    while (current < endDate) {
      ticks.push(current)
      current = addDays(current, 7)
    }
  } else {
    const monthStep = rangeDays <= 180 ? 1 : 2
    let current = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)
    while (current < endDate) {
      ticks.push(current)
      current = new Date(current.getFullYear(), current.getMonth() + monthStep, 1)
    }
  }

  if (getDateKey(ticks[ticks.length - 1] ?? startDate) !== getDateKey(endDate)) {
    ticks.push(new Date(endDate))
  }

  const range = Math.max(MS_PER_DAY, endDate.getTime() - startDate.getTime())

  return ticks.map((date) => ({
    id: getDateKey(date),
    date,
    label: formatDateLabel(date),
    ratio: clampRatio((date.getTime() - startDate.getTime()) / range),
  }))
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === 2023 ? undefined : '2-digit',
  }).format(date)
}

function clampRatio(value: number) {
  return Math.min(1, Math.max(0, value))
}
