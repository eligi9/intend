<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import StatementCard from '../components/common/StatementCard.vue'
import { useAuthorStore } from '../stores/authorStore'
import { useStatementStore } from '../stores/statementStore'
import type { IntentRecord } from '../types/intentData'

const statementStore = useStatementStore()
const authorStore = useAuthorStore()
const { records } = storeToRefs(statementStore)

const emit = defineEmits<{
  selectAuthor: [authorId: string]
}>()

const retaliationStatements = computed(() =>
  [...records.value]
    .filter((record) => record.retaliation === 'yes')
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
  <section class="retaliation-view">
    <header class="retaliation-view__header">
      <div>
        <span>Just Cause</span>
        <h2>Retaliation</h2>
      </div>
      <strong>{{ retaliationStatements.length }} Statements</strong>
    </header>

    <section class="retaliation-view__list" aria-label="Retaliation statements">
      <StatementCard
        v-for="record in retaliationStatements"
        :key="record.id"
        :record="record"
        :highlighted-labels="['retaliation']"
        meta-variant="full"
        author-link
        @select-author="selectAuthor"
      />
    </section>
  </section>
</template>

<style scoped>
@import '../css/views/RetaliationView.css';
</style>
