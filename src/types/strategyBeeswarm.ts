import type { IntentLabelKey, IntentRecord } from './intentData'
import type { HoveredTimelineEvent, TimelineDomain, TimelineEvent } from './timeline'

export type BeeswarmDisplayMode = 'strategies' | 'statements'

export interface HoveredBeeswarmStatement {
  anchorText: string[] | null
  author: string
  color: string
  date: string
  id: string
  label: IntentLabelKey
  record: IntentRecord
  source: string | null
  statement: string
  strategy: string
  xRatio: number
  yRatio: number
}

export interface HoveredTimelineStatement {
  author: string
  date: string
  id: string
  source: string | null
  statement: string
  xRatio: number
  yRatio: number
}

export interface StrategyBeeswarmSketchState {
  setPressedStatement: (payload: HoveredBeeswarmStatement | null) => void
  selectedLabels: IntentLabelKey[]
  setHoveredStatement: (payload: HoveredBeeswarmStatement | null) => void
  statements: IntentRecord[]
  timeDomain: TimelineDomain
}

export interface StatementBeeswarmSketchState {
  setHoveredStatement: (payload: HoveredTimelineStatement | null) => void
  statements: IntentRecord[]
  timeDomain: TimelineDomain
}

export interface StrategyTimelineGridSketchState {
  divisions: number
  endDate: Date
  events: TimelineEvent[]
  setHoveredEvent: (payload: HoveredTimelineEvent | null) => void
  startDate: Date
}
