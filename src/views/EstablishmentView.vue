<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import LocomotiveScroll from 'locomotive-scroll'
import 'locomotive-scroll/locomotive-scroll.css'
import EstablishmentHeroSection from '../components/establishment/EstablishmentHeroSection.vue'
import EstablishmentIntroSection from '../components/establishment/EstablishmentIntroSection.vue'
import EstablishmentStatementSection from '../components/establishment/EstablishmentStatementSection.vue'
import landingCopy from '../content/landingCopy.json'
import { useAuthorStore } from '../stores/authorStore'
import { useStatementStore } from '../stores/statementStore'

interface EstablishmentIntroSectionExpose {
  getIntroCopyElement: () => HTMLElement | null
  getIntroVisualElement: () => HTMLElement | null
}

interface EstablishmentStatementSectionExpose {
  getStatementElement: () => HTMLElement | null
  getNotesElement: () => HTMLElement | null
  getAuthorMarkElement: () => HTMLElement | null
}

const emit = defineEmits<{
  enter: []
}>()

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const viewRoot = ref<HTMLElement | null>(null)
const headingElement = ref<HTMLElement | null>(null)
const introSection = ref<EstablishmentIntroSectionExpose | null>(null)
const statementSection = ref<EstablishmentStatementSectionExpose | null>(null)
const featuredRecord = computed(() => statementStore.records.find((record) => record.id === 'legislators-0117') ?? statementStore.records[0])
const featuredAuthor = computed(() => (featuredRecord.value ? authorStore.getAuthorInstance(featuredRecord.value.author) : null))
const statementNotes = computed(() => landingCopy.statementNotes)
const statementTarget = ref({ x: 0, y: 0 })
const noteProgresses = ref([0, 0, 0])
const statementHighlightProgress = ref(0)
const noteStartCorners = ['bottom-right', 'bottom-left', 'top-left'] as const
const mobilizationHighlightLabels = ['no_alternative_framing'] as const
let locomotiveScroll: LocomotiveScroll | null = null
let gsapContext: gsap.Context | null = null
let updateLandingScrollState: (() => void) | null = null
let scrollAnimationFrame = 0
let statementPopTween: gsap.core.Tween | null = null
let statementIsVisible = false
let authorMarkTween: gsap.core.Tween | null = null
let authorMarkIsVisible = false

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

