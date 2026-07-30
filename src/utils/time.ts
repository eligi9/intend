const shortDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
})

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function parseDayFirstDate(value: string) {
  const [day, month, year] = value.split('/').map(Number)

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null
  }

  return new Date(year, month - 1, day)
}

export function formatShortIsoDate(value: string) {
  const date = parseIsoDate(value)
  return date ? shortDateFormatter.format(date) : value
}

export function formatTimelineMonthLabel(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return date.getMonth() === 0
    ? `${month}/${String(date.getFullYear()).slice(-2)}`
    : month
}

export function getCalendarMonthOffset(startDate: Date, date: Date) {
  const monthOffset =
    (date.getFullYear() - startDate.getFullYear()) * 12 +
    date.getMonth() -
    startDate.getMonth()
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const dayOffset = (date.getDate() - 1) / daysInMonth

  return monthOffset + dayOffset
}

export function getCalendarMonthCount(startDate: Date, endDate: Date) {
  return (
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    endDate.getMonth() -
    startDate.getMonth() +
    1
  )
}

export function getEndOfCalendarMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
