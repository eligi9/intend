<script setup lang="ts">
import { ref } from 'vue'
import gsap from 'gsap'
import VerticalLineGrid from '../../components/common/VerticalLineGrid.vue'
import EstablishmentHeroSection from '../../components/establishment/EstablishmentHeroSection.vue'
import EstablishmentIntroSection from '../../components/establishment/EstablishmentIntroSection.vue'

interface EstablishmentIntroSectionExpose {
  getIntroCopyElement: () => HTMLElement | null
  getIntroRootElement: () => HTMLElement | null
  getIntroVisualElement: () => HTMLElement | null
}

defineProps<{
  paragraphs: readonly string[]
}>()

const rootElement = ref<HTMLElement | null>(null)
const headingElement = ref<HTMLElement | null>(null)
const introSection = ref<EstablishmentIntroSectionExpose | null>(null)
const introGridAreaCount = 7
const introGridLabels: string[] = []

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function getHeadingPositions() {
  const initialY = window.innerHeight * 0.61803398875
  const secondPageUpperRowCenter = window.innerHeight * 0.38197 / 2
  const secondPageY = secondPageUpperRowCenter

  return { initialY, secondPageY }
}

function updateScrollState() {
  const introCopy = introSection.value?.getIntroCopyElement()
  const introRoot = introSection.value?.getIntroRootElement()
  const introVisual = introSection.value?.getIntroVisualElement()
  const heading = headingElement.value

  if (!rootElement.value || !introCopy || !introRoot || !introVisual || !heading) {
    return
  }

  const { initialY, secondPageY } = getHeadingPositions()
  const introFadeDistance = window.innerHeight * 0.95
  const introRootRect = introRoot.getBoundingClientRect()
  const introRect = introCopy.getBoundingClientRect()
  const releaseLine = window.innerHeight / 3
  const releaseDistance = Math.max(0, releaseLine - introRect.top)
  const headingArrivalProgress = clampProgress(1 - introRootRect.top / window.innerHeight)
  const introProgress = clampProgress(releaseDistance / introFadeDistance)
  const arrivingHeadingY = initialY + (secondPageY - initialY) * headingArrivalProgress
  const headingY = introRootRect.top < 0
    ? secondPageY + introRootRect.top
    : arrivingHeadingY

  gsap.set(heading, { autoAlpha: 1, y: headingY })
  gsap.set([introCopy, introVisual], {
    autoAlpha: 1 - introProgress,
    y: -52 * introProgress,
  })
}

defineExpose({
  updateScrollState,
})
</script>

<template>
  <section ref="rootElement" class="establishment-intro-view">
    <VerticalLineGrid
      class="establishment-intro-view__grid"
      :area-count="introGridAreaCount"
      :labels="introGridLabels"
    />

    <div
      ref="headingElement"
      class="establishment-view__sticky-heading"
      aria-labelledby="landing-title"
    >
      <div class="establishment-view__sticky-heading-inner">
        <div class="establishment-view__content">
          <h1 id="landing-title">Incitement to Genocide</h1>
          <p class="establishment-view__subtitle">
            How can language make violence seem justified?
          </p>
        </div>
      </div>
    </div>

    <EstablishmentHeroSection />

    <EstablishmentIntroSection
      ref="introSection"
      :paragraphs="paragraphs"
    />
  </section>
</template>

<style scoped>
@import '../../css/views/establishment/EstablishmentIntroView.css';
</style>
