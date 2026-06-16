<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import AuthorDetailView from './views/author-detail/AuthorDetailView.vue'
import AuthorView from './views/authors/AuthorView.vue'
import EstablishmentView from './views/establishment/EstablishmentView.vue'
import ReadView from './views/read/ReadView.vue'
import StrategyView from './views/strategies/StrategyView.vue'

const showLanding = ref(true)
const activeView = ref<'read' | 'authors' | 'strategies'>('read')
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

function showAuthorDetail(authorId: string) {
  selectedAuthorId.value = authorId
}

function showStrategies() {
  selectedAuthorId.value = null
  activeView.value = 'strategies'
}

function closeAuthorDetail() {
  selectedAuthorId.value = null
}

function enterWorkspace() {
  showLanding.value = false
}
</script>

<template>
  <main class="app-shell">
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
          :class="{ active: activeView === 'strategies' }"
          @click="showStrategies"
        >
          Strategies
        </button>
      </nav>

      <ReadView v-if="activeView === 'read'" @select-author="showAuthorDetail" />
      <AuthorView v-else-if="activeView === 'authors'" @select-author="showAuthorDetail" />
      <StrategyView v-else />
    </section>

    <AuthorDetailView
      v-if="selectedAuthorId"
      :author-id="selectedAuthorId"
      @close="closeAuthorDetail"
    />
  </main>
</template>
