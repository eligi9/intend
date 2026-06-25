<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import StatementCard from '../components/StatementCard.vue'
import { useAuthorStore } from '../stores/authorStore'
import { useStatementStore } from '../stores/statementStore'
import type { IntentRecord } from '../types/intentData'

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const { records } = storeToRefs(statementStore)

const emit = defineEmits<{
  selectAuthor: [authorId: string]
}>()

const measureStatements = computed(() =>
  [...records.value]
    .filter((record) => record.measures.length > 0)
    .sort((first, second) => getDateTime(first) - getDateTime(second)),
)
const measureCount = computed(() =>
  measureStatements.value.reduce((total, record) => total + record.measures.length, 0),
)

function getDateTime(record: IntentRecord) {
  const [day = '1', month = '1', year = '1970'] = record.date.split('/')
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime()
}

function selectAuthor(authorName: string) {
  const author = authorStore.getAuthorInstance(authorName)
  if (!author) return

  emit('selectAuthor', author.id)
}
</script>

<template>
  <section class="measures-view">
    <header class="measures-view__header">
      <div>
        <span>Dataset</span>
        <h2>Measures</h2>
      </div>
      <strong>{{ measureStatements.length }} Statements · {{ measureCount }} Textstellen</strong>
    </header>

    <section class="measures-view__list" aria-label="Statements with measures">
      <StatementCard
        v-for="record in measureStatements"
        :key="record.id"
        :record="record"
        :highlighted-texts="record.measures"
        highlighted-text-color="var(--color-highlight)"
        meta-variant="full"
        author-link
        @select-author="selectAuthor"
      />
    </section>
  </section>
</template>

<style scoped>
@import '../css/views/MeasuresView.css';
</style>
