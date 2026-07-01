import type { PatternLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'

export interface IntentAnnotation {
  label: string
  type: 'Anchor'
  text: string
  color: string
  briefJustification: string | null
}

export const strategyColors: Partial<Record<PatternLabelKey, string>> = {
  enemy_image: 'var(--intent-color-enemy-image)',
  just_cause: 'var(--intent-color-just-cause)',
  individual_needs: 'var(--intent-color-individual-needs)',
  rhetorical_foreclosure: 'var(--intent-color-rhetorical-foreclosure)',
}

export const intentLabelNames = Object.fromEntries(
  intentTaxonomy.flatMap((group) => [
    [group.parentLabel, group.label],
    ...group.subLabels.map((label) => [label.labelKey, label.label] as const),
  ]),
) as Record<PatternLabelKey, string>

export const parentLabels = new Set<PatternLabelKey>(
  intentTaxonomy.map((group) => group.parentLabel),
)

export const subLabelColors = new Map<PatternLabelKey, string>(
  intentTaxonomy.flatMap((group) =>
    group.childLabels.map((label) => [label, strategyColors[group.parentLabel] ?? 'var(--color-neutral)'] as const),
  ),
)

export function getActiveLabels(record: IntentRecord, labelKeys: readonly PatternLabelKey[]) {
  return labelKeys.filter((label) => record[label] === 'yes')
}

export function getVisibleSubLabels(activeLabels: PatternLabelKey[]) {
  return activeLabels.filter((label) => !parentLabels.has(label))
}

export function splitAnchors(anchor: unknown) {
  return Array.isArray(anchor)
    ? anchor
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

export function collectIntentAnnotations(record: IntentRecord, activeLabels: PatternLabelKey[]) {
  return activeLabels.flatMap((label) => {
    const anchor = record[`${label}_anchor` as keyof IntentRecord]
    const judgement = record[`${label}_bj` as keyof IntentRecord]
    const color = subLabelColors.get(label) ?? 'var(--color-neutral)'
    const briefJustification =
      typeof judgement === 'string' && judgement.length > 0 ? judgement : null

    return splitAnchors(anchor).map((text) => ({
      label: intentLabelNames[label],
      type: 'Anchor',
      text,
      color,
      briefJustification,
    })) satisfies IntentAnnotation[]
  })
}
