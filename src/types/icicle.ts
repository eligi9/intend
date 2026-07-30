import type { PatternLabelKey } from './intentData'

export interface IcicleSegment {
  children: IcicleSegment[]
  color: string
  description?: string
  heightPercent: number
  id: PatternLabelKey
  label: string
  occurrences: number
  parent: IcicleSegment | null
  widthPercent: number
}

export type IcicleSegmentState = 'active' | 'dimmed' | 'neutral' | 'related'
