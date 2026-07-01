<script setup lang="ts">
import AuthorPortrait from '../author/AuthorPortrait.vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentRecord } from '../../types/intentData'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import StatementPatternCard from './StatementPatternCard.vue'
import ViewHeadline from './ViewHeadline.vue'

const props = defineProps<{
  author: AuthorInstance | null
  records: readonly IntentRecord[]
}>()

const emit = defineEmits<{
  close: []
}>()

usePageScrollLock()
</script>

<template>
  <aside
    class="detail-view"
    aria-label="Detail"
    @click="emit('close')"
    @scroll.stop
    @touchmove.stop
    @wheel.stop
  >
    <section class="detail">
      <div class="detail__author">
        <div class="detail__author-portrait">
          <AuthorPortrait
            v-if="author"
            :author="author"
            :size="148"
            :show-tooltip="false"
          />
          <div v-else class="detail__author-fallback" aria-hidden="true">
            ?
          </div>

          <ViewHeadline
            class="detail__headline"
            :title="author?.name ?? records[0]?.author ?? 'Autor nicht gefunden'"
            :subline="author?.position ?? records[0]?.position ?? records[0]?.sector ?? 'Position unbekannt'"
          />
        </div>

          <a
          v-if="author?.image"
          class="detail__image-source"
          :href="author.image.sourceUrl"
          target="_blank"
          rel="noreferrer"
          :title="author.image.attribution"
        >
          Foto: {{ author.image.attribution }}
        </a>
      </div>

      <StatementPatternCard
        v-for="statement in records"
        :key="statement.id"
        :record="statement"
        :show-context-button="true"
      />

     
    </section>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/DetailView.css';
</style>
