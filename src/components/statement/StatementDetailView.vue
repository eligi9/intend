<script setup lang="ts">
import AuthorPortrait from '../author/AuthorPortrait.vue'
import StatementPatternCard from '../common/StatementPatternCard.vue'
import ViewHeadline from '../common/ViewHeadline.vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentRecord } from '../../types/intentData'

const props = defineProps<{
  author: AuthorInstance | null
  statement: IntentRecord
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <aside
    class="statement-detail-view"
    aria-label="Statement detail"
    @click="emit('close')"
  >
    <section class="statement-detail">
      <div class="statement-detail__author">
        <AuthorPortrait
          v-if="author"
          :author="author"
          :size="148"
          :show-tooltip="false"
        />
        <div v-else class="statement-detail__author-fallback" aria-hidden="true">
          ?
        </div>
        <ViewHeadline
          class="statement-detail__headline"
          :title="statement.author"
          :subline="statement.position ?? statement.sector"
        />
      </div>

      <StatementPatternCard
        :record="statement"
        :show-context-button="true"
      />
    </section>
  </aside>
</template>

<style scoped>
@import '../../css/components/statement/StatementDetailView.css';
</style>
