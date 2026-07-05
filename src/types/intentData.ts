export type BinaryLabel = 'yes' | 'no' | null
export type AnchorTexts = string[]

export type PatternLabelKey =
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

export interface PatternAnnotation {
  active: BinaryLabel
  anchors: AnchorTexts
  justification: string | null
  key: PatternLabelKey
  label: string
}

export interface PatternGroupAnnotation {
  active: BinaryLabel
  key: PatternLabelKey
  label: string
  subLabels: PatternAnnotation[]
}

export interface IntentRecord extends Record<PatternLabelKey, BinaryLabel> {
  id: string
  sourceFile: 'legislators' | 'decisionmakers'
  author: string
  sector: 'Legislators' | 'Decision Makers' | string
  date: string
  context: string | null
  source: string | null
  statement: string
  measures: string[]
  speakerPosition: string | null
  homogenization_anchor: AnchorTexts
  immutability_anchor: AnchorTexts
  essentialization_anchor: AnchorTexts
  dehumanization_anchor: AnchorTexts
  threat_construction_anchor: AnchorTexts
  homogenization_bj: string | null
  immutability_bj: string | null
  essentialization_bj: string | null
  dehumanization_bj: string | null
  threat_construction_bj: string | null
  security_rationale_anchor: AnchorTexts
  selfdefence_counterterrorism_anchor: AnchorTexts
  retaliation_anchor: AnchorTexts
  security_rationale_bj: string | null
  selfdefence_counterterrorism_bj: string | null
  retaliation_bj: string | null
  meaning_anchor: AnchorTexts
  status_anchor: AnchorTexts
  hope_for_victory_anchor: AnchorTexts
  meaning_bj: string | null
  status_bj: string | null
  hope_for_victory_bj: string | null
  no_alternative_framing_anchor: AnchorTexts
  humanity_as_weakness_anchor: AnchorTexts
  external_criticism_rejection_anchor: AnchorTexts
  no_alternative_framing_bj: string | null
  humanity_as_weakness_bj: string | null
  external_criticism_rejection_bj: string | null
  patterns: PatternGroupAnnotation[]
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
  authors: string[]
  labelsAny: PatternLabelKey[]
  labelsAll: PatternLabelKey[]
}
