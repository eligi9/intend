<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import FilterButton from '../../components/filter-button/FilterButton.vue'
import { intentLabelKeys, useIntentDataStore } from '../../stores/intentDataStore'
import type { IntentLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import {
  collectIntentAnnotations,
  getActiveLabels,
  getVisibleSubLabels,
  intentLabelNames,
  subLabelColors,
  taxonomyButtonColors,
} from '../../utils/intentLabels'
import { toggleArrayItem } from '../../utils/arrays'

const store = useIntentDataStore()
const { currentRecord, currentRecordPosition, filters, sectors } = storeToRefs(store)
const swipeStart = ref<{ x: number; y: number } | null>(null)

const activeLabels = computed(() => {
  if (!currentRecord.value) return []
  return getActiveLabels(currentRecord.value, intentLabelKeys)
})

const visibleSubLabels = computed(() => getVisibleSubLabels(activeLabels.value))

const annotations = computed(() => {
  if (!currentRecord.value) return []

  return collectIntentAnnotations(currentRecord.value, activeLabels.value)
})

const statementSegments = computed(() => {
  if (!currentRecord.value) return []

  return splitBracketedText(currentRecord.value.statement)
})

function splitBracketedText(text: string) {
  const segments: { text: string; muted: boolean }[] = []
  const bracketPattern = /\[[^\]]*\]/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = bracketPattern.exec(text))) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), muted: false })
    }

    segments.push({ text: match[0], muted: true })
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), muted: false })
  }

  return segments
}

function toggleSector(sector: string) {
  store.setSectors(filters.value.sectors.includes(sector) ? [] : [sector])
}

function toggleOverLabel(label: IntentLabelKey) {
  store.setLabelsAll(toggleArrayItem(filters.value.labelsAll, label))
}

function startStatementSwipe(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return

  swipeStart.value = {
    x: touch.clientX,
    y: touch.clientY,
  }
}

function finishStatementSwipe(event: TouchEvent) {
  if (!swipeStart.value) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - swipeStart.value.x
  const deltaY = touch.clientY - swipeStart.value.y
  swipeStart.value = null

  if (Math.abs(deltaX) < 56 || Math.abs(deltaY) > 72) return

  if (deltaX < 0) {
    store.nextRecord()
    return
  }

  store.previousRecord()
}
</script>

<template>
  <section class="read-view">
    <header class="read-toolbar">
      <div>
        <p class="eyebrow">Read View</p>
        <h2>Statements</h2>
      </div>
    </header>

    <section class="read-controls" aria-label="Statement Filter">
      <div class="read-search">
        <small>Search</small>
        <input
          :value="filters.query"
          type="search"
          placeholder="Autor, Kontext oder Statement"
          @input="store.setQuery(($event.target as HTMLInputElement).value)"
        />
      </div>

      <div class="filter-column">
        <small>Filter</small>

        <div class="filter-panel">
          <section class="filter-group" aria-label="Sector Filter">
            <small>Sector</small>
            <div class="filter-row">
              <FilterButton
                v-for="sector in sectors"
                :key="sector"
                :label="sector"
                color="#858b94"
                :active="filters.sectors.includes(sector)"
                @click="toggleSector(sector)"
              />
            </div>
          </section>

          <section class="filter-group" aria-label="Überlabel Filter">
            <small>Mobilisierung Strategie</small>
            <div class="filter-row">
              <FilterButton
                v-for="group in intentTaxonomy"
                :key="group.id"
                :label="group.label"
                :color="taxonomyButtonColors[group.id]"
                :active="group.parentLabel ? filters.labelsAll.includes(group.parentLabel) : false"
                @click="group.parentLabel && toggleOverLabel(group.parentLabel)"
              />
            </div>
          </section>
        </div>
      </div>
    </section>

    <article
      v-if="currentRecord"
      class="reader-surface"
      @touchstart.passive="startStatementSwipe"
      @touchend.passive="finishStatementSwipe"
    >
      <span class="reader-heading">
        <strong>{{ currentRecord.author }}</strong>
        <span class="reader-meta-line">{{ currentRecord.sector }} · {{ currentRecord.date }}</span>

        <span class="reader-position">{{ currentRecord.position }}</span>
      </span>

      <span class="reader-statement">
        <span
          v-for="(segment, index) in statementSegments"
          :key="`${segment.text}-${index}`"
          :class="{ 'reader-statement-muted': segment.muted }"
        >
          {{ segment.text }}
        </span>
      </span>

      <span v-if="currentRecord.context" class="reader-context">{{ currentRecord.context }}</span>
    </article>

    <div v-else class="empty-state">
      <strong>Keine Statements gefunden</strong>
      <span>Filter zurücksetzen oder Suchbegriff ändern.</span>
    </div>

    <div v-if="currentRecord" class="read-actions">
      <button type="button" @click="store.previousRecord">Zurück</button>
      <button type="button" @click="store.nextRecord">Nächstes Statement</button>
      <div class="read-count">
        <strong>{{ currentRecordPosition.current }}</strong>
        <span>/ {{ currentRecordPosition.total }}</span>
      </div>
    </div>

    <section v-if="visibleSubLabels.length > 0" class="label-strip" aria-label="Aktive Sublabels">
      <span
        v-for="label in visibleSubLabels"
        :key="label"
        :style="{ '--label-color': subLabelColors.get(label) ?? '#858b94' }"
      >
        {{ intentLabelNames[label] }}
      </span>
    </section>

    <section v-if="annotations.length > 0" class="annotation-list" aria-label="Kommentare und Anker">
      <article
        v-for="annotation in annotations"
        :key="`${annotation.label}-${annotation.type}-${annotation.text}`"
        :style="{ '--annotation-color': annotation.color }"
        :tabindex="annotation.briefJustification ? 0 : undefined"
      >
        <small>{{ annotation.label }} · {{ annotation.type }}</small>
        <p>{{ annotation.text }}</p>
        <span v-if="annotation.briefJustification" class="annotation-tooltip" role="tooltip">
          {{ annotation.briefJustification }}
        </span>
      </article>
    </section>
  </section>
</template>

<style scoped>
@import './ReadView.css';
</style>
