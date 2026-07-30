export type ExploreViewSection =
  | 'statements'
  | 'authors'
  | 'patterns'
  | 'timeline'

export interface AppHeaderSection {
  key: ExploreViewSection
  label: string
}

export interface AppHeaderProps {
  activeSection: ExploreViewSection
  sections: readonly AppHeaderSection[]
}
