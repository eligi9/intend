<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AuthorPortrait from '../../components/author/AuthorPortrait.vue'
import FilterButtonContainer from '../../components/common/FilterButtonContainer.vue'
import StatementCard from '../../components/common/StatementCard.vue'
import ViewHeadline from '../../components/common/ViewHeadline.vue'
import { usePageScrollLock } from '../../composables/usePageScrollLock'
import { useAuthorStore } from '../../stores/authorStore'
import type { IntentLabelKey } from '../../types/intentData'
import { taxonomyButtonColors } from '../../utils/intentLabels'

const props = defineProps<{
  authorId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)
const activePattern = ref<IntentLabelKey | null>(null)

usePageScrollLock()

const author = computed(
  () => authorInstances.value.find((item) => item.id === props.authorId) ?? null,
)
const patternFilters = computed(() =>
  author.value
    ? author.value.usedTopLevelStrategies.map((strategy) => ({
        active: activePattern.value === strategy.labelKey,
        color: taxonomyButtonColors[strategy.labelKey] ?? 'var(--color-neutral)',
        key: strategy.labelKey,
        label: strategy.label,
        minWidth: '112px',
      }))
    : [],
)
const profileRows = computed(() => {
  if (!author.value) return []

  return [
    ['Age', author.value.age ?? 'unknown'],
    ['Sex', author.value.gender ?? 'unknown'],
    ['Party', author.value.party ?? 'unknown'],
    ['Statements', author.value.statementCount],
  ]
})
const imageCredit = computed(() => {
  const image = author.value?.image

  if (!image) return ''

  const creator = image.creator?.trim() || image.credit?.trim() || image.title.trim()
  const credit = image.credit?.trim()
  const parts = [creator]

  if (credit && credit !== creator && credit !== 'Own work') {
    parts.push(credit)
  }

  parts.push('Wikimedia Commons')

  if (image.license) {
    parts.push(image.license)
  }

  return parts.join(' / ')
})
const visibleStatements = computed(() => {
  if (!author.value) return []
  const pattern = activePattern.value

  if (!pattern) return author.value.statements

  return author.value.statements.filter((statement) => statement[pattern] === 'yes')
})

function toggleFilter(label: IntentLabelKey) {
  activePattern.value = activePattern.value === label ? null : label
}

function toggleFilterByKey(label: string) {
  toggleFilter(label as IntentLabelKey)
}
</script>

<template>
  <section
    class="author-detail-view"
    @click="emit('close')"
    @scroll.stop
    @touchmove.stop
    @wheel.stop
  >
    <article v-if="author" class="author-detail">
      <section class="author-detail__top" aria-label="Autor Uebersicht">
        <ViewHeadline
          class="author-detail__headline"
          :title="author.name"
          :subline="author.position ?? 'Position unbekannt'"
        />

        <div class="author-detail__summary">
          <figure class="author-detail__portrait-block">
            <AuthorPortrait :author="author" :show-tooltip="false" :size="168" />

            <figcaption v-if="author.image" class="author-detail__image-source">
              <a
                :href="author.image.sourceUrl"
                target="_blank"
                rel="noreferrer"
                :title="author.image.attribution"
              >
                Foto: {{ imageCredit }}
              </a>
            </figcaption>
          </figure>

          <dl class="author-detail__profile" aria-label="Autor Steckbrief">
            <div
              v-for="[label, value] in profileRows"
              :key="label"
            >
              <dt>{{ label }}</dt>
              <dd>{{ value }}</dd>
            </div>
          </dl>
        </div>

      </section>

      <section class="author-detail__comments" aria-label="Statements">
        <div class="author-detail__filters" @click.stop>
          <FilterButtonContainer
            :labels="patternFilters"
            @select="toggleFilterByKey"
          />
        </div>

        <div class="author-detail__statements">
          <StatementCard
            v-for="statement in visibleStatements"
            :key="statement.id"
            :record="statement"
            meta-variant="date"
          />

          <span v-if="visibleStatements.length === 0" class="author-detail__statements-empty">
            Keine Statements vorhanden
          </span>
        </div>
      </section>
    </article>

    <div v-else class="author-detail-view__empty">
      <strong>Autor nicht gefunden</strong>
      <button type="button" @click="emit('close')">Schliessen</button>
    </div>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/AuthorDetailView.css';
</style>
