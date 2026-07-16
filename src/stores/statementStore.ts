import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import dataset from '../../data/intent-dataset.json'
import type {
  IntentDataset,
  IntentFilters,
  MeasureCategory,
  PatternLabelKey,
  IntentRecord,
} from '../types/intentData'
import { groupStatementsByAuthor } from '../utils/authorInstances'
import { matchesIntentFilters, uniqueSorted } from '../utils/intentFilters'
import { normalizeIntentRecords, type RawIntentRecord } from '../utils/intentRecordPatterns'
import { getTopLevelStrategies } from '../utils/statementPatterns'

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
] as const satisfies readonly PatternLabelKey[]

const intentDataset = dataset as Omit<IntentDataset, 'records'> & { records: RawIntentRecord[] }

const emptyFilters = (): IntentFilters => ({
  query: '',
  authors: [],
  labelsAny: [],
  labelsAll: [],
  measureCategories: [],
})

export const useStatementStore = defineStore('statements', () => {
  const records = ref<IntentRecord[]>(normalizeIntentRecords(intentDataset.records))
  const filters = ref<IntentFilters>(emptyFilters())

  const totalCount = computed(() => records.value.length)
  const authors = computed(() => uniqueSorted(records.value.map((record) => record.author)))
  const statementsByAuthor = computed(() => groupStatementsByAuthor(records.value))
  const labelKeys = computed(() => intentLabelKeys)
  const filteredRecords = computed(() =>
    records.value.filter((record) => matchesIntentFilters(record, filters.value)),
  )
  const filteredTopLevelStrategies = computed(() =>
    getTopLevelStrategies(filteredRecords.value),
  )
  const filteredCount = computed(() => filteredRecords.value.length)

  function setQuery(query: string) {
    filters.value.query = query
  }

  function setAuthors(authors: string[]) {
    filters.value.authors = authors
  }

  function setLabelsAny(labels: PatternLabelKey[]) {
    filters.value.labelsAny = labels
  }

  function setLabelsAll(labels: PatternLabelKey[]) {
    filters.value.labelsAll = labels
  }

  function setMeasureCategories(categories: MeasureCategory[]) {
    filters.value.measureCategories = categories
  }

  function clearFilters() {
    filters.value = emptyFilters()
  }

  function getStatementsForAuthor(authorName: string) {
    return statementsByAuthor.value[authorName] ?? []
  }

  return {
    records,
    filters,
    totalCount,
    authors,
    statementsByAuthor,
    labelKeys,
    filteredRecords,
    filteredTopLevelStrategies,
    filteredCount,
    setQuery,
    setAuthors,
    setLabelsAny,
    setLabelsAll,
    setMeasureCategories,
    clearFilters,
    getStatementsForAuthor,
  }
})
