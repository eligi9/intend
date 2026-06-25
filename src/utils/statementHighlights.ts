import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentLabelNames, splitAnchors, subLabelColors } from './intentLabels'

export interface AnchorHighlight {
  text: string
  color: string
}

export interface StatementSegment {
  text: string
  muted: boolean
  color: string | null
  highlightContinuesAfter?: boolean
  highlightContinuesBefore?: boolean
}

type BaseStatementSegment = Omit<StatementSegment, 'color'>

interface StatementRange {
  color: string | null
  end: number
  start: number
}

interface NormalizedTextIndex {
  normalized: string
  normalizedEndToOriginal: number[]
  normalizedStartToOriginal: number[]
}

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
  const normalizedAnchors = anchors
    .filter((anchor) => anchor.text.length > 0)
    .sort((first, second) => second.text.length - first.text.length)

  if (!normalizedAnchors.length) {
    return splitBracketedText(text).map((segment) => ({ ...segment, color: null }))
  }

  return splitTextByAnchorRanges(text, normalizedAnchors).flatMap((range) =>
    splitRangeByBrackets(text, range),
  )
}

export function splitTextByAnchorRanges(text: string, anchors: AnchorHighlight[]) {
  const ranges: StatementRange[] = []
  let cursor = 0

  while (cursor < text.length) {
    const match = findNextAnchorMatch(text, anchors, cursor)

    if (!match) {
      ranges.push({ color: null, end: text.length, start: cursor })
      break
    }

    if (match.index > cursor) {
      ranges.push({ color: null, end: match.index, start: cursor })
    }

    ranges.push({
      color: match.color,
      end: match.index + match.length,
      start: match.index,
    })
    cursor = match.index + match.length
  }

  return ranges
}

export function splitRangeByBrackets(text: string, range: StatementRange) {
  const segments = splitBracketedText(text.slice(range.start, range.end))

  return segments.map((segment, index) => ({
    ...segment,
    color: range.color,
    highlightContinuesAfter: Boolean(range.color && index < segments.length - 1),
    highlightContinuesBefore: Boolean(range.color && index > 0),
  }))
}

export function splitSegmentByAnchors(
  segment: BaseStatementSegment,
  anchors: AnchorHighlight[],
): StatementSegment[] {
  const parts: StatementSegment[] = []
  let cursor = 0

  while (cursor < segment.text.length) {
    const match = findNextAnchorMatch(segment.text, anchors, cursor)

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
  const color = subLabelColors.get(label) ?? 'var(--color-neutral)'
  const anchors = splitAnchors(record[`${label}_anchor` as keyof IntentRecord])

  return anchors.map((anchor) => ({ text: anchor.trim(), color }))
}

export function buildNormalizedTextIndex(text: string): NormalizedTextIndex {
  const normalizedStartToOriginal: number[] = []
  const normalizedEndToOriginal: number[] = []
  let normalized = ''
  let previousWasWhitespace = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (/\s/.test(character)) {
      if (normalized.length > 0 && !previousWasWhitespace) {
        normalized += ' '
        normalizedStartToOriginal.push(index)
        normalizedEndToOriginal.push(index + 1)
      } else if (previousWasWhitespace && normalizedEndToOriginal.length > 0) {
        normalizedEndToOriginal[normalizedEndToOriginal.length - 1] = index + 1
      }

      previousWasWhitespace = true
      continue
    }

    normalized += character.toLowerCase()
    normalizedStartToOriginal.push(index)
    normalizedEndToOriginal.push(index + 1)
    previousWasWhitespace = false
  }

  return {
    normalized,
    normalizedEndToOriginal,
    normalizedStartToOriginal,
  }
}

export function normalizeAnchorText(text: string) {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

export function getNormalizedCursor(index: NormalizedTextIndex, cursor: number) {
  const normalizedCursor = index.normalizedEndToOriginal.findIndex((originalEnd) => originalEnd > cursor)

  return normalizedCursor === -1 ? index.normalized.length : normalizedCursor
}

export function findNextAnchorMatch(text: string, anchors: AnchorHighlight[], cursor: number) {
  const normalizedTextIndex = buildNormalizedTextIndex(text)
  const normalizedCursor = getNormalizedCursor(normalizedTextIndex, cursor)

  return anchors.reduce<{ index: number; length: number; color: string } | null>((nearest, anchor) => {
    const normalizedAnchor = normalizeAnchorText(anchor.text)
    if (!normalizedAnchor) return nearest

    const normalizedMatchIndex = normalizedTextIndex.normalized.indexOf(normalizedAnchor, normalizedCursor)
    if (normalizedMatchIndex === -1) return nearest

    const normalizedMatchEnd = normalizedMatchIndex + normalizedAnchor.length - 1
    const originalStart = normalizedTextIndex.normalizedStartToOriginal[normalizedMatchIndex]
    const originalEnd = normalizedTextIndex.normalizedEndToOriginal[normalizedMatchEnd]

    if (originalStart === undefined || originalEnd === undefined) return nearest

    if (!nearest || originalStart < nearest.index) {
      return { index: originalStart, length: originalEnd - originalStart, color: anchor.color }
    }

    return nearest
  }, null)
}

export function getDisplayLabel(label: IntentLabelKey) {
  return intentLabelNames[label]
}
