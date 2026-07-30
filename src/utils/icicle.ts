import type { IcicleSegment, IcicleSegmentState } from '../types/icicle'

export function getIcicleSegmentState(
  segment: IcicleSegment,
  activeSegment: IcicleSegment | null,
): IcicleSegmentState {
  if (activeSegment === null) {
    return 'neutral'
  }

  if (
    segment.id === activeSegment.id ||
    (isMainIcicleSegment(segment) && activeSegment.parent?.id === segment.id) ||
    (isMainIcicleSegment(activeSegment) &&
      getIcicleRootId(segment) === activeSegment.id)
  ) {
    return 'active'
  }

  return getIcicleRootId(activeSegment) === getIcicleRootId(segment)
    ? 'related'
    : 'dimmed'
}

export function isMainIcicleSegment(segment: IcicleSegment) {
  return segment.parent === null
}

export function getIcicleRootId(segment: IcicleSegment) {
  return segment.parent?.id ?? segment.id
}
