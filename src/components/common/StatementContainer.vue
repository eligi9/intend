<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentRecord } from '../../types/intentData'
import type { OverlaySide } from '../../types/overlay'
import StatementPatternCard from './StatementPatternCard.vue'

const props = withDefaults(
  defineProps<{
    ariaLabel?: string
    focusedStatementId?: string | null
    overlaySide?: OverlaySide
    records: readonly IntentRecord[]
    scopeAuthorDetailToRecords?: boolean
    showAuthor?: boolean
  }>(),
  {
    ariaLabel: 'Statements',
    focusedStatementId: null,
    overlaySide: 'left',
    scopeAuthorDetailToRecords: false,
    showAuthor: false,
  },
)

const emit = defineEmits<{
  interactionStart: []
}>()

const hoveredBadgeStatementId = ref<string | null>(null)
const hoveredContextStatementId = ref<string | null>(null)
const recordIdsByAuthor = computed(() => {
  const result = new Map<string, string[]>()

  props.records.forEach((record) => {
    const recordIds = result.get(record.author) ?? []
    recordIds.push(record.id)
    result.set(record.author, recordIds)
  })

  return result
})

function setContextHovered(statementId: string, visible: boolean) {
  if (visible) emit('interactionStart')

  hoveredContextStatementId.value = visible
    ? statementId
    : hoveredContextStatementId.value === statementId
      ? null
      : hoveredContextStatementId.value
}

function setBadgeHovered(statementId: string, visible: boolean) {
  if (visible) emit('interactionStart')

  hoveredBadgeStatementId.value = visible
    ? statementId
    : hoveredBadgeStatementId.value === statementId
      ? null
      : hoveredBadgeStatementId.value
}
</script>

<template>
  <section class="statement-container" :aria-label="ariaLabel">
    <StatementPatternCard
      v-for="statement in records"
      :key="statement.id"
      :data-statement-id="statement.id"
      :class="{
        'statement-container__statement--dimmed':
          (focusedStatementId !== null && focusedStatementId !== statement.id) ||
          (hoveredBadgeStatementId !== null && hoveredBadgeStatementId !== statement.id) ||
          (hoveredContextStatementId !== null && hoveredContextStatementId !== statement.id),
      }"
      :author-detail-record-ids="
        scopeAuthorDetailToRecords ? recordIdsByAuthor.get(statement.author) : undefined
      "
      :record="statement"
      :overlay-side="overlaySide"
      :show-author="showAuthor"
      :show-context-button="true"
      :underline-date="false"
      @badge-hover-change="setBadgeHovered(statement.id, $event)"
      @context-hover-change="setContextHovered(statement.id, $event)"
    />
  </section>
</template>

<style scoped>
@import '../../css/components/common/StatementContainer.css';
</style>
