import type { IntentLabelKey } from './intentData'

export interface StrategyIcicleSegment {
  children: StrategyIcicleSegment[]
  color: string
  description?: string
  heightPercent: number
  id: IntentLabelKey
  label: string
  occurrences: number
  parent: StrategyIcicleSegment | null
  widthPercent: number
}

export type StrategyIcicleSegmentState = 'active' | 'dimmed' | 'neutral' | 'related'
