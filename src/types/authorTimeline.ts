import type { IntentLabelKey, IntentRecord } from './intentData'
import type { PositionedTimelineEventBase, TimelineEvent } from './timeline'

export interface AuthorTimelineSketchState {
  events?: TimelineEvent[]
  minPaddingX?: number
  paddingXRatio?: number
  selectedLabels: IntentLabelKey[]
  setHoveredStatement: (payload: HoveredTimelineStatement | null) => void
  setPositionedEvents?: (payload: PositionedTimelineEvent[]) => void
  statements: IntentRecord[]
}

export interface HoveredTimelineStatement {
  date: string
  id: string
  xRatio: number
  yRatio: number
}

export interface HoveredTimelineEvent extends PositionedTimelineEventBase {}

export type PositionedTimelineEvent = HoveredTimelineEvent
