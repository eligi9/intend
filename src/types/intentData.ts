export type MeasureCategory =
  | 'Destruction'
  | 'Aid Control / Deprivation'
  | 'Forced Displacement'
  | 'Physical Harm'
  | 'Occupation / Settlement'

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

export interface Pattern {
  anchors: string[]
  justification: string | null
  key: PatternLabelKey
  parentKey: PatternLabelKey | null
}

export interface TopLevelStrategyUsage {
  label: string
  labelKey: PatternLabelKey
  statementCount: number
  statementIds: string[]
}

export interface Statement {
  id: string
  author: string
  date: string
  context: string | null
  source: string | null
  statement: string
  measures: string[]
  measureCategories: MeasureCategory[]
  patterns: Pattern[]
}

type RawPatternValues = Record<PatternLabelKey, string | null>
type RawPatternAnchors = Partial<Record<`${PatternLabelKey}_anchor`, string[]>>
type RawPatternJustifications = Partial<Record<`${PatternLabelKey}_bj`, string | null>>

export type RawIntentRecord = {
  id: string
  sourceFile: 'legislators' | 'decisionmakers'
  author: string
  date: string
  context: string | null
  source: string | null
  statement: string
  measures: string[]
  measure_categories: MeasureCategory[]
  speakerPosition: string | null
} & RawPatternValues &
  RawPatternAnchors &
  RawPatternJustifications

export interface RawIntentDataset {
  name: string
  generatedAt: string
  records: RawIntentRecord[]
}

export interface IntentFilters {
  query: string
  labelsAll: PatternLabelKey[]
  measureCategories: MeasureCategory[]
}
