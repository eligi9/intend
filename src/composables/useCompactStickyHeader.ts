import { onBeforeUnmount, ref, watch } from 'vue'
import { readCssLengthTokenInPixels } from '../utils/cssTokens'

interface CompactStickyHeaderOptions {
  compactPaddingToken?: string
  compactThresholdToken?: string
  initialCompact?: boolean
  scrollThreshold?: number
}

export function useCompactStickyHeader(options: CompactStickyHeaderOptions = {}) {
  const compactHeaderContent = ref<HTMLElement | null>(null)
  const compactHeaderHeight = ref('auto')
  const isHeaderCompact = ref(options.initialCompact ?? false)
  let resizeObserver: ResizeObserver | null = null

  function measureCompactHeight() {
    const content = compactHeaderContent.value
    if (!content) return

    const header = content.closest<HTMLElement>('.detail__header')
    const headerStyles = header ? getComputedStyle(header) : null
    const borderBlockSize = headerStyles
      ? Number.parseFloat(headerStyles.borderTopWidth) +
        Number.parseFloat(headerStyles.borderBottomWidth)
      : 0
    const padding = readCssLengthTokenInPixels(options.compactPaddingToken ?? '--space-2')

    compactHeaderHeight.value = `${Math.ceil(content.scrollHeight + padding * 2 + borderBlockSize)}px`
  }

  function handleScroll(event: Event) {
    const scrollTop = (event.currentTarget as HTMLElement).scrollTop
    const compactThreshold =
      options.scrollThreshold ??
      readCssLengthTokenInPixels(options.compactThresholdToken ?? '--space-2')
    const shouldCompact = isHeaderCompact.value
      ? scrollTop > 1
      : scrollTop > compactThreshold

    if (shouldCompact) measureCompactHeight()
    isHeaderCompact.value = shouldCompact
  }

  watch(
    compactHeaderContent,
    (content) => {
      resizeObserver?.disconnect()
      resizeObserver = content ? new ResizeObserver(measureCompactHeight) : null
      if (content) {
        measureCompactHeight()
        resizeObserver?.observe(content)
      }
    },
    { flush: 'post' },
  )

  onBeforeUnmount(() => resizeObserver?.disconnect())

  return {
    compactHeaderContent,
    compactHeaderHeight,
    handleScroll,
    isHeaderCompact,
  }
}
