import type { PatternLabelKey } from '../types/intentData'
import { intentLabelNames } from './intentLabels'

interface AnchorHighlight {
  color: string
  text: string
}

interface HighlightRange {
  color: string | null
  end: number
  start: number
}

interface NormalizedText {
  endMap: number[]
  source: string
  startMap: number[]
  text: string
}

export function splitStatementText(text: string, anchors: AnchorHighlight[]) {
  const ranges = findHighlightRanges(text, anchors)

  return ranges.flatMap((range) => splitRangeByBrackets(text, range))
}

export function splitStatementTextExcludingMeasures(
  text: string,
  anchors: AnchorHighlight[],
  measures: readonly string[],
  maxAnchors = Number.POSITIVE_INFINITY,
) {
  const measureRanges = findHighlightRanges(
    text,
    measures.map((measure) => ({
      color: 'measure',
      text: measure,
    })),
  ).filter((range) => range.color !== null)
  const candidates = anchors
    .flatMap((anchor) =>
      findHighlightRanges(text, [anchor])
        .filter(
          (anchorRange) =>
            anchorRange.color !== null &&
            !measureRanges.some((measureRange) => rangesOverlap(anchorRange, measureRange)),
        )
        .map((range) => ({ anchor, range })),
    )
    .sort(
      (first, second) =>
        first.range.start - second.range.start ||
        second.range.end - second.range.start - (first.range.end - first.range.start),
    )
  const seenAnchors = new Set<string>()
  const nonOverlappingAnchors = candidates
    .filter(({ anchor }) => {
      const key = `${anchor.color}\u0000${normalizePlainText(anchor.text)}`
      if (seenAnchors.has(key)) return false

      seenAnchors.add(key)
      return true
    })
    .slice(0, maxAnchors)
    .map(({ anchor }) => anchor)

  return splitStatementText(text, nonOverlappingAnchors)
}

export function splitMeasureText(text: string, measures: readonly string[]) {
  const ranges = findHighlightRanges(
    text,
    measures.map((measure) => ({
      color: 'var(--color-black-40)',
      text: measure,
    })),
  )

  return ranges.map((range) => ({
    color: range.color,
    muted: false,
    text: text.slice(range.start, range.end),
  }))
}

function rangesOverlap(first: HighlightRange, second: HighlightRange) {
  return first.start < second.end && second.start < first.end
}

export function getDisplayLabel(label: PatternLabelKey) {
  return intentLabelNames[label]
}

function findHighlightRanges(text: string, anchors: AnchorHighlight[]) {
  const normalizedStatement = normalizeText(text)
  const normalizedAnchors = anchors
    .map((anchor) => {
      const trimmedText = anchor.text.trim()

      return {
        color: anchor.color,
        includeLeadingQuote: isIgnoredQuote(trimmedText[0]),
        includeTrailingQuote: isIgnoredQuote(trimmedText[trimmedText.length - 1]),
        text: normalizePlainText(trimmedText),
      }
    })
    .filter((anchor) => anchor.text.length > 0)
    .sort((first, second) => second.text.length - first.text.length)

  if (normalizedAnchors.length === 0) {
    return [{ color: null, start: 0, end: text.length }]
  }

  const ranges: HighlightRange[] = []
  let originalCursor = 0
  let normalizedCursor = 0

  while (originalCursor < text.length) {
    const match = findNextMatch(normalizedStatement, normalizedAnchors, normalizedCursor)

    if (!match) {
      ranges.push({ color: null, start: originalCursor, end: text.length })
      break
    }

    if (match.start > originalCursor) {
      ranges.push({ color: null, start: originalCursor, end: match.start })
    }

    ranges.push(match)
    originalCursor = match.end
    normalizedCursor = getNormalizedCursor(normalizedStatement, originalCursor)
  }

  return ranges
}

function findNextMatch(
  statement: NormalizedText,
  anchors: {
    color: string
    includeLeadingQuote: boolean
    includeTrailingQuote: boolean
    text: string
  }[],
  cursor: number,
) {
  return anchors.reduce<HighlightRange | null>((nearest, anchor) => {
    const matchIndex = statement.text.indexOf(anchor.text, cursor)
    if (matchIndex === -1) return nearest

    const matchEndIndex = matchIndex + anchor.text.length - 1
    const mappedStart = statement.startMap[matchIndex]
    const mappedEnd = statement.endMap[matchEndIndex]
    if (mappedStart === undefined || mappedEnd === undefined) return nearest
    const start =
      anchor.includeLeadingQuote &&
      mappedStart > 0 &&
      isIgnoredQuote(statement.source[mappedStart - 1])
        ? mappedStart - 1
        : mappedStart
    const end =
      anchor.includeTrailingQuote && isIgnoredQuote(statement.source[mappedEnd])
        ? mappedEnd + 1
        : mappedEnd

    if (!nearest || start < nearest.start) {
      return { color: anchor.color, start, end }
    }

    return nearest
  }, null)
}

function splitRangeByBrackets(text: string, range: HighlightRange) {
  const parts = text.slice(range.start, range.end).split(/(\[[^\]]*\])/g).filter(Boolean)

  return parts.map((part) => ({
    color: range.color,
    muted: part.startsWith('[') && part.endsWith(']'),
    text: part,
  }))
}

function normalizeText(text: string): NormalizedText {
  const startMap: number[] = []
  const endMap: number[] = []
  let normalized = ''
  let previousWasSpace = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (isIgnoredQuote(character)) continue

    if (/\s/.test(character)) {
      if (normalized.length > 0 && !previousWasSpace) {
        normalized += ' '
        startMap.push(index)
      }

      if (normalized.length > 0) {
        endMap[normalized.length - 1] = index + 1
      }

      previousWasSpace = true
      continue
    }

    normalized += character.toLowerCase()
    startMap.push(index)
    endMap.push(index + 1)
    previousWasSpace = false
  }

  return {
    endMap,
    source: text,
    startMap,
    text: normalized.trimEnd(),
  }
}

function normalizePlainText(text: string) {
  return text
    .replace(/["“”„‘’»«]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function getNormalizedCursor(statement: NormalizedText, originalCursor: number) {
  const cursor = statement.endMap.findIndex((originalEnd) => originalEnd > originalCursor)

  return cursor === -1 ? statement.text.length : cursor
}

function isIgnoredQuote(character: string) {
  return /["“”„‘’»«]/.test(character)
}
