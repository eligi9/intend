import { defineStore } from 'pinia'
import dataset from '../../data/intent-dataset.json'
import type { IntentDataset, IntentFilters, IntentLabelKey, IntentRecord } from '../types/intentData'

export const intentLabelKeys = [
  'enemy_image',
  'homogenization',
  'immutability',
  'essentialization',
  'dehumanization',
  'threat_construction',
  'just_cause',
  'security_rationale',
  'selfdefence_counterterrorism',
  'retaliation',
  'individual_needs',
  'meaning',
  'status',
  'hope_for_victory',
  'rhetorical_foreclosure',
  'no_alternative_framing',
  'humanity_as_weakness',
  'external_criticism_rejection',
] as const satisfies readonly IntentLabelKey[]

const intentDataset = dataset as IntentDataset

function includesText(value: string | null | undefined, query: string) {
  return value?.toLowerCase().includes(query) ?? false
}

function isLabelActive(record: IntentRecord, label: IntentLabelKey) {
  return record[label] === 'yes'
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

export const useIntentDataStore = defineStore('intentData', {
  state: () => ({
    records: intentDataset.records,
    filters: {
      query: '',
      sectors: [],
      authors: [],
      labelsAny: [],
      labelsAll: [],
    } as IntentFilters,
    sliceOffset: 0,
    sliceSize: 25,
  }),

  getters: {
    totalCount: (state) => state.records.length,

    sectors: (state) => uniqueSorted(state.records.map((record) => record.sector)),

    authors: (state) => uniqueSorted(state.records.map((record) => record.author)),

    labelKeys: () => intentLabelKeys,

    filteredRecords: (state) => {
      const query = state.filters.query.trim().toLowerCase()

      return state.records.filter((record) => {
        const matchesQuery =
          query.length === 0 ||
          includesText(record.author, query) ||
          includesText(record.position, query) ||
          includesText(record.context, query) ||
          includesText(record.statement, query)

        const matchesSector =
          state.filters.sectors.length === 0 || state.filters.sectors.includes(record.sector)

        const matchesAuthor =
          state.filters.authors.length === 0 || state.filters.authors.includes(record.author)

        const matchesAnyLabel =
          state.filters.labelsAny.length === 0 ||
          state.filters.labelsAny.some((label) => isLabelActive(record, label))

        const matchesAllLabels =
          state.filters.labelsAll.length === 0 ||
          state.filters.labelsAll.every((label) => isLabelActive(record, label))

        return matchesQuery && matchesSector && matchesAuthor && matchesAnyLabel && matchesAllLabels
      })
    },

    filteredCount(): number {
      return this.filteredRecords.length
    },

    currentSlice(): IntentRecord[] {
      return this.filteredRecords.slice(this.sliceOffset, this.sliceOffset + this.sliceSize)
    },

    currentSliceMeta(): { offset: number; size: number; count: number; total: number; hasNext: boolean } {
      return {
        offset: this.sliceOffset,
        size: this.sliceSize,
        count: this.currentSlice.length,
        total: this.filteredCount,
        hasNext: this.sliceOffset + this.sliceSize < this.filteredCount,
      }
    },
  },

  actions: {
    setQuery(query: string) {
      this.filters.query = query
      this.resetSlice()
    },

    setSectors(sectors: string[]) {
      this.filters.sectors = sectors
      this.resetSlice()
    },

    setAuthors(authors: string[]) {
      this.filters.authors = authors
      this.resetSlice()
    },

    setLabelsAny(labels: IntentLabelKey[]) {
      this.filters.labelsAny = labels
      this.resetSlice()
    },

    setLabelsAll(labels: IntentLabelKey[]) {
      this.filters.labelsAll = labels
      this.resetSlice()
    },

    clearFilters() {
      this.filters = {
        query: '',
        sectors: [],
        authors: [],
        labelsAny: [],
        labelsAll: [],
      }
      this.resetSlice()
    },

    setSlice(offset: number, size?: number) {
      this.sliceSize = Math.max(1, size ?? this.sliceSize)
      this.sliceOffset = Math.max(0, Math.min(offset, Math.max(0, this.filteredCount - 1)))
    },

    nextSlice() {
      this.setSlice(this.sliceOffset + this.sliceSize)
    },

    previousSlice() {
      this.setSlice(this.sliceOffset - this.sliceSize)
    },

    resetSlice() {
      this.sliceOffset = 0
    },
  },
})
