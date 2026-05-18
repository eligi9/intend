import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'

export interface IntentAnnotation {
  label: string
  type: 'Anchor'
  text: string
  color: string
  briefJustification: string | null
}

export const intentLabelNames: Record<IntentLabelKey, string> = {
  enemy_image: 'Enemy image',
  homogenization: 'Homogenization',
  immutability: 'Immutability',
  essentialization: 'Essentialization',
  dehumanization: 'Dehumanization',
  threat_construction: 'Threat construction',
  just_cause: 'Just cause',
  security_rationale: 'Security rationale',
  selfdefence_counterterrorism: 'Self-defence / counterterrorism',
  retaliation: 'Retaliation',
  individual_needs: 'Individual needs',
  meaning: 'Meaning',
  status: 'Status',
  hope_for_victory: 'Hope for victory',
  rhetorical_foreclosure: 'Rhetorical foreclosure',
  no_alternative_framing: 'No alternative framing',
  humanity_as_weakness: 'Humanity as weakness',
  external_criticism_rejection: 'External criticism rejection',
}

export const taxonomyButtonColors: Record<string, string> = {
  'enemy-image': 'var(--intent-color-enemy-image)',
  'just-cause': 'var(--intent-color-just-cause)',
  'individual-needs': 'var(--intent-color-individual-needs)',
  'rhetorical-foreclosure': 'var(--intent-color-rhetorical-foreclosure)',
}

export const parentLabels = new Set<IntentLabelKey>(
  intentTaxonomy.flatMap((group) => (group.parentLabel ? [group.parentLabel] : [])),
)

export const subLabelColors = new Map<IntentLabelKey, string>(
  intentTaxonomy.flatMap((group) =>
    group.childLabels.map((label) => [label, taxonomyButtonColors[group.id]] as const),
  ),
)

export function getActiveLabels(record: IntentRecord, labelKeys: readonly IntentLabelKey[]) {
  return labelKeys.filter((label) => record[label] === 'yes')
}

export function getVisibleSubLabels(activeLabels: IntentLabelKey[]) {
  return activeLabels.filter((label) => !parentLabels.has(label))
}

export function splitAnchors(anchor: unknown) {
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
