export const intentColors = {
  justCause: '#d772ff',
  enemyImage: '#ff657c',
  individualNeeds: '#658cff',
  rhetoricalForeclosure: '#93ba79',
} as const

export const baseColorRgb = {
  background: [31, 31, 31],
  text: [245, 243, 238],
  ink: [32, 36, 43],
  white: [255, 255, 255],
  authorTimeline: [75, 224, 240],
} as const satisfies Record<string, readonly [number, number, number]>

export type RgbColor = readonly [number, number, number]

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
