export const acceleratedContainerScrollRatio = 0.6

export function getNaturalViewportTop(element: HTMLElement) {
  let documentTop = 0
  let currentElement: HTMLElement | null = element

  while (currentElement) {
    documentTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent as HTMLElement | null
  }

  return documentTop - window.scrollY
}

export function getAcceleratedContainerScrollOffset(element: HTMLElement) {
  const naturalTop = getNaturalViewportTop(element)
  const distancePastViewportTop = Math.max(0, -naturalTop)

  return -distancePastViewportTop * acceleratedContainerScrollRatio
}
