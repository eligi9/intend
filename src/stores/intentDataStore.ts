import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import authorAdditionalData from '../../data/author-additional-data.json'
import authorDataset from '../../data/author-dataset.json'
import dataset from '../../data/intent-dataset.json'
import type { AuthorAdditionalDataset, AuthorDataset } from '../types/authorData'
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
const intentAuthorDataset = authorDataset as AuthorDataset
const intentAuthorAdditionalData = authorAdditionalData as AuthorAdditionalDataset

const emptyFilters = (): IntentFilters => ({
  query: '',
  sectors: [],
  authors: [],
  labelsAny: [],
  labelsAll: [],
})

export const useIntentDataStore = defineStore('intentData', () => {
  const records = ref<IntentRecord[]>(intentDataset.records)
  const filters = ref<IntentFilters>(emptyFilters())
  const readIndex = ref(0)
  const sliceOffset = ref(0)
  const sliceSize = ref(25)

  const totalCount = computed(() => records.value.length)
  const sectors = computed(() => uniqueSorted(records.value.map((record) => record.sector)))
  const authors = computed(() => uniqueSorted(records.value.map((record) => record.author)))
  const authorProfiles = computed(() =>
    intentAuthorDataset.authors.map((author) => {
      const additional = intentAuthorAdditionalData.authors[author.name]

      return {
        ...author,
        age: additional?.age ?? author.age,
        gender: additional?.gender ?? author.gender,
        notes: additional?.notes ?? null,
        externalIds: additional?.externalIds ?? {},
      }
    }),
  )
  const authorProfileCount = computed(() => authorProfiles.value.length)
  const labelKeys = computed(() => intentLabelKeys)
  const filteredRecords = computed(() =>
    records.value.filter((record) => matchesIntentFilters(record, filters.value)),
  )
  const filteredCount = computed(() => filteredRecords.value.length)
  const currentSlice = computed(() =>
    filteredRecords.value.slice(sliceOffset.value, sliceOffset.value + sliceSize.value),
  )
  const currentRecord = computed(() => filteredRecords.value[readIndex.value] ?? null)
  const currentRecordPosition = computed(() => ({
    current: filteredCount.value === 0 ? 0 : readIndex.value + 1,
    total: filteredCount.value,
  }))
  const currentSliceMeta = computed(() => ({
    offset: sliceOffset.value,
    size: sliceSize.value,
    count: currentSlice.value.length,
    total: filteredCount.value,
    hasNext: sliceOffset.value + sliceSize.value < filteredCount.value,
  }))

  function resetSlice() {
    sliceOffset.value = 0
    readIndex.value = 0
  }

  function setQuery(query: string) {
    filters.value.query = query
    resetSlice()
  }

  function setSectors(sectors: string[]) {
    filters.value.sectors = sectors
    resetSlice()
  }

  function setAuthors(authors: string[]) {
    filters.value.authors = authors
    resetSlice()
  }

  function setLabelsAny(labels: IntentLabelKey[]) {
    filters.value.labelsAny = labels
    resetSlice()
  }

  function setLabelsAll(labels: IntentLabelKey[]) {
    filters.value.labelsAll = labels
    resetSlice()
  }

  function clearFilters() {
    filters.value = emptyFilters()
    resetSlice()
  }

  function setSlice(offset: number, size?: number) {
    sliceSize.value = Math.max(1, size ?? sliceSize.value)
    sliceOffset.value = Math.max(0, Math.min(offset, Math.max(0, filteredCount.value - 1)))
  }

  function nextSlice() {
    setSlice(sliceOffset.value + sliceSize.value)
  }

  function previousSlice() {
    setSlice(sliceOffset.value - sliceSize.value)
  }

  function setReadIndex(index: number) {
    readIndex.value = Math.max(0, Math.min(index, Math.max(0, filteredCount.value - 1)))
  }

  function nextRecord() {
    if (filteredCount.value === 0) return
    readIndex.value = (readIndex.value + 1) % filteredCount.value
    sliceOffset.value = Math.floor(readIndex.value / sliceSize.value) * sliceSize.value
  }

  function previousRecord() {
    if (filteredCount.value === 0) return
    readIndex.value = (readIndex.value - 1 + filteredCount.value) % filteredCount.value
    sliceOffset.value = Math.floor(readIndex.value / sliceSize.value) * sliceSize.value
  }

  return {
    records,
    filters,
    readIndex,
    sliceOffset,
    sliceSize,
    totalCount,
    sectors,
    authors,
    authorProfiles,
    authorProfileCount,
    labelKeys,
    filteredRecords,
    filteredCount,
    currentSlice,
    currentRecord,
    currentRecordPosition,
    currentSliceMeta,
    setQuery,
    setSectors,
    setAuthors,
    setLabelsAny,
    setLabelsAll,
    clearFilters,
    setSlice,
    nextSlice,
    previousSlice,
    resetSlice,
    setReadIndex,
    nextRecord,
    previousRecord,
  }
})
