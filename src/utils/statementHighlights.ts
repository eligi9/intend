import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { splitAnchors, subLabelColors } from './intentLabels'

export interface AnchorHighlight {
  text: string
  color: string
}

export interface StatementSegment {
  text: string
  muted: boolean
  color: string | null
}

type BaseStatementSegment = Omit<StatementSegment, 'color'>

export function splitBracketedText(text: string) {
  const segments: BaseStatementSegment[] = []
  const bracketPattern = /\[[^\]]*\]/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = bracketPattern.exec(text))) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), muted: false })
    }

    segments.push({ text: match[0], muted: true })
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), muted: false })
  }

  return segments
}

export function splitStatementText(text: string, anchors: AnchorHighlight[]) {
  const baseSegments = splitBracketedText(text)
  const normalizedAnchors = anchors
    .filter((anchor) => anchor.text.length > 0)
    .sort((first, second) => second.text.length - first.text.length)

  if (!normalizedAnchors.length) {
    return baseSegments.map((segment) => ({ ...segment, color: null }))
  }

  return baseSegments.flatMap((segment) => splitSegmentByAnchors(segment, normalizedAnchors))
}

export function splitSegmentByAnchors(
  segment: BaseStatementSegment,
  anchors: AnchorHighlight[],
): StatementSegment[] {
  const parts: StatementSegment[] = []
  let cursor = 0
  const lowerText = segment.text.toLowerCase()

  while (cursor < segment.text.length) {
    const match = findNextAnchorMatch(lowerText, anchors, cursor)

    if (!match) {
      parts.push({
        text: segment.text.slice(cursor),
        muted: segment.muted,
        color: null,
      })
      break
    }

    if (match.index > cursor) {
      parts.push({
        text: segment.text.slice(cursor, match.index),
        muted: segment.muted,
        color: null,
      })
    }

    parts.push({
      text: segment.text.slice(match.index, match.index + match.length),
      muted: segment.muted,
      color: match.color,
    })
    cursor = match.index + match.length
  }

  return parts
}

export function collectAnchorHighlights(record: IntentRecord, label: IntentLabelKey): AnchorHighlight[] {
  const color = subLabelColors.get(label) ?? '#858b94'
  const anchors = splitAnchors(record[`${label}_anchor` as keyof IntentRecord])

  return anchors.map((anchor) => ({ text: anchor.trim(), color }))
}

export function findNextAnchorMatch(text: string, anchors: AnchorHighlight[], cursor: number) {
  return anchors.reduce<{ index: number; length: number; color: string } | null>((nearest, anchor) => {
    const index = text.indexOf(anchor.text.toLowerCase(), cursor)
    if (index === -1) return nearest
    if (!nearest || index < nearest.index) {
      return { index, length: anchor.text.length, color: anchor.color }
    }
    return nearest
  }, null)
}

export function getDisplayLabel(label: IntentLabelKey) {
  return label
    .split('_')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}
