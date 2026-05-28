<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import FilterButton from '../../components/filter-button/FilterButton.vue'
import StatementCard from '../../components/statement-card/StatementCard.vue'
import { intentLabelKeys, useStatementStore } from '../../stores/statementStore'
import type { IntentLabelKey } from '../../types/intentData'
import { intentTaxonomy } from '../../types/intentTaxonomy'
import {
  getActiveLabels,
  taxonomyButtonColors,
} from '../../utils/intentLabels'
import { toggleArrayItem } from '../../utils/arrays'

const store = useStatementStore()
const { currentRecord, currentRecordPosition, filters, sectors } = storeToRefs(store)
const swipeStart = ref<{ x: number; y: number } | null>(null)

const activeLabels = computed(() => {
  if (!currentRecord.value) return []
  return getActiveLabels(currentRecord.value, intentLabelKeys)
})

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
        <h2>Statements</h2>
      </div>
    </header>

    <section class="read-controls" aria-label="Statement Filter">
      <div class="read-search">
        <small>Search</small>
        <div class="read-search__panel">
          <input
            :value="filters.query"
            type="search"
            placeholder="Autor, Kontext oder Statement"
            @input="store.setQuery(($event.target as HTMLInputElement).value)"
          />
        </div>
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

    <StatementCard
      v-if="currentRecord"
      :record="currentRecord"
      @touchstart.passive="startStatementSwipe"
      @touchend.passive="finishStatementSwipe"
    />

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
  </section>
</template>

<style scoped>
@import './ReadView.css';
</style>
