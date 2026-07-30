<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import type { VirtualScrollData } from 'lenis'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/locomotive-scroll.css'
import VerticalLineGrid from '../components/grid/VerticalLineGrid.vue'
import EstablishmentPatternTypesSection from '../components/establishment/EstablishmentPatternTypesSection.vue'
import EstablishmentStatementSection from '../components/establishment/EstablishmentStatementSection.vue'
import EstablishmentStatementInterlude from '../components/establishment/EstablishmentStatementInterlude.vue'
import TextButton from '../components/button/TextButton.vue'
import { pageScrollLockEventName } from '../composables/usePageScrollLock'
import landingCopy from '../content/landingCopy.json'
import { useStatementStore } from '../stores/statementStore'
import { getAcceleratedContainerScrollOffset } from '../utils/scrollMotion'
import ExploreView from './explore/ExploreView.vue'
import EstablishmentIntroView from './establishment/EstablishmentIntroView.vue'

interface EstablishmentIntroViewExpose {
  updateScrollState: () => void
}

interface EstablishmentPatternTypesSectionExpose {
  updateScrollState: () => void
}

interface EstablishmentStatementInterludeExpose {
  updateScrollState: () => void
}

interface EstablishmentStatementSectionExpose {
  updateScrollState: () => void
}

const viewRoot = ref<HTMLElement | null>(null)
const statementStore = useStatementStore()
const introSection = ref<EstablishmentIntroViewExpose | null>(null)
const patternTypesSection = ref<EstablishmentPatternTypesSectionExpose | null>(null)
const statementInterlude = ref<EstablishmentStatementInterludeExpose | null>(null)
const statementSection = ref<EstablishmentStatementSectionExpose | null>(null)
const frameGraphicSection = ref<HTMLElement | null>(null)
const showExplore = ref(false)
const showStatementSection = false
const establishmentGridLineCount = 8
const establishmentGridLabels: string[] = []
const interludeRecord = computed(() =>
  statementStore.records.find((record) => record.id === 'legislators-0005'),
)
let locomotiveScroll: LocomotiveScroll | null = null
let scrollAnimationFrame = 0
let overlayScrollLocked = false
let motionMedia: ReturnType<typeof gsap.matchMedia> | null = null
let prefersReducedMotion = false
let pagedScrollDelta = 0
let pagedScrollLocked = false
let pagedScrollDeltaResetTimer = 0
let pagedScrollUnlockTimer = 0
const pagedScrollThreshold = 24
const pagedScrollDuration = 1.25
const pagedScrollCooldown = 180
const pagedScrollEase = gsap.parseEase('power2.inOut')

gsap.ticker.lagSmoothing(0)

function requestLandingScrollUpdate() {
  if (scrollAnimationFrame) {
    return
  }

  scrollAnimationFrame = window.requestAnimationFrame(() => {
    scrollAnimationFrame = 0
    updateScrollSections()
  })
}

function updateLandingScrollFromTicker() {
  updateScrollSections()
}

function updateScrollSections() {
  introSection.value?.updateScrollState()
  patternTypesSection.value?.updateScrollState()
  statementInterlude.value?.updateScrollState()
  updateFrameGraphicScrollState()
  statementSection.value?.updateScrollState()
}

function updateFrameGraphicScrollState() {
  if (!frameGraphicSection.value) return

  const acceleration = prefersReducedMotion
    ? 0
    : getAcceleratedContainerScrollOffset(frameGraphicSection.value)

  gsap.set(frameGraphicSection.value, { y: acceleration })
}

function resetPagedScrollDelta() {
  pagedScrollDelta = 0

  if (pagedScrollDeltaResetTimer) {
    window.clearTimeout(pagedScrollDeltaResetTimer)
    pagedScrollDeltaResetTimer = 0
  }
}

