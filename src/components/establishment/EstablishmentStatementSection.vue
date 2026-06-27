<script setup lang="ts">
import { ref } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentLabelKey, IntentRecord } from '../../types/intentData'
import AuthorPortrait from '../author/AuthorPortrait.vue'
import EstablishmentNote from './EstablishmentNote.vue'
import StatementCard from '../common/StatementCard.vue'

type NoteStartCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

interface Point {
  x: number
  y: number
}

interface StatementNote {
  id: string
  body: string
}

defineProps<{
  featuredRecord?: IntentRecord
  featuredAuthor?: AuthorInstance | null
  statementNotes: readonly StatementNote[]
  statementTarget: Point
  noteProgresses: readonly number[]
  noteStartCorners: readonly NoteStartCorner[]
  statementHighlightProgress: number
  mobilizationHighlightLabels: readonly IntentLabelKey[]
}>()

const emit = defineEmits<{
  enter: []
  noteAnimationEnd: []
}>()

const statementElement = ref<HTMLElement | null>(null)
const notesElement = ref<HTMLElement | null>(null)
const authorMarkElement = ref<HTMLElement | null>(null)

function getStatementElement() {
  return statementElement.value
}

function getNotesElement() {
  return notesElement.value
}

function getAuthorMarkElement() {
  return authorMarkElement.value
}

defineExpose({
  getStatementElement,
  getNotesElement,
  getAuthorMarkElement,
})
</script>

<template>
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
        :highlight-progress="statementHighlightProgress"
        :highlighted-labels="statementHighlightProgress > 0 ? mobilizationHighlightLabels : []"
        :show-heading="false"
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
        @animation-end="emit('noteAnimationEnd')"
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
