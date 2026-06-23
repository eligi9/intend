<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import AuthorDetailView from './views/AuthorDetailView.vue'
import AuthorView from './views/AuthorView.vue'
import EstablishmentView from './views/EstablishmentView.vue'
import MeasuresView from './views/MeasuresView.vue'
import ReadView from './views/ReadView.vue'
import RetaliationView from './views/RetaliationView.vue'
import SelfDefenceCounterterrorismView from './views/SelfDefenceCounterterrorismView.vue'
import StrategyView from './views/StrategyView.vue'

const showLanding = ref(true)
const activeView = ref<
  | 'read'
  | 'measures'
  | 'authors'
  | 'structure'
  | 'timeline'
  | 'matrix'
  | 'selfdefence-counterterrorism'
  | 'retaliation'
>('read')
const selectedAuthorId = ref<string | null>(null)
const bodyOverlayClass = 'author-detail-overlay-open'

watch(
  selectedAuthorId,
  (authorId) => {
    document.body.classList.toggle(bodyOverlayClass, authorId !== null)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.classList.remove(bodyOverlayClass)
})

function showAuthors() {
  selectedAuthorId.value = null
  activeView.value = 'authors'
}

function showMeasures() {
  selectedAuthorId.value = null
  activeView.value = 'measures'
}

function showAuthorDetail(authorId: string) {
  selectedAuthorId.value = authorId
}

function showStrategyView(view: 'structure' | 'timeline' | 'matrix') {
  selectedAuthorId.value = null
  activeView.value = view
}

function showSelfDefenceCounterterrorism() {
  selectedAuthorId.value = null
  activeView.value = 'selfdefence-counterterrorism'
}

function showRetaliation() {
  selectedAuthorId.value = null
  activeView.value = 'retaliation'
}

function closeAuthorDetail() {
  selectedAuthorId.value = null
}

function enterWorkspace() {
  showLanding.value = false
}
</script>

<template>
  <main class="app-shell" :class="{ 'app-shell--landing': showLanding }">
    <EstablishmentView v-if="showLanding" @enter="enterWorkspace" />

    <section v-else class="workspace workspace--full">
      <nav class="view-switch" aria-label="Ansicht wechseln">
        <button type="button" :class="{ active: activeView === 'read' }" @click="activeView = 'read'">
          Read
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'measures' }"
          @click="showMeasures"
        >
          Measures
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'authors' }"
          @click="showAuthors"
        >
          Authors
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'structure' }"
          @click="showStrategyView('structure')"
        >
          Category
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'timeline' }"
          @click="showStrategyView('timeline')"
        >
          Timeline
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'matrix' }"
          @click="showStrategyView('matrix')"
        >
          Matrix
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'selfdefence-counterterrorism' }"
          @click="showSelfDefenceCounterterrorism"
        >
          Self-defence / Counterterrorism
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'retaliation' }"
          @click="showRetaliation"
        >
          Retaliation
        </button>
      </nav>

      <ReadView v-if="activeView === 'read'" @select-author="showAuthorDetail" />
      <MeasuresView v-else-if="activeView === 'measures'" @select-author="showAuthorDetail" />
      <AuthorView v-else-if="activeView === 'authors'" @select-author="showAuthorDetail" />
      <StrategyView
        v-else-if="activeView === 'structure' || activeView === 'timeline' || activeView === 'matrix'"
        :mode="activeView"
      />
      <SelfDefenceCounterterrorismView
        v-else-if="activeView === 'selfdefence-counterterrorism'"
        @select-author="showAuthorDetail"
      />
      <RetaliationView v-else @select-author="showAuthorDetail" />
    </section>

    <AuthorDetailView
      v-if="selectedAuthorId"
      :author-id="selectedAuthorId"
      @close="closeAuthorDetail"
    />
  </main>
</template>