function unlockPagedScrollAfterCooldown() {
  if (pagedScrollUnlockTimer) {
    window.clearTimeout(pagedScrollUnlockTimer)
  }

  pagedScrollUnlockTimer = window.setTimeout(() => {
    pagedScrollLocked = false
    pagedScrollUnlockTimer = 0
  }, pagedScrollCooldown)
}

function getPagedScrollTarget(direction: -1 | 1) {
  if (!viewRoot.value) return null

  const viewportHeight = window.innerHeight
  const pageCount = Math.max(1, Math.round(viewRoot.value.offsetHeight / viewportHeight))
  const currentPage = window.scrollY / viewportHeight
  const targetPage = direction > 0
    ? Math.floor(currentPage + 0.001) + 1
    : Math.ceil(currentPage - 0.001) - 1

  return Math.min(Math.max(targetPage, 0), pageCount - 1) * viewportHeight
}

function scrollByViewportStep(direction: -1 | 1) {
  const target = getPagedScrollTarget(direction)

  if (target === null || Math.abs(target - window.scrollY) < 1) {
    return
  }

  pagedScrollLocked = true
  resetPagedScrollDelta()

  locomotiveScroll?.scrollTo(target, {
    duration: pagedScrollDuration,
    easing: pagedScrollEase,
    immediate: prefersReducedMotion,
    lock: true,
    onComplete: unlockPagedScrollAfterCooldown,
  })
}

function handlePagedVirtualScroll({ deltaY, event }: VirtualScrollData) {
  if (showExplore.value || (event instanceof WheelEvent && event.ctrlKey)) {
    return true
  }

  if (event.cancelable && deltaY !== 0) {
    event.preventDefault()
  }

  if (overlayScrollLocked || pagedScrollLocked || deltaY === 0) {
    return false
  }

  pagedScrollDelta += deltaY

  if (pagedScrollDeltaResetTimer) {
    window.clearTimeout(pagedScrollDeltaResetTimer)
  }

  pagedScrollDeltaResetTimer = window.setTimeout(resetPagedScrollDelta, 120)

  if (Math.abs(pagedScrollDelta) >= pagedScrollThreshold) {
    scrollByViewportStep(pagedScrollDelta > 0 ? 1 : -1)
  }

  return false
}

function handlePagedScrollKeydown(event: KeyboardEvent) {
  if (showExplore.value || overlayScrollLocked || event.defaultPrevented) {
    return
  }

  const target = event.target

  if (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName))
  ) {
    return
  }

  const direction =
    event.key === 'ArrowDown' ||
    event.key === 'PageDown' ||
    (event.key === ' ' && !event.shiftKey)
      ? 1
      : event.key === 'ArrowUp' ||
          event.key === 'PageUp' ||
          (event.key === ' ' && event.shiftKey)
        ? -1
        : null

  if (direction === null) {
    return
  }

  event.preventDefault()

  if (!pagedScrollLocked) {
    scrollByViewportStep(direction)
  }
}

