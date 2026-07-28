import { nextTick, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface InlineFragmentRect {
  color?: string
  height: number
  left: number
  top: number
  width: number
}

export function useInlineFragmentRects(
  container: Ref<HTMLElement | null>,
  measurementLayer: Ref<HTMLElement | null>,
  targetSelector: string,
) {
  const fragmentRects = ref<InlineFragmentRect[]>([])
  let animationFrameId: number | null = null
  let resizeObserver: ResizeObserver | null = null

  function measure() {
    animationFrameId = null

    const containerElement = container.value
    const layerElement = measurementLayer.value
    if (!containerElement || !layerElement) {
      fragmentRects.value = []
      return
    }

    const containerRect = containerElement.getBoundingClientRect()
    const lineHeight = Number.parseFloat(getComputedStyle(containerElement).lineHeight)
    if (!Number.isFinite(lineHeight)) {
      fragmentRects.value = []
      return
    }

    fragmentRects.value = Array.from(layerElement.querySelectorAll<HTMLElement>(targetSelector))
      .flatMap((element) => {
        const color = element.dataset.fragmentColor

        return Array.from(element.getClientRects()).map((rect) => ({
          color,
          height: lineHeight,
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top + (rect.height - lineHeight) / 2,
          width: rect.width,
        }))
      })
  }

  function requestMeasurement() {
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)

    void nextTick(() => {
      animationFrameId = requestAnimationFrame(measure)
    })
  }

  onMounted(() => {
    resizeObserver = new ResizeObserver(requestMeasurement)
    if (container.value) resizeObserver.observe(container.value)

    void document.fonts.ready.then(requestMeasurement)
    requestMeasurement()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
  })

  return {
    fragmentRects,
    requestMeasurement,
  }
}
