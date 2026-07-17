import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import dataset from '../../data/intent-dataset.json'
import type {
  IntentDataset,
  IntentFilters,
  MeasureCategory,
  PatternLabelKey,
  IntentRecord,
  RawIntentRecord,
} from '../types/intentData'
import { groupStatementsByAuthor } from '../utils/authorInstances'
import { matchesIntentFilters } from '../utils/intentFilters'
import { normalizeIntentRecords } from '../utils/intentRecordPatterns'

const intentDataset = dataset as Omit<IntentDataset, 'records'> & { records: RawIntentRecord[] }

const emptyFilters = (): IntentFilters => ({
  query: '',
  labelsAll: [],
  measureCategories: [],
})

export const useStatementStore = defineStore('statements', () => {
  const records = ref<IntentRecord[]>(normalizeIntentRecords(intentDataset.records))
  const filters = ref<IntentFilters>(emptyFilters())

  const statementsByAuthor = computed(() => groupStatementsByAuthor(records.value))
  const filteredRecords = computed(() =>
    records.value.filter((record) => matchesIntentFilters(record, filters.value)),
  )

  function setQuery(query: string) {
    filters.value.query = query
  }

  function setLabelsAll(labels: PatternLabelKey[]) {
    filters.value.labelsAll = labels
  }

  function setMeasureCategories(categories: MeasureCategory[]) {
    filters.value.measureCategories = categories
  }

  function getStatementsForAuthor(authorName: string) {
    return statementsByAuthor.value[authorName] ?? []
  }

  return {
    records,
    filters,
    filteredRecords,
    setQuery,
    setLabelsAll,
    setMeasureCategories,
    getStatementsForAuthor,
  }
})
