export function readCssRemTokenInPixels(token: string) {
  const rootStyles = getComputedStyle(document.documentElement)
  const value = rootStyles.getPropertyValue(token).trim()
  const rootFontSize = Number.parseFloat(rootStyles.fontSize)

  if (!value.endsWith('rem') || Number.isNaN(rootFontSize)) {
    throw new Error(`Expected rem-based CSS token: ${token}`)
  }

  return Number.parseFloat(value) * rootFontSize
}