function updateStatementTarget(statement: HTMLElement) {
  const rect = statement.getBoundingClientRect()

  statementTarget.value = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function handleNoteAnimationEnd() {
  // Hook for sequencing later annotation steps from outside the note component.
}

function createScrollAnimations() {
  const introCopy = introSection.value?.getIntroCopyElement()
  const introVisual = introSection.value?.getIntroVisualElement()
  const statement = statementSection.value?.getStatementElement()
  const notes = statementSection.value?.getNotesElement()
  const authorMark = statementSection.value?.getAuthorMarkElement()

  if (
    !viewRoot.value ||
    !headingElement.value ||
    !introCopy ||
    !introVisual ||
    !statement ||
    !notes ||
    !authorMark
  ) {
    return
  }

  const root = viewRoot.value
  const heading = headingElement.value

  gsapContext?.revert()
  gsapContext = gsap.context(() => {
    const { initialY, stickY } = getHeadingPositions(heading)
    const introFadeDistance = window.innerHeight * 0.95
    const headingFadeDistance = window.innerHeight * 0.34
    const statementStartDistance = introFadeDistance * 0.92
    const notesStartDistance = statementStartDistance + window.innerHeight * 0.38
    const noteTimelineUnit = window.innerHeight * 0.72
    const clampProgress = (value: number) => Math.min(Math.max(value, 0), 1)
    const noteProgressAt = (progress: number, start: number, duration: number) => clampProgress((progress - start) / duration)

    gsap.set(statement, { autoAlpha: 0, pointerEvents: 'none', xPercent: -50, yPercent: -50, scale: 1 })
    gsap.set(notes, { autoAlpha: 0 })
    gsap.set(authorMark, { autoAlpha: 0, xPercent: -170, yPercent: -50, scale: 0.92 })

    const showStatement = () => {
      if (statementIsVisible) {
        return
      }

      statementIsVisible = true
      statementPopTween?.kill()
      statementPopTween = gsap.fromTo(statement, {
        autoAlpha: 0,
        pointerEvents: 'auto',
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
      gsap.set(statement, { autoAlpha: 0, pointerEvents: 'none', xPercent: -50, yPercent: -50, scale: 1 })
    }
    const showAuthorMark = () => {
      if (authorMarkIsVisible) {
        return
      }

      authorMarkIsVisible = true
      authorMarkTween?.kill()
      authorMarkTween = gsap.to(authorMark, {
        autoAlpha: 1,
        duration: 0.72,
        ease: 'power3.out',
        scale: 1,
        xPercent: -50,
        yPercent: -50,
      })
    }
    const hideAuthorMark = () => {
      if (!authorMarkIsVisible) {
        return
      }

      authorMarkIsVisible = false
      authorMarkTween?.kill()
      authorMarkTween = gsap.to(authorMark, {
        autoAlpha: 0,
        duration: 0.2,
        ease: 'power2.out',
        scale: 0.92,
        xPercent: -170,
        yPercent: -50,
      })
    }
    const updateScrollState = () => {
      const scroll = window.scrollY
      const textRect = introCopy.getBoundingClientRect()
      const releaseLine = window.innerHeight / 3
      const releaseDistance = Math.max(0, releaseLine - textRect.top)
      const headingProgress = clampProgress(releaseDistance / headingFadeDistance)
      const headingY = releaseDistance > 0
        ? stickY - releaseDistance * 1.2
        : Math.max(stickY, initialY - scroll)
      const introProgress = clampProgress(releaseDistance / introFadeDistance)
      const shouldShowStatement = releaseDistance >= statementStartDistance
      const notesProgress = Math.max(0, (releaseDistance - notesStartDistance) / noteTimelineUnit)
      const firstNoteProgress = noteProgressAt(notesProgress, 0, 1.6)
      const shouldShowAuthorMark = notesProgress >= 2.1
      const markerProgress = noteProgressAt(notesProgress, 2.8, 0.35)
      const secondNoteProgress = noteProgressAt(notesProgress, 3.2, 1.6)
      const thirdNoteProgress = noteProgressAt(notesProgress, 5.3, 1.6)

      updateStatementTarget(statement)
      noteProgresses.value = [firstNoteProgress, secondNoteProgress, thirdNoteProgress]
      statementHighlightProgress.value = markerProgress
      gsap.set(heading, { autoAlpha: 1 - headingProgress, y: headingY })
      gsap.set([introCopy, introVisual], {
        autoAlpha: 1 - introProgress,
        y: -52 * introProgress,
      })
      gsap.set(notes, {
        autoAlpha: Math.max(firstNoteProgress, secondNoteProgress, thirdNoteProgress),
      })
      if (shouldShowStatement) {
        showStatement()
      } else {
        hideStatement()
      }
      if (shouldShowAuthorMark) {
        showAuthorMark()
      } else {
        hideAuthorMark()
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
  authorMarkTween?.kill()
  authorMarkTween = null
  authorMarkIsVisible = false
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
      :paragraphs="landingCopy.intro.paragraphs"
    />

    <EstablishmentStatementSection
      ref="statementSection"
      :featured-record="featuredRecord"
      :featured-author="featuredAuthor"
      :statement-notes="statementNotes"
      :statement-target="statementTarget"
      :note-progresses="noteProgresses"
      :note-start-corners="noteStartCorners"
      :statement-highlight-progress="statementHighlightProgress"
      :mobilization-highlight-labels="mobilizationHighlightLabels"
      @enter="emit('enter')"
      @note-animation-end="handleNoteAnimationEnd"
    />
  </div>
</template>

<style scoped>
@import '../css/views/EstablishmentView.css';
</style>
