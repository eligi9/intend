export type BinaryLabel = 'yes' | 'no' | null

export type IntentLabelKey =
  | 'enemy_image'
  | 'homogenization'
  | 'immutability'
  | 'essentialization'
  | 'dehumanization'
  | 'threat_construction'
  | 'just_cause'
  | 'security_rationale'
  | 'selfdefence_counterterrorism'
  | 'retaliation'
  | 'individual_needs'
  | 'meaning'
  | 'status'
  | 'hope_for_victory'
  | 'rhetorical_foreclosure'
  | 'no_alternative_framing'
  | 'humanity_as_weakness'
  | 'external_criticism_rejection'

export interface IntentRecord extends Record<IntentLabelKey, BinaryLabel> {
  id: string
  sourceFile: 'legislators' | 'decisionmakers'
  author: string
  sector: 'Legislators' | 'Decision Makers' | string
  date: string
  context: string | null
  statement: string
  position: string | null
  homogenization_anchor: string | null
  immutability_anchor: string | null
  essentialization_anchor: string | null
  dehumanization_anchor: string | null
  threat_construction_anchor: string | null
  homogenization_bj: string | null
  immutability_bj: string | null
  essentialization_bj: string | null
  dehumanization_bj: string | null
  threat_construction_bj: string | null
  security_rationale_anchor: string | null
  selfdefence_counterterrorism_anchor: string | null
  retaliation_anchor: string | null
  security_rationale_bj: string | null
  selfdefence_counterterrorism_bj: string | null
  retaliation_bj: string | null
  meaning_anchor: string | null
  status_anchor: string | null
  hope_for_victory_anchor: string | null
  meaning_bj: string | null
  status_bj: string | null
  hope_for_victory_bj: string | null
  no_alternative_framing_anchor: string | null
  humanity_as_weakness_anchor: string | null
  external_criticism_rejection_anchor: string | null
  no_alternative_framing_bj: string | null
  humanity_as_weakness_bj: string | null
  external_criticism_rejection_bj: string | null
}

export interface IntentDataset {
  name: string
  generatedAt: string
  sources: {
    legislators: {
      path: string
      count: number
    }
    decisionmakers: {
      path: string
      count: number
    }
  }
  records: IntentRecord[]
}

export interface IntentFilters {
  query: string
  sectors: string[]
  authors: string[]
  labelsAny: IntentLabelKey[]
  labelsAll: IntentLabelKey[]
}