function scrollToExplore() {
  document.getElementById('explore')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function openExplore() {
  showExplore.value = true

  await nextTick()
  window.scrollTo({ top: 0, left: 0 })
  locomotiveScroll?.resize()
}

async function closeExplore() {
  showExplore.value = false

  await nextTick()
  window.scrollTo({ top: 0, left: 0 })
  locomotiveScroll?.resize()
  updateScrollSections()
}

function handleOverlayScrollLock(event: Event) {
  overlayScrollLocked = Boolean((event as CustomEvent<{ locked: boolean }>).detail?.locked)

  if (overlayScrollLocked) {
    locomotiveScroll?.stop()
    return
  }

  locomotiveScroll?.start()
}

onMounted(() => {
  motionMedia = gsap.matchMedia()
  motionMedia.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      prefersReducedMotion = Boolean(context.conditions?.reduceMotion)
      updateFrameGraphicScrollState()
    },
    viewRoot.value ?? undefined,
  )

  window.addEventListener(pageScrollLockEventName, handleOverlayScrollLock)
  window.addEventListener('keydown', handlePagedScrollKeydown)
  window.addEventListener('scroll', requestLandingScrollUpdate, { passive: true })
  window.addEventListener('resize', requestLandingScrollUpdate)
  window.visualViewport?.addEventListener('resize', requestLandingScrollUpdate)

  void nextTick(() => {
    locomotiveScroll = new LocomotiveScroll({
      lenisOptions: {
        wrapper: window,
        content: document.documentElement,
        lerp: 0.09,
        duration: 1.15,
        smoothWheel: true,
        syncTouch: false,
        virtualScroll: handlePagedVirtualScroll,
      },
      rafRootMargin: '120% 120% 120% 120%',
      initCustomTicker: (render) => {
        gsap.ticker.add(render)
      },
      destroyCustomTicker: (render) => {
        gsap.ticker.remove(render)
      },
      scrollCallback: updateScrollSections,
    })

    if (overlayScrollLocked) {
      locomotiveScroll.stop()
    }

    updateScrollSections()
    gsap.ticker.add(updateLandingScrollFromTicker)

    window.setTimeout(() => {
      locomotiveScroll?.resize()
      updateScrollSections()
    }, 0)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener(pageScrollLockEventName, handleOverlayScrollLock)
  window.removeEventListener('keydown', handlePagedScrollKeydown)
  window.removeEventListener('scroll', requestLandingScrollUpdate)
  window.removeEventListener('resize', requestLandingScrollUpdate)
  window.visualViewport?.removeEventListener('resize', requestLandingScrollUpdate)
  gsap.ticker.remove(updateLandingScrollFromTicker)
  if (scrollAnimationFrame) {
    window.cancelAnimationFrame(scrollAnimationFrame)
  }

  resetPagedScrollDelta()

  if (pagedScrollUnlockTimer) {
    window.clearTimeout(pagedScrollUnlockTimer)
    pagedScrollUnlockTimer = 0
  }

  locomotiveScroll?.destroy()
  locomotiveScroll = null

  if (frameGraphicSection.value) {
    gsap.killTweensOf(frameGraphicSection.value)
    gsap.set(frameGraphicSection.value, { clearProps: 'transform' })
  }

  motionMedia?.revert()
  motionMedia = null
})
</script>

<template>
  <div ref="viewRoot" class="establishment-view">
    <ExploreView v-if="showExplore" @exit="closeExplore" />

    <template v-else>
      <VerticalLineGrid
        class="establishment-view__grid"
        :labels="establishmentGridLabels"
        :line-count="establishmentGridLineCount"
      />

      <EstablishmentIntroView
        ref="introSection"
        :paragraphs="landingCopy.intro.paragraphs"
      />

      <EstablishmentPatternTypesSection ref="patternTypesSection" />

      <EstablishmentStatementInterlude
        v-if="interludeRecord"
        ref="statementInterlude"
        :record="interludeRecord"
      />

      <section
        ref="frameGraphicSection"
        class="establishment-view__frame-graphic"
        aria-label="Overview of rhetorical frame categories"
      >
        <div class="establishment-view__frame-graphic-copy">
          <h2>Visual Legend</h2>
          <p>
            Each statement is represented by a black circle. Every argumentative frame used adds a
            colored outer ring.
          </p>
        </div>

        <img
          class="establishment-view__frame-graphic-image"
          src="/images/rhetorical-frames-overview.png"
          alt="Diagram showing Enemy Image, Just Cause, and Individual Needs frame categories"
          width="490"
          height="654"
          loading="lazy"
          decoding="async"
        />

        <TextButton
          class="establishment-view__explore-button"
          :active="false"
          label="Explore Statements"
          @select="openExplore"
        />
      </section>

      <EstablishmentStatementSection
        v-if="showStatementSection"
        ref="statementSection"
        @enter="scrollToExplore"
      />
    </template>
  </div>
</template>

<style scoped>
@import '../css/views/EstablishmentView.css';
</style>
