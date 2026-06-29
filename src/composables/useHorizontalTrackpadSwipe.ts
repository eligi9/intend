import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

export type HorizontalSwipeDirection = 'left' | 'right'

interface HorizontalTrackpadSwipeOptions {
  cooldownMs?: number
  gestureResetMs?: number
  preventDefault?: boolean
  threshold?: number
  verticalTolerance?: number
}

const defaultOptions = {
  cooldownMs: 420,
  gestureResetMs: 220,
  preventDefault: true,
  threshold: 80,
  verticalTolerance: 1.35,
}

export function useHorizontalTrackpadSwipe(
  targetRef: Ref<HTMLElement | null>,
  onSwipe: (direction: HorizontalSwipeDirection, event: WheelEvent) => void,
  options: HorizontalTrackpadSwipeOptions = {},
) {
  const mergedOptions = { ...defaultOptions, ...options }

  let activeTarget: HTMLElement | null = null
  let gestureDeltaX = 0
  let gestureDeltaY = 0
  let hasSwipedInGesture = false
  let lastSwipeAt = 0
  let resetTimeout = 0

  function resetGesture() {
    gestureDeltaX = 0
    gestureDeltaY = 0
    hasSwipedInGesture = false
    window.clearTimeout(resetTimeout)
  }

  function scheduleReset() {
    window.clearTimeout(resetTimeout)
    resetTimeout = window.setTimeout(resetGesture, mergedOptions.gestureResetMs)
  }

  function isHorizontalGesture() {
    return Math.abs(gestureDeltaX) > Math.abs(gestureDeltaY) * mergedOptions.verticalTolerance
  }

  function getSwipeDirection() {
    return gestureDeltaX > 0 ? 'left' : 'right'
  }

  function handleWheel(event: WheelEvent) {
    const wheelMovesMostlyHorizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)

    if (!wheelMovesMostlyHorizontal) return
    if (mergedOptions.preventDefault) event.preventDefault()

    gestureDeltaX += event.deltaX
    gestureDeltaY += event.deltaY
    scheduleReset()

    if (hasSwipedInGesture) return

    const now = performance.now()
    const passedThreshold = Math.abs(gestureDeltaX) >= mergedOptions.threshold
    const isReady = now - lastSwipeAt > mergedOptions.cooldownMs

    if (!passedThreshold || !isHorizontalGesture() || !isReady) return

    hasSwipedInGesture = true
    lastSwipeAt = now
    onSwipe(getSwipeDirection(), event)
    gestureDeltaX = 0
    gestureDeltaY = 0
  }

  function connect(target: HTMLElement | null) {
    if (!target) return

    activeTarget = target
    activeTarget.addEventListener('wheel', handleWheel, { passive: false })
  }

  function disconnect() {
    activeTarget?.removeEventListener('wheel', handleWheel)
    activeTarget = null
  }

  onMounted(() => {
    connect(targetRef.value)
  })

  watch(targetRef, (target) => {
    disconnect()
    connect(target)
  })

  onBeforeUnmount(() => {
    disconnect()
    resetGesture()
  })

  return {
    resetGesture,
  }
}
