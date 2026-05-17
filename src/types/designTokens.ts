export const intentColors = {
  justCause: '#d772ff',
  enemyImage: '#ff657c',
  individualNeeds: '#658cff',
  rhetoricalForeclosure: '#93ba79',
} as const

export type IntentColorToken = keyof typeof intentColors

export const intentColorCssVars = {
  justCause: 'var(--intent-color-just-cause)',
  enemyImage: 'var(--intent-color-enemy-image)',
  individualNeeds: 'var(--intent-color-individual-needs)',
  rhetoricalForeclosure: 'var(--intent-color-rhetorical-foreclosure)',
} as const satisfies Record<IntentColorToken, string>

export const figmaColorVariableMap = {
  'Just Cause': 'justCause',
  'Enemy Image': 'enemyImage',
  'Individuals Needs': 'individualNeeds',
  'Rhetroical Foreclosure': 'rhetoricalForeclosure',
} as const
