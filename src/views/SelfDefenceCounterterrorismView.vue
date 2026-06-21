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

const selfDefenceCounterterrorismStatements = computed(() =>
  [...records.value]
    .filter((record) => record.selfdefence_counterterrorism === 'yes')
    .sort((first, second) => getDateTime(first) - getDateTime(second)),
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
  <section class="selfdefence-counterterrorism-view">
    <header class="selfdefence-counterterrorism-view__header">
      <div>
        <span>Just Cause</span>
        <h2>Self-defence / Counterterrorism</h2>
      </div>
      <strong>{{ selfDefenceCounterterrorismStatements.length }} Statements</strong>
    </header>

    <section
      class="selfdefence-counterterrorism-view__list"
      aria-label="Self-defence and counterterrorism statements"
    >
      <StatementCard
        v-for="record in selfDefenceCounterterrorismStatements"
        :key="record.id"
        :record="record"
        :highlighted-labels="['selfdefence_counterterrorism']"
        meta-variant="full"
        author-link
        @select-author="selectAuthor"
      />
    </section>
  </section>
</template>

<style scoped>
@import '../css/views/SelfDefenceCounterterrorismView.css';
</style>
