import type { StrategyIcicleSegment, StrategyIcicleSegmentState } from '../types/strategyIcicle'

export function getStrategyIcicleSegmentState(
  segment: StrategyIcicleSegment,
  activeSegment: StrategyIcicleSegment | null,
): StrategyIcicleSegmentState {
  if (activeSegment === null) {
    return 'neutral'
  }

  if (
    activeSegment.id === segment.id ||
    (activeSegment.depth === 'sub' &&
      segment.depth === 'main' &&
      activeSegment.groupId === segment.groupId) ||
    (activeSegment.depth === 'main' && activeSegment.groupId === segment.groupId)
  ) {
    return 'active'
  }

  return activeSegment.groupId === segment.groupId ? 'related' : 'dimmed'
}
