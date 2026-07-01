<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import landingCopy from '../../content/landingCopy.json'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import type { PatternLabelKey } from '../../types/intentData'
import {
  getStatementPatternAnchors,
  getStatementPatternColor,
} from '../../utils/statementPatterns'
import AuthorPortrait from '../author/AuthorPortrait.vue'
import EstablishmentNote from './EstablishmentNote.vue'
import StatementCard from '../common/StatementCard.vue'

type NoteStartCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface Point {
  x: number
  y: number
}

const emit = defineEmits<{
  enter: []
}>()

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const rootElement = ref<HTMLElement | null>(null)
const statementElement = ref<HTMLElement | null>(null)
const notesElement = ref<HTMLElement | null>(null)
const authorMarkElement = ref<HTMLElement | null>(null)
const statementTarget = ref<Point>({ x: 0, y: 0 })
const noteProgresses = ref([0, 0, 0])
const statementHighlightProgress = ref(0)
const noteStartCorners = ['bottom-right', 'bottom-left', 'top-left'] as const satisfies readonly NoteStartCorner[]
const mobilizationHighlightLabel = 'no_alternative_framing' satisfies PatternLabelKey
const featuredRecord = computed(
  () => statementStore.records.find((record) => record.id === 'legislators-0117') ?? statementStore.records[0],
)
const featuredAuthor = computed(() =>
  featuredRecord.value ? authorStore.getAuthorInstance(featuredRecord.value.author) : null,
)
const statementNotes = computed(() => landingCopy.statementNotes)
const mobilizationHighlightAnchors = computed(() =>
  featuredRecord.value && statementHighlightProgress.value > 0
    ? getStatementPatternAnchors(featuredRecord.value, mobilizationHighlightLabel)
    : [],
)
const mobilizationHighlightColor = getStatementPatternColor(mobilizationHighlightLabel)

let statementPopTween: gsap.core.Tween | null = null
let statementIsVisible = false
let authorMarkTween: gsap.core.Tween | null = null
let authorMarkIsVisible = false

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function noteProgressAt(progress: number, start: number, duration: number) {
  return clampProgress((progress - start) / duration)
}

function updateStatementTarget() {
  if (!statementElement.value) return

  const rect = statementElement.value.getBoundingClientRect()

  statementTarget.value = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function setInitialAnimationStyles() {
  if (statementElement.value) {
    gsap.set(statementElement.value, {
      autoAlpha: 0,
      pointerEvents: 'none',
      scale: 1,
      xPercent: -50,
      yPercent: -50,
    })
  }

  if (notesElement.value) {
    gsap.set(notesElement.value, { autoAlpha: 0 })
  }

  if (authorMarkElement.value) {
    gsap.set(authorMarkElement.value, {
      autoAlpha: 0,
      scale: 0.92,
      xPercent: -170,
      yPercent: -50,
    })
  }
}

function showStatement() {
  if (!statementElement.value || statementIsVisible) return

  statementIsVisible = true
  statementPopTween?.kill()
  statementPopTween = gsap.fromTo(
    statementElement.value,
    {
      autoAlpha: 0,
      pointerEvents: 'auto',
      scale: 0.5,
      xPercent: -50,
      yPercent: -50,
    },
    {
      autoAlpha: 1,
      duration: 1,
      scale: 1,
      ease: 'elastic.out(1, 0.5)',
    },
  )
}

function hideStatement() {
  if (!statementElement.value || !statementIsVisible) return

  statementIsVisible = false
  statementPopTween?.kill()
  statementPopTween = null
  gsap.set(statementElement.value, {
    autoAlpha: 0,
    pointerEvents: 'none',
    scale: 1,
    xPercent: -50,
    yPercent: -50,
  })
}

function showAuthorMark() {
  if (!authorMarkElement.value || authorMarkIsVisible) return

  authorMarkIsVisible = true
  authorMarkTween?.kill()
  authorMarkTween = gsap.to(authorMarkElement.value, {
    autoAlpha: 1,
    duration: 0.72,
    ease: 'power3.out',
    scale: 1,
    xPercent: -50,
    yPercent: -50,
  })
}

function hideAuthorMark() {
  if (!authorMarkElement.value || !authorMarkIsVisible) return

  authorMarkIsVisible = false
  authorMarkTween?.kill()
  authorMarkTween = gsap.to(authorMarkElement.value, {
    autoAlpha: 0,
    duration: 0.2,
    ease: 'power2.out',
    scale: 0.92,
    xPercent: -170,
    yPercent: -50,
  })
}

function hideStatementSequence() {
  hideStatement()
  hideAuthorMark()
  statementHighlightProgress.value = 0

  if (notesElement.value) {
    gsap.set(notesElement.value, { autoAlpha: 0 })
  }
}

function updateScrollState() {
  if (!rootElement.value) return

  const rootBounds = rootElement.value.getBoundingClientRect()
  const releaseLine = window.innerHeight / 3
  const isSequenceActive = rootBounds.top <= releaseLine && rootBounds.bottom > window.innerHeight

  if (!isSequenceActive) {
    hideStatementSequence()
    return
  }

  const releaseDistance = releaseLine - rootBounds.top
  const notesStartDistance = window.innerHeight * 0.78
  const noteTimelineUnit = window.innerHeight * 0.72
  const notesProgress = Math.max(0, (releaseDistance - notesStartDistance) / noteTimelineUnit)
  const firstNoteProgress = noteProgressAt(notesProgress, 0, 1.6)
  const secondNoteProgress = noteProgressAt(notesProgress, 3.2, 1.6)
  const thirdNoteProgress = noteProgressAt(notesProgress, 5.3, 1.6)

  updateStatementTarget()
  noteProgresses.value = [firstNoteProgress, secondNoteProgress, thirdNoteProgress]
  statementHighlightProgress.value = noteProgressAt(notesProgress, 2.8, 0.35)

  if (notesElement.value) {
    gsap.set(notesElement.value, {
      autoAlpha: Math.max(firstNoteProgress, secondNoteProgress, thirdNoteProgress),
    })
  }

  if (releaseDistance > 0) {
    showStatement()
  } else {
    hideStatement()
  }

  if (notesProgress >= 2.1) {
    showAuthorMark()
  } else {
    hideAuthorMark()
  }
}

onMounted(setInitialAnimationStyles)

onBeforeUnmount(() => {
  statementPopTween?.kill()
  statementPopTween = null
  authorMarkTween?.kill()
  authorMarkTween = null
})

defineExpose({
  updateScrollState,
})
</script>

<template>
  <div
    ref="rootElement"
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
        :anchor-color="mobilizationHighlightColor"
        :anchor-texts="mobilizationHighlightAnchors"
      />
    </div>
    <div
      ref="notesElement"
      class="establishment-view__notes"
      aria-label="Kommentierende Notizen zum Statement"
    >
      <EstablishmentNote
        v-for="(note, index) in statementNotes"
        :key="note.id"
        class="establishment-view__note"
        :class="`establishment-view__note--${index + 1}`"
        :progress="noteProgresses[index] ?? 0"
        :start-corner="noteStartCorners[index] ?? 'bottom-right'"
        :target="statementTarget"
        :text="note.body"
      />
    </div>
    <div
      ref="authorMarkElement"
      class="establishment-view__author-mark"
      aria-hidden="true"
    >
      <AuthorPortrait
        v-if="featuredAuthor"
        :author="featuredAuthor"
        :show-rings="false"
        :size="240"
      />
    </div>
  </div>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentStatementSection.css';
</style>
