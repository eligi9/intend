<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthorPortrait from '../author/AuthorPortrait.vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { strategyColors } from '../../utils/intentLabels'
import FilterButtonContainer from './FilterButtonContainer.vue'
import StatementPatternCard from './StatementPatternCard.vue'
import ViewHeadline from './ViewHeadline.vue'

const props = defineProps<{
  author: AuthorInstance | null
  records: readonly IntentRecord[]
}>()

const activePattern = ref<PatternLabelKey | null>(null)

const emit = defineEmits<{
  close: []
}>()

usePageScrollLock()

const imageCredit = computed(() => {
  const image = props.author?.image

  if (!image) return ''

  return [image.creator, image.credit, image.license]
    .map((part) => part?.trim())
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(' / ')
})
const hasRecordList = computed(() => props.records.length > 1)
const patternFilters = computed(() =>
  hasRecordList.value && props.author
    ? props.author.usedTopLevelStrategies.map((strategy) => ({
        active: activePattern.value === strategy.labelKey,
        color: strategyColors[strategy.labelKey] ?? 'var(--color-neutral)',
        key: strategy.labelKey,
        label: strategy.label,
        minWidth: '7rem',
      }))
    : [],
)
const visibleRecords = computed(() => {
  if (!activePattern.value) return props.records

  return props.records.filter((record) => record[activePattern.value as PatternLabelKey] === 'yes')
})

function togglePatternFilter(label: PatternLabelKey) {
  activePattern.value = activePattern.value === label ? null : label
}

function togglePatternFilterByKey(label: string) {
  togglePatternFilter(label as PatternLabelKey)
}
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
      <header class="detail__header">
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

          <div class="detail__headline-block">
            <ViewHeadline
              class="detail__headline"
              :title="author?.name ?? records[0]?.author ?? 'Autor nicht gefunden'"
              :subline="author?.position ?? records[0]?.position ?? records[0]?.sector ?? 'Position unbekannt'"
            />

            <a
              v-if="author?.image"
              class="detail__image-source"
              :href="author.image.sourceUrl"
              target="_blank"
              rel="noreferrer"
              :title="author.image.attribution"
            >
              Foto: {{ imageCredit }}
            </a>
          </div>
        </div>
      </header>

      <section class="detail__content" aria-label="Statements">
        <div
          v-if="patternFilters.length > 0"
          class="detail__filters"
          @click.stop
        >
          <FilterButtonContainer
            :labels="patternFilters"
            @select="togglePatternFilterByKey"
          />
        </div>

        <StatementPatternCard
          v-for="statement in visibleRecords"
          :key="statement.id"
          :record="statement"
          :show-context-button="true"
        />
      </section>
    </section>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/DetailView.css';
</style>
