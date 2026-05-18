import type { IntentLabelKey } from './intentData'

export type TopLevelIntentLabelKey =
  | 'enemy_image'
  | 'just_cause'
  | 'individual_needs'
  | 'rhetorical_foreclosure'

export interface AuthorStatementLink {
  id: string
  date: string
  sector: string
  position: string | null
}

export interface AuthorLabelUsage {
  uses: boolean
  count: number
  statementIds: string[]
}

export interface AuthorTopLevelStrategy extends AuthorLabelUsage {
  id: string
  label: string
  childLabels: Partial<Record<IntentLabelKey, AuthorLabelUsage>>
  usesAllChildLabels: boolean
  usedChildLabelCount: number
  childLabelCount: number
}

export interface AuthorStrategySummary {
  usesAllTopLevelLabels: boolean
  usedTopLevelLabelCount: number
  topLevelLabelCount: number
  usedTopLevelLabels: TopLevelIntentLabelKey[]
  topLevel: Record<TopLevelIntentLabelKey, AuthorTopLevelStrategy>
}

export interface AuthorProfile {
  id: string
  name: string
  age: number | null
  gender: string | null
  primaryPosition: string | null
  positions: string[]
  primarySector: string | null
  sectors: string[]
  statementCount: number
  statementIds: string[]
  statements: AuthorStatementLink[]
  strategies: AuthorStrategySummary
  notes?: string | null
  externalIds?: Record<string, string>
}

export interface AuthorDataset {
  name: string
  generatedAt: string
  sourceDataset: string
  authorCount: number
  authors: AuthorProfile[]
}

export interface AuthorAdditionalProfile {
  name: string
  age: number | null
  gender: string | null
  notes: string | null
  externalIds: Record<string, string>
}

export interface AuthorAdditionalDataset {
  name: string
  description: string
  authors: Record<string, AuthorAdditionalProfile>
}
