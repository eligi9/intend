import type {
  MeasureCategory,
  PatternLabelKey,
  TopLevelStrategyUsage,
} from './intentData'

type AuthorRoleGroup = 'executive_officials' | 'legislators' | 'others'

interface AuthorPatternUsage {
  label: string
  labelKey: PatternLabelKey
  statementCount: number
}

interface AuthorContentCategoryUsage {
  label: MeasureCategory
  statementCount: number
}

interface AuthorImage {
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
  roleGroup: AuthorRoleGroup
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

export interface AuthorInstance extends AuthorProfile {
  age: number | null
  mostUsedContentCategory: AuthorContentCategoryUsage | null
  mostUsedPattern: AuthorPatternUsage | null
  statementCount: number
  usedTopLevelStrategies: TopLevelStrategyUsage[]
  usedTopLevelStrategyLabels: PatternLabelKey[]
  usedTopLevelStrategyCount: number
  topLevelStrategyCount: number
  usesAllTopLevelStrategies: boolean
}
