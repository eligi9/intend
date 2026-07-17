export function readCssLengthTokenInPixels(token: string) {
  const probe = document.createElement('div')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.width = `var(${token})`
  document.body.append(probe)

  const pixels = Number.parseFloat(getComputedStyle(probe).width)
  probe.remove()

  if (Number.isNaN(pixels)) {
    throw new Error(`Expected CSS length token: ${token}`)
  }

  return pixels
}

export function readCssNumberToken(token: string) {
  const value = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(token),
  )

  if (Number.isNaN(value)) {
    throw new Error(`Expected CSS number token: ${token}`)
  }

  return value
}
