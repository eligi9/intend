export type ExploreViewSection =
  | 'statements'
  | 'authors'
  | 'patterns'
  | 'timeline'

export interface ExploreHeaderSection {
  key: ExploreViewSection
  label: string
}

export interface ExploreHeaderProps {
  activeSection: ExploreViewSection
  sections: readonly ExploreHeaderSection[]
}
