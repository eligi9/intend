<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import AuthorDetailView from './views/AuthorDetailView.vue'
import AuthorView from './views/AuthorView.vue'
import EstablishmentView from './views/EstablishmentView.vue'
import MeasuresView from './views/MeasuresView.vue'
import PatternsView from './views/PatternsView.vue'
import ReadView from './views/ReadView.vue'
import RetaliationView from './views/RetaliationView.vue'
import SelfDefenceCounterterrorismView from './views/SelfDefenceCounterterrorismView.vue'

const showLanding = ref(true)
const activeView = ref<
  | 'read'
  | 'measures'
  | 'authors'
  | 'structure'
  | 'timeline'
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

function showPatternsView(view: 'structure' | 'timeline') {
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
          :class="{ active: activeView === 'authors' }"
          @click="showAuthors"
        >
          Authors
        </button>
        <button
          type="button"
          :class="{
            active:
              activeView === 'structure' ||
              activeView === 'selfdefence-counterterrorism' ||
              activeView === 'retaliation',
          }"
          @click="showPatternsView('structure')"
        >
          Patterns
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'timeline' }"
          @click="showPatternsView('timeline')"
        >
          Timeline
        </button>
      </nav>

      <ReadView v-if="activeView === 'read'" @select-author="showAuthorDetail" />
      <MeasuresView v-else-if="activeView === 'measures'" @select-author="showAuthorDetail" />
      <AuthorView v-else-if="activeView === 'authors'" @select-author="showAuthorDetail" />
      <PatternsView
        v-else-if="activeView === 'structure' || activeView === 'timeline'"
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
