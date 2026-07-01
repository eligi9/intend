import type { PatternLabelKey } from './intentData'

export interface StrategyIcicleSegment {
  children: StrategyIcicleSegment[]
  color: string
  description?: string
  heightPercent: number
  id: PatternLabelKey
  label: string
  occurrences: number
  parent: StrategyIcicleSegment | null
  widthPercent: number
}

export type StrategyIcicleSegmentState = 'active' | 'dimmed' | 'neutral' | 'related'
