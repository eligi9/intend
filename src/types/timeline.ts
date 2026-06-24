export interface TimelineDomain {
  endDate: Date
  startDate: Date
}

export interface TimelineEvent {
  date: string
  description: string
  endDate?: string
  id: string
  label: string
  sourceName: string
  sourceUrl: string
}

export type TimelineEventDirection = 'down' | 'up'

export interface PositionedTimelineEventBase {
  date: string
  description: string
  direction: TimelineEventDirection
  id: string
  label: string
  sourceName: string
  sourceUrl: string
  xRatio: number
  yRatio: number
}
