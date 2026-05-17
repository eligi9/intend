<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import FilterButton from './FilterButton.vue'
import { intentLabelKeys, useIntentDataStore } from '../stores/intentDataStore'
import type { IntentLabelKey, IntentRecord } from '../types/intentData'
import { intentTaxonomy } from '../types/intentTaxonomy'

const store = useIntentDataStore()
const { currentRecord, currentRecordPosition, filters, sectors } = storeToRefs(store)

const labelNames: Record<IntentLabelKey, string> = {
  enemy_image: 'Enemy image',
  homogenization: 'Homogenization',
  immutability: 'Immutability',
  essentialization: 'Essentialization',
  dehumanization: 'Dehumanization',
  threat_construction: 'Threat construction',
  just_cause: 'Just cause',
  security_rationale: 'Security rationale',
  selfdefence_counterterrorism: 'Self-defence / counterterrorism',
  retaliation: 'Retaliation',
  individual_needs: 'Individual needs',
  meaning: 'Meaning',
  status: 'Status',
  hope_for_victory: 'Hope for victory',
  rhetorical_foreclosure: 'Rhetorical foreclosure',
  no_alternative_framing: 'No alternative framing',
  humanity_as_weakness: 'Humanity as weakness',
  external_criticism_rejection: 'External criticism rejection',
}

const activeLabels = computed(() => {
  if (!currentRecord.value) return []
  return intentLabelKeys.filter((label) => currentRecord.value?.[label] === 'yes')
})

const taxonomyButtonColors: Record<string, string> = {
  'enemy-image': 'var(--intent-color-enemy-image)',
  'just-cause': 'var(--intent-color-just-cause)',
  'individual-needs': 'var(--intent-color-individual-needs)',
  'rhetorical-foreclosure': 'var(--intent-color-rhetorical-foreclosure)',
}

const parentLabels = new Set<IntentLabelKey>(
  intentTaxonomy.flatMap((group) => (group.parentLabel ? [group.parentLabel] : [])),
)

const subLabelColors = new Map<IntentLabelKey, string>(
  intentTaxonomy.flatMap((group) =>
    group.childLabels.map((label) => [label, taxonomyButtonColors[group.id]] as const),
  ),
)

const visibleSubLabels = computed(() => {
  return activeLabels.value.filter((label) => !parentLabels.has(label))
})

const annotations = computed(() => {
  if (!currentRecord.value) return []

  return activeLabels.value.flatMap((label) => collectAnnotation(currentRecord.value as IntentRecord, label))
})

function collectAnnotation(record: IntentRecord, label: IntentLabelKey) {
  const anchor = record[`${label}_anchor` as keyof IntentRecord]
  const judgement = record[`${label}_bj` as keyof IntentRecord]
  const color = subLabelColors.get(label) ?? '#858b94'
  const briefJustification =
    typeof judgement === 'string' && judgement.length > 0 ? judgement : null
  const anchors =
    typeof anchor === 'string'
      ? anchor
          .split(';')
          .map((item) => item.trim())
          .filter(Boolean)
      : []

  return anchors.map((text) => ({
      label: labelNames[label],
      type: 'Anchor',
      text,
      color,
      briefJustification,
    })) as Array<{
      label: string
      type: string
      text: string
      color: string
      briefJustification: string | null
    }>
}

function toggleSector(sector: string) {
  const next = filters.value.sectors.includes(sector)
    ? filters.value.sectors.filter((item) => item !== sector)
    : [...filters.value.sectors, sector]

  store.setSectors(next)
}

function toggleOverLabel(label: IntentLabelKey) {
  const next = filters.value.labelsAny.includes(label)
    ? filters.value.labelsAny.filter((item) => item !== label)
    : [...filters.value.labelsAny, label]

  store.setLabelsAny(next)
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
                :active="group.parentLabel ? filters.labelsAny.includes(group.parentLabel) : false"
                @click="group.parentLabel && toggleOverLabel(group.parentLabel)"
              />
            </div>
          </section>
        </div>
      </div>
    </section>

    <button v-if="currentRecord" type="button" class="reader-surface" @click="store.nextRecord">
      <span class="reader-heading">
        <strong>{{ currentRecord.author }}</strong>
        <span>{{ currentRecord.sector }} · {{ currentRecord.date }}</span>

        <span class="reader-position">{{ currentRecord.position }}</span>
      </span>

      <span class="reader-statement">{{ currentRecord.statement }}</span>

      <span v-if="currentRecord.context" class="reader-context">{{ currentRecord.context }}</span>
    </button>

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
        {{ labelNames[label] }}
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
