import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OverlaySide } from '../types/overlay'

interface OpenAuthorDetailOptions {
  recordIds?: readonly string[]
  side?: OverlaySide
  targetStatementId?: string | null
}

export const useAuthorDetailStore = defineStore('author-detail', () => {
  const authorName = ref<string | null>(null)
  const recordIds = ref<string[] | null>(null)
  const side = ref<OverlaySide>('right')
  const targetStatementId = ref<string | null>(null)

  function openAuthorDetail(
    name: string,
    options: OpenAuthorDetailOptions = {},
  ) {
    authorName.value = name
    recordIds.value = options.recordIds ? [...options.recordIds] : null
    side.value = options.side ?? 'right'
    targetStatementId.value = options.targetStatementId ?? null
  }

  function closeAuthorDetail() {
    authorName.value = null
    recordIds.value = null
    targetStatementId.value = null
  }

  return {
    authorName,
    closeAuthorDetail,
    openAuthorDetail,
    recordIds,
    side,
    targetStatementId,
  }
})
