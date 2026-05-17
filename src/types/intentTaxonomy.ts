import type { IntentLabelKey } from './intentData'

export interface IntentTaxonomyGroup {
  id: string
  label: string
  parentLabel?: IntentLabelKey
  childLabels: IntentLabelKey[]
}

export const intentTaxonomy = [
  {
    id: 'enemy-image',
    label: 'Enemy Image',
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
    parentLabel: 'just_cause',
    childLabels: ['security_rationale', 'selfdefence_counterterrorism', 'retaliation'],
  },
  {
    id: 'individual-needs',
    label: 'Individual Needs',
    parentLabel: 'individual_needs',
    childLabels: ['meaning', 'status', 'hope_for_victory'],
  },
  {
    id: 'rhetorical-foreclosure',
    label: 'Rhetorical Foreclosure',
    parentLabel: 'rhetorical_foreclosure',
    childLabels: ['no_alternative_framing', 'humanity_as_weakness', 'external_criticism_rejection'],
  },
] as const satisfies readonly IntentTaxonomyGroup[]
