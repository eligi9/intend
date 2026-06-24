import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'

export interface IntentAnnotation {
  label: string
  type: 'Anchor'
  text: string
  color: string
  briefJustification: string | null
}

export const taxonomyButtonColors: Partial<Record<IntentLabelKey, string>> = {
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
) as Record<IntentLabelKey, string>

export const parentLabels = new Set<IntentLabelKey>(
  intentTaxonomy.map((group) => group.parentLabel),
)

export const subLabelColors = new Map<IntentLabelKey, string>(
  intentTaxonomy.flatMap((group) =>
    group.childLabels.map((label) => [label, taxonomyButtonColors[group.parentLabel] ?? '#858b94'] as const),
  ),
)

export function getActiveLabels(record: IntentRecord, labelKeys: readonly IntentLabelKey[]) {
  return labelKeys.filter((label) => record[label] === 'yes')
}

export function getVisibleSubLabels(activeLabels: IntentLabelKey[]) {
  return activeLabels.filter((label) => !parentLabels.has(label))
}

export function splitAnchors(anchor: unknown) {
  if (Array.isArray(anchor)) {
    return anchor
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return typeof anchor === 'string'
    ? anchor
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

export function collectIntentAnnotations(record: IntentRecord, activeLabels: IntentLabelKey[]) {
  return activeLabels.flatMap((label) => {
    const anchor = record[`${label}_anchor` as keyof IntentRecord]
    const judgement = record[`${label}_bj` as keyof IntentRecord]
    const color = subLabelColors.get(label) ?? '#858b94'
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
