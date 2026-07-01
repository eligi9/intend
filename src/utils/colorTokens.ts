export type RgbColor = readonly [number, number, number]

export interface CanvasBaseColors {
  background: RgbColor
  ink: RgbColor
  text: RgbColor
  white: RgbColor
}

export function readCanvasBaseColors(): CanvasBaseColors {
  return {
    background: readCssVariableRgb('--bg-black'),
    ink: readCssVariableRgb('--text-black'),
    text: readCssVariableRgb('--text-white'),
    white: readCssVariableRgb('--color-white'),
  }
}

export function readCssColorRgb(cssColor: string): RgbColor {
  const variableName = getCssVariableName(cssColor)
  const value = variableName ? getCssVariableValue(variableName) : cssColor.trim()

  return parseCssRgb(value)
}

export function formatRgbColor(color: RgbColor) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

function readCssVariableRgb(variableName: string): RgbColor {
  return parseCssRgb(getCssVariableValue(variableName))
}

function getCssVariableValue(variableName: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()

  if (!value) {
    throw new Error(`Missing CSS color token: ${variableName}`)
  }

  return value
}

function getCssVariableName(cssColor: string) {
  return cssColor.trim().match(/^var\((--[^,)]+)/)?.[1] ?? null
}

function parseCssRgb(value: string): RgbColor {
  if (value.startsWith('#')) return parseHexColor(value)
  if (value.startsWith('rgb')) return parseRgbColor(value)

  throw new Error(`Unsupported CSS color value: ${value}`)
}

function parseHexColor(value: string): RgbColor {
  const hex = value.slice(1)
  const fullHex =
    hex.length === 3
      ? [...hex].map((character) => character + character).join('')
      : hex

  if (fullHex.length !== 6) {
    throw new Error(`Unsupported hex color value: ${value}`)
  }

  return [
    Number.parseInt(fullHex.slice(0, 2), 16),
    Number.parseInt(fullHex.slice(2, 4), 16),
    Number.parseInt(fullHex.slice(4, 6), 16),
  ]
}

function parseRgbColor(value: string): RgbColor {
  const channels = value
    .replace(/^rgba?\(/, '')
    .replace(/\)$/, '')
    .split(/[,\s/]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(Number)

  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    throw new Error(`Unsupported rgb color value: ${value}`)
  }

  return [channels[0], channels[1], channels[2]] as RgbColor
}
