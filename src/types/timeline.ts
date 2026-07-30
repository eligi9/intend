export interface TimelineDomain {
  endDate: Date
  startDate: Date
}

export interface TimelineEvent {
  date: string
  description: string
  id: string
  label: string
  sourceName: string
  sourceUrl: string
}

export interface HoveredTimelineEvent extends TimelineEvent {
  xRatio: number
  yRatio: number
}
