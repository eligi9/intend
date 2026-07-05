<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/locomotive-scroll.css'
import VerticalLineGrid from '../components/common/VerticalLineGrid.vue'
import EstablishmentPatternTypesSection from '../components/establishment/EstablishmentPatternTypesSection.vue'
import EstablishmentStatementSection from '../components/establishment/EstablishmentStatementSection.vue'
import { pageScrollLockEventName } from '../composables/usePageScrollLock'
import landingCopy from '../content/landingCopy.json'
import ExploreView from './explore/ExploreView.vue'
import EstablishmentIntroView from './establishment/EstablishmentIntroView.vue'

interface EstablishmentIntroViewExpose {
  updateScrollState: () => void
}

interface EstablishmentStatementSectionExpose {
  updateScrollState: () => void
}

const viewRoot = ref<HTMLElement | null>(null)
const introSection = ref<EstablishmentIntroViewExpose | null>(null)
const statementSection = ref<EstablishmentStatementSectionExpose | null>(null)
const showExplore = ref(false)
const showStatementSection = false
const establishmentGridAreaCount = 7
const establishmentGridLabels: string[] = []
let locomotiveScroll: LocomotiveScroll | null = null
let scrollAnimationFrame = 0
let overlayScrollLocked = false

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
  statementSection.value?.updateScrollState()
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

function handleOverlayScrollLock(event: Event) {
  overlayScrollLocked = Boolean((event as CustomEvent<{ locked: boolean }>).detail?.locked)

  if (overlayScrollLocked) {
    locomotiveScroll?.stop()
    return
  }

  locomotiveScroll?.start()
}

onMounted(() => {
  window.addEventListener(pageScrollLockEventName, handleOverlayScrollLock)
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
  window.removeEventListener('scroll', requestLandingScrollUpdate)
  window.removeEventListener('resize', requestLandingScrollUpdate)
  window.visualViewport?.removeEventListener('resize', requestLandingScrollUpdate)
  gsap.ticker.remove(updateLandingScrollFromTicker)
  if (scrollAnimationFrame) {
    window.cancelAnimationFrame(scrollAnimationFrame)
  }
  locomotiveScroll?.destroy()
  locomotiveScroll = null
})
</script>

<template>
  <div ref="viewRoot" class="establishment-view">
    <ExploreView v-if="showExplore" />

    <template v-else>
      <EstablishmentIntroView
        ref="introSection"
        :paragraphs="landingCopy.intro.paragraphs"
      />

      <EstablishmentPatternTypesSection />

      <section class="establishment-view__explore-cta" aria-label="Explore statements">
        <VerticalLineGrid
          class="establishment-view__explore-grid"
          :area-count="establishmentGridAreaCount"
          :labels="establishmentGridLabels"
        />

        <button
          type="button"
          class="establishment-view__explore-button"
          @click="openExplore"
        >
          Explore Statements
        </button>
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
