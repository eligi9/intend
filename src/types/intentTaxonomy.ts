import type { IntentLabelKey } from './intentData'

export interface IntentTaxonomyGroup {
  id: string
  label: string
  description: string
  parentLabel?: IntentLabelKey
  childLabels: IntentLabelKey[]
}

export const intentTaxonomy = [
  {
    id: 'enemy-image',
    label: 'Enemy Image',
    description:
      'Frames a target as a hostile or dangerous enemy by collapsing differences, attributing fixed traits, or placing people outside the bounds of ordinary moral concern.',
    parentLabel: 'enemy_image',
    childLabels: [
      'homogenization',
      'immutability',
      'essentialization',
      'dehumanization',
      'threat_construction',
    ],
  },
  {
    id: 'just-cause',
    label: 'Just Cause',
    description:
      'Presents coercive, violent, or restrictive action as justified by security, self-defence, counterterrorism, or retaliation.',
    parentLabel: 'just_cause',
    childLabels: ['security_rationale', 'selfdefence_counterterrorism', 'retaliation'],
  },
  {
    id: 'individual-needs',
    label: 'Individual Needs',
    description:
      'Links support for action to psychological needs such as meaning, status, belonging, confidence, or the promise of victory.',
    parentLabel: 'individual_needs',
    childLabels: ['meaning', 'status', 'hope_for_victory'],
  },
  {
    id: 'rhetorical-foreclosure',
    label: 'Rhetorical Foreclosure',
    description:
      'Closes down alternatives by portraying restraint, compromise, humanitarian concern, or external criticism as weakness, betrayal, or impossibility.',
    parentLabel: 'rhetorical_foreclosure',
    childLabels: ['no_alternative_framing', 'humanity_as_weakness', 'external_criticism_rejection'],
  },
] as const satisfies readonly IntentTaxonomyGroup[]
