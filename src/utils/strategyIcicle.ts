import type { StrategyIcicleSegment, StrategyIcicleSegmentState } from '../types/strategyIcicle'

export function getStrategyIcicleSegmentState(
  segment: StrategyIcicleSegment,
  activeSegment: StrategyIcicleSegment | null,
): StrategyIcicleSegmentState {
  if (activeSegment === null) {
    return 'neutral'
  }

  if (
    segment.id === activeSegment.id ||
    (isMainStrategyIcicleSegment(segment) && activeSegment.parent?.id === segment.id) ||
    (isMainStrategyIcicleSegment(activeSegment) &&
      getStrategyIcicleRootId(segment) === activeSegment.id)
  ) {
    return 'active'
  }

  return getStrategyIcicleRootId(activeSegment) === getStrategyIcicleRootId(segment)
    ? 'related'
    : 'dimmed'
}

export function isMainStrategyIcicleSegment(segment: StrategyIcicleSegment) {
  return segment.parent === null
}

export function getStrategyIcicleRootId(segment: StrategyIcicleSegment) {
  return segment.parent?.id ?? segment.id
}
