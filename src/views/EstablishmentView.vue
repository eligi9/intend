<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/locomotive-scroll.css'
import StatementCard from '../components/StatementCard.vue'
import landingCopy from '../content/landingCopy.json'
import { useStatementStore } from '../stores/statementStore'

const emit = defineEmits<{
  enter: []
}>()

const statementStore = useStatementStore()
const viewRoot = ref<HTMLElement | null>(null)
const headingElement = ref<HTMLElement | null>(null)
const introCopyElement = ref<HTMLElement | null>(null)
const introVisualElement = ref<HTMLElement | null>(null)
const statementElement = ref<HTMLElement | null>(null)
const featuredRecord = computed(() => statementStore.records.find((record) => record.id === 'legislators-0001') ?? statementStore.records[0])
let locomotiveScroll: LocomotiveScroll | null = null
let gsapContext: gsap.Context | null = null
let updateLandingScrollState: (() => void) | null = null
let scrollAnimationFrame = 0
let statementPopTween: gsap.core.Tween | null = null
let statementIsVisible = false

gsap.registerPlugin(ScrollTrigger)
gsap.ticker.lagSmoothing(0)

function requestLandingScrollUpdate() {
  if (scrollAnimationFrame) {
    return
  }

  scrollAnimationFrame = window.requestAnimationFrame(() => {
    scrollAnimationFrame = 0
    updateLandingScrollState?.()
  })
}

function updateLandingScrollFromTicker() {
  updateLandingScrollState?.()
}

function getHeadingPositions(heading: HTMLElement) {
  const stageHeight = Math.min(window.innerHeight, window.innerWidth * 982 / 1512)
  const initialY = 645 / 982 * stageHeight
  const upperThirdCenter = window.innerHeight / 6
  const stickY = Math.max(0, upperThirdCenter - heading.offsetHeight / 2)

  return { initialY, stickY }
}

function createScrollAnimations() {
  if (
    !viewRoot.value ||
    !headingElement.value ||
    !introCopyElement.value ||
    !introVisualElement.value ||
    !statementElement.value
  ) {
    return
  }

  const root = viewRoot.value
  const heading = headingElement.value
  const introCopy = introCopyElement.value
  const introVisual = introVisualElement.value
  const statement = statementElement.value

  gsapContext?.revert()
  gsapContext = gsap.context(() => {
    const { initialY, stickY } = getHeadingPositions(heading)
    const introFadeDistance = window.innerHeight * 0.62
    const headingFadeDistance = window.innerHeight * 0.18
    const statementStartDistance = introFadeDistance * 0.92
    const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1)

    gsap.set(statement, { autoAlpha: 0, xPercent: -50, yPercent: -50, scale: 1 })

    const showStatement = () => {
      if (statementIsVisible) {
        return
      }

      statementIsVisible = true
      statementPopTween?.kill()
      statementPopTween = gsap.fromTo(statement, {
        autoAlpha: 0,
        xPercent: -50,
        yPercent: -50,
        scale: 0.5,
      }, {
        autoAlpha: 1,
        duration: 1,
        scale: 1,
        ease: 'elastic.out(1, 0.5)',
      })
    }
    const hideStatement = () => {
      if (!statementIsVisible) {
        return
      }

      statementIsVisible = false
      statementPopTween?.kill()
      statementPopTween = null
      gsap.set(statement, { autoAlpha: 0, xPercent: -50, yPercent: -50, scale: 1 })
    }
    const updateScrollState = () => {
      const scroll = window.scrollY
      const textRect = introCopy.getBoundingClientRect()
      const releaseLine = window.innerHeight / 3
      const releaseDistance = Math.max(0, releaseLine - textRect.top)
      const headingProgress = clampProgress(releaseDistance / headingFadeDistance)
      const headingY = releaseDistance > 0
        ? stickY - releaseDistance * 2.2
        : Math.max(stickY, initialY - scroll)
      const introProgress = clampProgress(releaseDistance / introFadeDistance)
      const shouldShowStatement = releaseDistance >= statementStartDistance

      gsap.set(heading, { autoAlpha: 1 - headingProgress, y: headingY })
      gsap.set([introCopy, introVisual], {
        autoAlpha: 1 - introProgress,
        y: -52 * introProgress,
      })
      if (shouldShowStatement) {
        showStatement()
      } else {
        hideStatement()
      }
    }

    updateLandingScrollState = updateScrollState
    updateScrollState()

    ScrollTrigger.create({
      id: 'establishment-sequence',
      trigger: document.documentElement,
      start: 'top top',
      end: 'max',
      scrub: true,
      invalidateOnRefresh: true,
      onRefresh: updateScrollState,
      onUpdate: updateScrollState,
    })
  }, root)
}

