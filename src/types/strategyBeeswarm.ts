import type { IntentLabelKey, IntentRecord } from './intentData'
import type { TimelineDomain, TimelineEvent } from './timeline'

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

export interface StrategyBeeswarmSketchState {
  selectedLabels: IntentLabelKey[]
  setHoveredStatement: (payload: HoveredBeeswarmStatement | null) => void
  statements: IntentRecord[]
  timeDomain: TimelineDomain
}

export interface StrategyTimelineGridSketchState {
  divisions: number
  endDate: Date
  events: TimelineEvent[]
  startDate: Date
}
