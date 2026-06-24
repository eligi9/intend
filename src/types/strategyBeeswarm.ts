import type { IntentLabelKey, IntentRecord } from './intentData'
import type { PositionedTimelineEventBase, TimelineDomain, TimelineEvent } from './timeline'

export interface HoveredBeeswarmStatement {
  anchorText: string[] | null
  author: string
  color: string
  date: string
  id: string
  statement: string
  strategy: string
  xRatio: number
  yRatio: number
}

export interface PositionedStrategyTimelineEvent extends PositionedTimelineEventBase {
  direction: 'up'
}

export interface StrategyBeeswarmSketchState {
  minPaddingX?: number
  paddingXRatio?: number
  selectedLabels: IntentLabelKey[]
  setHoveredStatement: (payload: HoveredBeeswarmStatement | null) => void
  statements: IntentRecord[]
  timeDomain: TimelineDomain
}

export interface StrategyTimelineGridSketchState {
  divisions: number
  endDate: Date
  events: TimelineEvent[]
  setPositionedEvents: (payload: PositionedStrategyTimelineEvent[]) => void
  startDate: Date
}
