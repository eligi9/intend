<script setup lang="ts">
import { computed, ref } from 'vue'
import AuthorPortrait from '../author/AuthorPortrait.vue'
import type { AuthorInstance } from '../../types/authorData'
import type { IntentRecord, PatternLabelKey } from '../../types/intentData'
import ImageCreditsView from '../../views/ImageCreditsView.vue'
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
const hoveredBadgeStatementId = ref<string | null>(null)
const hoveredContextStatementId = ref<string | null>(null)
const showImageCredits = ref(false)

const emit = defineEmits<{
  close: []
}>()

usePageScrollLock()

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

function setContextHovered(statementId: string, visible: boolean) {
  hoveredContextStatementId.value = visible
    ? statementId
    : hoveredContextStatementId.value === statementId
      ? null
      : hoveredContextStatementId.value
}

function setBadgeHovered(statementId: string, visible: boolean) {
  hoveredBadgeStatementId.value = visible
    ? statementId
    : hoveredBadgeStatementId.value === statementId
      ? null
      : hoveredBadgeStatementId.value
}

function openImageCredits() {
  showImageCredits.value = true
}

function closeImageCredits() {
  showImageCredits.value = false
}
</script>

<template>
  <aside
    class="detail-view"
    aria-label="Detail"
    @scroll.stop
    @touchmove.stop
    @wheel.stop
  >
    <section class="detail">
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

              <button
                v-if="author?.image"
                class="detail__image-source"
                type="button"
                aria-label="Image credits and licenses"
                title="Image credits and licenses"
                @click.stop="openImageCredits"
              >
                Image: Credits and licenses
              </button>
            </div>
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
          :class="{
            'detail__statement--dimmed':
              (hoveredBadgeStatementId !== null && hoveredBadgeStatementId !== statement.id) ||
              (hoveredContextStatementId !== null && hoveredContextStatementId !== statement.id),
          }"
          :record="statement"
          :show-context-button="true"
          @badge-hover-change="setBadgeHovered(statement.id, $event)"
          @context-hover-change="setContextHovered(statement.id, $event)"
        />
      </section>
    </section>

    <Teleport to="body">
      <Transition name="image-credits-overlay">
        <ImageCreditsView
          v-if="showImageCredits"
          @close="closeImageCredits"
        />
      </Transition>
    </Teleport>
  </aside>
</template>

<style scoped>
@import '../../css/components/common/DetailView.css';
</style>