onMounted(() => {
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
      scrollCallback: () => {
        updateLandingScrollState?.()
        ScrollTrigger.update()
      },
    })

    locomotiveScroll.lenisInstance?.on('scroll', ScrollTrigger.update)
    createScrollAnimations()
    gsap.ticker.add(updateLandingScrollFromTicker)

    window.setTimeout(() => {
      locomotiveScroll?.resize()
      ScrollTrigger.refresh()
      updateLandingScrollState?.()
    }, 0)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', requestLandingScrollUpdate)
  window.removeEventListener('resize', requestLandingScrollUpdate)
  window.visualViewport?.removeEventListener('resize', requestLandingScrollUpdate)
  gsapContext?.revert()
  gsapContext = null
  updateLandingScrollState = null
  statementPopTween?.kill()
  statementPopTween = null
  statementIsVisible = false
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
    <div
      ref="headingElement"
      class="establishment-view__sticky-heading"
      aria-labelledby="landing-title"
    >
      <div class="establishment-view__sticky-heading-inner">
        <div class="establishment-view__content">
          <h1 id="landing-title">
            Rhetorical<br />
            Mobilization Strategies
          </h1>
          <p>based on LAW FOR PALESTINES - INTENT</p>
        </div>
      </div>
    </div>

    <div class="establishment-view__panel establishment-view__hero" aria-labelledby="landing-title">
      <div class="establishment-view__stage">
        <div
          class="establishment-view__bars"
          aria-hidden="true"
        >
          <span class="establishment-view__bar establishment-view__bar--one">
            <i />
            <b />
          </span>
          <span class="establishment-view__bar establishment-view__bar--two">
            <i />
            <b />
          </span>
          <span class="establishment-view__bar establishment-view__bar--three">
            <i />
            <b />
          </span>
          <span class="establishment-view__bar establishment-view__bar--four">
            <i />
          </span>
          <span class="establishment-view__bar establishment-view__bar--five">
            <i />
            <b />
          </span>
          <span class="establishment-view__bar establishment-view__bar--six">
            <i />
            <b />
          </span>
        </div>
      </div>
    </div>

    <div
      class="establishment-view__panel establishment-view__intro"
      aria-label="Einordnung der Analyse"
    >
      <div class="establishment-view__intro-inner">
        <div class="establishment-view__text">
          <div
            ref="introCopyElement"
            class="establishment-view__copy"
          >
            <p v-for="paragraph in landingCopy.intro.paragraphs" :key="paragraph">
              {{ paragraph }}
            </p>
          </div>
        </div>
        <div
          class="establishment-view__visual"
          aria-hidden="true"
          ref="introVisualElement"
        >
          <span class="establishment-view__intro-bar establishment-view__intro-bar--one" />
          <span class="establishment-view__intro-bar establishment-view__intro-bar--two" />
          <span class="establishment-view__intro-bar establishment-view__intro-bar--three" />
          <span class="establishment-view__intro-bar establishment-view__intro-bar--four" />
          <span class="establishment-view__intro-bar establishment-view__intro-bar--five" />
        </div>
      </div>
    </div>

    <div
      class="establishment-view__panel establishment-view__statement"
      aria-label="Beispielstatement"
    >
      <div
        ref="statementElement"
        class="establishment-view__statement-inner"
        role="button"
        tabindex="0"
        aria-label="Zur Übersicht wechseln"
        @click="emit('enter')"
        @keydown.enter.prevent="emit('enter')"
        @keydown.space.prevent="emit('enter')"
      >
        <StatementCard
          v-if="featuredRecord"
          :record="featuredRecord"
          :author-link="false"
          :compact-heading="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../css/views/EstablishmentView.css';
</style>
