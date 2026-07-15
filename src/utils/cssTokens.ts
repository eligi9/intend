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
