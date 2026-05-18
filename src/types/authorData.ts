import type { IntentLabelKey, IntentRecord } from './intentData'

export interface AuthorImage {
  url: string
  sourceUrl: string
  wikidataImageProperty: string
  commonsFile: string
  originalUrl: string
  downloadedFrom: string
  title: string
  creator: string | null
  credit: string | null
  license: string | null
  licenseUrl: string | null
  attributionRequired: string | null
  copyrighted: string | null
  attribution: string
  isModified: boolean
  modifications: string
  retrievedAt: string
}

export interface AuthorProfile {
  id: string
  name: string
  dateOfBirth: string | null
  gender: string | null
  position: string | null
  sector: string | null
  party: string | null
  image: AuthorImage | null
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

export interface AuthorTopLevelStrategyUsage {
  id: string
  label: string
  labelKey: IntentLabelKey
  statementCount: number
  statementIds: string[]
}

export interface AuthorInstance extends AuthorProfile {
  age: number | null
  statements: IntentRecord[]
  statementCount: number
  usedTopLevelStrategies: AuthorTopLevelStrategyUsage[]
  usedTopLevelStrategyLabels: IntentLabelKey[]
  usedTopLevelStrategyCount: number
  topLevelStrategyCount: number
  usesAllTopLevelStrategies: boolean
}
