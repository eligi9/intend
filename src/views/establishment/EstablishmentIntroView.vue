<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import EstablishmentFeaturedStatement from '../../components/establishment/EstablishmentFeaturedStatement.vue'
import EstablishmentHeroSection from '../../components/establishment/EstablishmentHeroSection.vue'
import EstablishmentIntroSection from '../../components/establishment/EstablishmentIntroSection.vue'
import { useStatementStore } from '../../stores/statementStore'
import {
  getAcceleratedContainerScrollOffset,
  getNaturalViewportTop,
} from '../../utils/scrollMotion'

interface EstablishmentIntroSectionExpose {
  getIntroCopyElement: () => HTMLElement | null
  getIntroRootElement: () => HTMLElement | null
}

defineProps<{
  paragraphs: readonly string[]
}>()

const rootElement = ref<HTMLElement | null>(null)
const headingElement = ref<HTMLElement | null>(null)
const introSection = ref<EstablishmentIntroSectionExpose | null>(null)
const statementStore = useStatementStore()
const primaryStatementScrollCompensation = 0.4
const headingHoldViewportRatio = 0.5
let motionMedia: ReturnType<typeof gsap.matchMedia> | null = null
let prefersReducedMotion = false
const primaryFeaturedRecord = computed(() =>
  statementStore.records.find((record) => record.id === 'decisionmakers-0024'),
)
const secondaryFeaturedRecord = computed(() =>
  statementStore.records.find((record) => record.id === 'legislators-0005'),
)

function getHeadingPositions() {
  const initialY = window.innerHeight * 0.61803398875

  return { initialY }
}

function getHeadingY(introRootTop: number, initialY: number) {
  const headingHoldDistance = window.innerHeight * headingHoldViewportRatio
  const scrollDistance = window.innerHeight - introRootTop
  const distanceAfterHold = Math.max(0, scrollDistance - headingHoldDistance)

  return initialY - distanceAfterHold
}

function updateScrollState() {
  const introCopy = introSection.value?.getIntroCopyElement()
  const introRoot = introSection.value?.getIntroRootElement()
  const heading = headingElement.value

  if (!rootElement.value || !introCopy || !introRoot || !heading) {
    return
  }

  const { initialY } = getHeadingPositions()
  const rootRect = rootElement.value.getBoundingClientRect()
  const naturalIntroRootTop = getNaturalViewportTop(introRoot)
  const containerAcceleratedOffset = prefersReducedMotion
    ? 0
    : getAcceleratedContainerScrollOffset(introRoot)
  const headingY =
    getHeadingY(naturalIntroRootTop, initialY) + containerAcceleratedOffset

  gsap.set(heading, { autoAlpha: 1, y: headingY })
  gsap.set(introRoot, { y: containerAcceleratedOffset })
  const primaryStatement = rootElement.value.querySelector<HTMLElement>(
    '.establishment-featured-statement--primary',
  )

  if (primaryStatement) {
    gsap.set(primaryStatement, {
      y: Math.max(0, -rootRect.top) * primaryStatementScrollCompensation,
    })
  }

  gsap.set(introCopy, {
    autoAlpha: 1,
    y: 0,
  })
}

onMounted(() => {
  motionMedia = gsap.matchMedia()
  motionMedia.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      prefersReducedMotion = Boolean(context.conditions?.reduceMotion)
      updateScrollState()
    },
    rootElement.value ?? undefined,
  )
})

onBeforeUnmount(() => {
  const introCopy = introSection.value?.getIntroCopyElement()
  const introRoot = introSection.value?.getIntroRootElement()

  if (headingElement.value) {
    gsap.killTweensOf(headingElement.value)
  }

  if (introCopy) {
    gsap.killTweensOf(introCopy)
    gsap.set(introCopy, { clearProps: 'transform' })
  }

  if (introRoot) {
    gsap.killTweensOf(introRoot)
    gsap.set(introRoot, { clearProps: 'transform' })
  }

  motionMedia?.revert()
  motionMedia = null
})

defineExpose({
  updateScrollState,
})
</script>

<template>
  <section ref="rootElement" class="establishment-intro-view">
    <div class="establishment-intro-view__hero-container">
      <EstablishmentFeaturedStatement
        v-if="secondaryFeaturedRecord"
        class="establishment-featured-statement--secondary"
        highlight-label="no_alternative_framing"
        :record="secondaryFeaturedRecord"
      />

      <EstablishmentFeaturedStatement
        v-if="primaryFeaturedRecord"
        class="establishment-featured-statement--primary"
        :record="primaryFeaturedRecord"
      />

      <div
        ref="headingElement"
        class="establishment-view__sticky-heading"
        aria-labelledby="landing-title"
      >
        <div class="establishment-view__sticky-heading-inner">
          <div class="establishment-view__content">
            <h1 id="landing-title">Incitement to<br />Genocide</h1>
            <p class="establishment-view__subtitle">
              How can language make violence seem justified?
            </p>
          </div>
        </div>
      </div>

      <EstablishmentHeroSection />
    </div>

    <EstablishmentIntroSection
      ref="introSection"
      :paragraphs="paragraphs"
    />
  </section>
</template>

<style scoped>
@import '../../css/views/establishment/EstablishmentIntroView.css';
</style>
