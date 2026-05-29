import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export interface TextMarkerTarget {
  key: string
  element: HTMLElement
  color: string
  order: number
}

export interface TextMarkerRect {
  key: string
  color: string
  closesLeftEdge: boolean
  closesRightEdge: boolean
  delay: number
  duration: number
  left: number
  top: number
  width: number
  height: number
}

interface TextMarkerOptions {
  durationPerPixel?: number
  minDuration?: number
  maxDuration?: number
  gapBetweenLines?: number
  gapBetweenAnchors?: number
}

const defaultOptions = {
  durationPerPixel: 2.8,
  minDuration: 280,
  maxDuration: 720,
  gapBetweenLines: 70,
  gapBetweenAnchors: 140,
}

export function useTextMarkerAnimation(
  containerRef: Ref<HTMLElement | null>,
  targetsRef: Ref<TextMarkerTarget[]>,
  options: TextMarkerOptions = {},
) {
  const markerRects = ref<TextMarkerRect[]>([])
  const mergedOptions = { ...defaultOptions, ...options }

  let resizeObserver: ResizeObserver | null = null
  let animationFrame = 0

  function scheduleMeasure() {
    cancelAnimationFrame(animationFrame)
    animationFrame = requestAnimationFrame(() => {
      void measureMarkers()
    })
  }

  async function measureMarkers() {
    await nextTick()

    const container = containerRef.value
    const targets = targetsRef.value

    if (!container || targets.length === 0) {
      markerRects.value = []
      return
    }

    const containerRect = container.getBoundingClientRect()
    let nextDelay = 0
    let previousOrder: number | null = null

    markerRects.value = [...targets]
      .sort((first, second) => first.order - second.order)
      .flatMap((target) => {
        const rects = Array.from(target.element.getClientRects()).filter(
          (rect) => rect.width > 0 && rect.height > 0,
        )

        if (previousOrder !== null && previousOrder !== target.order) {
          nextDelay += mergedOptions.gapBetweenAnchors
        }

        previousOrder = target.order

        return rects.map((rect, lineIndex) => {
          const duration = Math.round(
            Math.max(
              mergedOptions.minDuration,
              Math.min(mergedOptions.maxDuration, rect.width * mergedOptions.durationPerPixel),
            ),
          )
          const marker = {
            key: `${target.key}-${lineIndex}`,
            color: target.color,
            closesLeftEdge: lineIndex === 0,
            closesRightEdge: lineIndex === rects.length - 1,
            delay: nextDelay,
            duration,
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          }

          nextDelay += duration + mergedOptions.gapBetweenLines
          return marker
        })
      })
  }

  onMounted(() => {
    if (containerRef.value) {
      resizeObserver = new ResizeObserver(scheduleMeasure)
      resizeObserver.observe(containerRef.value)
    }

    scheduleMeasure()
  })

  watch(targetsRef, scheduleMeasure, { deep: true })

  watch(containerRef, (container) => {
    resizeObserver?.disconnect()
    resizeObserver = null

    if (container) {
      resizeObserver = new ResizeObserver(scheduleMeasure)
      resizeObserver.observe(container)
    }

    scheduleMeasure()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
    cancelAnimationFrame(animationFrame)
  })

  return {
    markerRects,
    updateMarkers: scheduleMeasure,
  }
}
