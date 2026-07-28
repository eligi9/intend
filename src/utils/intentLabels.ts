import type { PatternLabelKey } from '../types/intentData'
import { intentTaxonomy } from './intentTaxonomy'

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

export const subLabelColors = new Map<PatternLabelKey, string>(
  intentTaxonomy.flatMap((group) =>
    group.childLabels.map((label) => [label, strategyColors[group.parentLabel] ?? 'var(--color-neutral)'] as const),
  ),
)

export function splitAnchors(anchor: unknown) {
  return Array.isArray(anchor)
    ? anchor
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}
