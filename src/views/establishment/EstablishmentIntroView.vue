<script setup lang="ts">
import { ref } from 'vue'
import gsap from 'gsap'
import VerticalLineGrid from '../../components/common/VerticalLineGrid.vue'
import EstablishmentHeroSection from '../../components/establishment/EstablishmentHeroSection.vue'
import EstablishmentIntroSection from '../../components/establishment/EstablishmentIntroSection.vue'

interface EstablishmentIntroSectionExpose {
  getIntroCopyElement: () => HTMLElement | null
  getIntroVisualElement: () => HTMLElement | null
}

defineProps<{
  paragraphs: readonly string[]
}>()

const rootElement = ref<HTMLElement | null>(null)
const headingElement = ref<HTMLElement | null>(null)
const introSection = ref<EstablishmentIntroSectionExpose | null>(null)
const introGridAreaCount = 21
const introGridLabels: string[] = []

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function getHeadingPositions(heading: HTMLElement) {
  const stageHeight = Math.min(window.innerHeight, window.innerWidth * 982 / 1512)
  const initialY = 645 / 982 * stageHeight
  const upperThirdCenter = window.innerHeight / 6
  const stickY = Math.max(0, upperThirdCenter - heading.offsetHeight / 2)

  return { initialY, stickY }
}

function updateScrollState() {
  const introCopy = introSection.value?.getIntroCopyElement()
  const introVisual = introSection.value?.getIntroVisualElement()
  const heading = headingElement.value

  if (!rootElement.value || !introCopy || !introVisual || !heading) {
    return
  }

  const { initialY, stickY } = getHeadingPositions(heading)
  const introFadeDistance = window.innerHeight * 0.95
  const headingFadeDistance = window.innerHeight * 0.34
  const introRect = introCopy.getBoundingClientRect()
  const releaseLine = window.innerHeight / 3
  const releaseDistance = Math.max(0, releaseLine - introRect.top)
  const headingProgress = clampProgress(releaseDistance / headingFadeDistance)
  const introProgress = clampProgress(releaseDistance / introFadeDistance)
  const rootOffset = rootElement.value.offsetTop
  const headingY = releaseDistance > 0
    ? stickY - releaseDistance * 1.2
    : Math.max(stickY, initialY - (window.scrollY - rootOffset))

  gsap.set(heading, { autoAlpha: 1 - headingProgress, y: headingY })
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
