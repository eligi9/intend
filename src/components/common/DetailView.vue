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
  showAuthorFacts?: boolean
}>()

const activePattern = ref<PatternLabelKey | null>(null)
const isContextHovered = ref(false)
const hoveredBadgeStatementId = ref<string | null>(null)

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
const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

function removePartyParenthetical(position: string | null | undefined, party: string | null | undefined) {
  if (!position) return null
  if (!party) return position.trim()

  const normalizedParty = normalizeText(party)

  if (!normalizedParty) return position.trim()

  return position
    .replace(/\s*\(([^)]*)\)/g, (match, content: string) =>
      normalizeText(content).includes(normalizedParty) ? '' : match,
    )
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

const hasRecordList = computed(() => props.records.length > 1)
const authorPositionSubline = computed(
  () =>
    removePartyParenthetical(props.author?.position, props.author?.party) ??
    props.records[0]?.speakerPosition ??
    props.records[0]?.sector ??
    'Position unbekannt',
)
const authorFacts = computed(() => {
  const author = props.author

  if (!props.showAuthorFacts || !author) return []

  return [
    { label: 'Age', value: author.age === null ? 'unknown' : `${author.age}` },
    { label: 'Gender', value: author.gender ?? 'unknown' },
    { label: 'Party', value: author.party ?? 'unknown' },
    { label: 'Statements', value: `${author.statementCount}` },
  ]
})
const patternFilters = computed(() =>
  hasRecordList.value && props.author
    ? props.author.usedTopLevelStrategies.map((strategy) => ({
        active: activePattern.value === strategy.labelKey,
        color: strategyColors[strategy.labelKey] ?? 'var(--color-neutral)',
        key: strategy.labelKey,
        label: strategy.label,
        minWidth: '0',
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

function setContextHovered(visible: boolean) {
  isContextHovered.value = visible
}

function setBadgeHovered(statementId: string, visible: boolean) {
  hoveredBadgeStatementId.value = visible
    ? statementId
    : hoveredBadgeStatementId.value === statementId
      ? null
      : hoveredBadgeStatementId.value
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
    <section
      class="detail"
      :class="{ 'detail--with-facts': authorFacts.length > 0 }"
    >
      <header class="detail__header">
        <div class="detail__header-inner">
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
                :subline="authorPositionSubline"
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

          <dl
            v-if="authorFacts.length > 0"
            class="detail__facts"
            aria-label="Author facts"
          >
            <div
              v-for="fact in authorFacts"
              :key="fact.label"
              class="detail__fact"
            >
              <dt>{{ fact.label }}</dt>
              <dd>{{ fact.value }}</dd>
            </div>
          </dl>
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
          :class="{
            'detail__statement--badge-dimmed':
              hoveredBadgeStatementId !== null && hoveredBadgeStatementId !== statement.id,
          }"
          :record="statement"
          :show-context-button="true"
          @badge-hover-change="setBadgeHovered(statement.id, $event)"
          @context-hover-change="setContextHovered"
        />
      </section>
    </section>

    <Transition name="detail-context-blur">
      <div
        v-if="isContextHovered"
        class="detail-view__context-blur"
        aria-hidden="true"
      />
    </Transition>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/DetailView.css';
</style>
