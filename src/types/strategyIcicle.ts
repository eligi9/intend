import type { IntentLabelKey } from './intentData'

export interface StrategyMainLabelSelection {
  color: string
  description: string
  groupId: string
  id: IntentLabelKey
  label: string
  selected: boolean
}

export interface StrategyIcicleSegment {
  color: string
  description?: string
  depth: 'main' | 'sub'
  groupId: string
  heightPercent: number
  id: IntentLabelKey
  label: string
  occurrences: number
  widthPercent: number
}

export interface StrategyIcicleGroup {
  children: StrategyIcicleSegment[]
  color: string
  heightPercent: number
  labelKey: IntentLabelKey
  main: StrategyIcicleSegment
}

export type StrategyIcicleSegmentState = 'active' | 'dimmed' | 'neutral' | 'related'
