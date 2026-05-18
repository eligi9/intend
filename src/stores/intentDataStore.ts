import { defineStore } from 'pinia'
import dataset from '../../data/intent-dataset.json'
import type { IntentDataset, IntentFilters, IntentLabelKey, IntentRecord } from '../types/intentData'
import { matchesIntentFilters, uniqueSorted } from '../utils/intentFilters'

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
    readIndex: 0,
    sliceOffset: 0,
    sliceSize: 25,
  }),

  getters: {
    totalCount: (state) => state.records.length,

    sectors: (state) => uniqueSorted(state.records.map((record) => record.sector)),

    authors: (state) => uniqueSorted(state.records.map((record) => record.author)),

    labelKeys: () => intentLabelKeys,

    filteredRecords: (state) =>
      state.records.filter((record) => matchesIntentFilters(record, state.filters)),

    filteredCount(): number {
      return this.filteredRecords.length
    },

    currentSlice(): IntentRecord[] {
      return this.filteredRecords.slice(this.sliceOffset, this.sliceOffset + this.sliceSize)
    },

    currentRecord(): IntentRecord | null {
      return this.filteredRecords[this.readIndex] ?? null
    },

    currentRecordPosition(): { current: number; total: number } {
      return {
        current: this.filteredCount === 0 ? 0 : this.readIndex + 1,
        total: this.filteredCount,
      }
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
      this.readIndex = 0
    },

    setReadIndex(index: number) {
      this.readIndex = Math.max(0, Math.min(index, Math.max(0, this.filteredCount - 1)))
    },

    nextRecord() {
      if (this.filteredCount === 0) return
      this.readIndex = (this.readIndex + 1) % this.filteredCount
      this.sliceOffset = Math.floor(this.readIndex / this.sliceSize) * this.sliceSize
    },

    previousRecord() {
      if (this.filteredCount === 0) return
      this.readIndex = (this.readIndex - 1 + this.filteredCount) % this.filteredCount
      this.sliceOffset = Math.floor(this.readIndex / this.sliceSize) * this.sliceSize
    },
  },
})
