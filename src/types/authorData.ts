export interface AuthorProfile {
  id: string
  name: string
  dateOfBirth: string | null
  gender: string | null
  position: string | null
  sector: string | null
  party: string | null
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
  dateOfBirth: string | null
  gender: string | null
  party: string | null
  notes: string | null
  externalIds: Record<string, string>
}

export interface AuthorAdditionalDataset {
  name: string
  description: string
  authors: Record<string, AuthorAdditionalProfile>
}
