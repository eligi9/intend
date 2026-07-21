<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthorDetailStore } from '../../stores/authorDetailStore'
import { useAuthorStore } from '../../stores/authorStore'
import { useStatementStore } from '../../stores/statementStore'
import DetailView from '../common/DetailView.vue'

const authorDetailStore = useAuthorDetailStore()
const authorStore = useAuthorStore()
const statementStore = useStatementStore()
const { authorName, recordIds, side, targetStatementId } = storeToRefs(authorDetailStore)

const author = computed(() =>
  authorName.value ? authorStore.getAuthorInstance(authorName.value) : null,
)
const records = computed(() => {
  if (!authorName.value) return []
  if (!recordIds.value) return statementStore.getStatementsForAuthor(authorName.value)

  const selectedIds = new Set(recordIds.value)
  return statementStore.records.filter((record) => selectedIds.has(record.id))
})
</script>

<template>
  <Teleport to="body">
    <Transition name="author-detail-scrim">
      <button
        v-if="authorName"
        type="button"
        class="author-detail-overlay__scrim"
        aria-label="Author detail view schliessen"
        @click="authorDetailStore.closeAuthorDetail"
      />
    </Transition>

    <Transition :name="`author-detail-${side}`">
      <DetailView
        v-if="authorName"
        class="author-detail-overlay__detail"
        :author="author"
        :records="records"
        :side="side"
        :target-statement-id="targetStatementId"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '../../css/components/author/AuthorDetailOverlay.css';
</style>
