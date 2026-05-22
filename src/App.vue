<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import ControlPanel from './components/control-panel/ControlPanel.vue'
import AuthorDetailView from './views/author-detail/AuthorDetailView.vue'
import AuthorView from './views/authors/AuthorView.vue'
import CanvasView from './views/canvas/CanvasView.vue'
import ReadView from './views/read/ReadView.vue'

const activeView = ref<'canvas' | 'read' | 'authors'>('read')
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
  activeView.value = 'authors'
}

function closeAuthorDetail() {
  selectedAuthorId.value = null
}
</script>

<template>
  <main class="app-shell">
    <ControlPanel v-if="activeView === 'canvas'" />
    <section
      class="workspace"
      :class="{ 'workspace--full': activeView === 'read' || activeView === 'authors' }"
    >
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
        <button type="button" :class="{ active: activeView === 'canvas' }" @click="activeView = 'canvas'">
          Canvas
        </button>
      </nav>

      <ReadView v-if="activeView === 'read'" />
      <AuthorView v-else-if="activeView === 'authors'" @select-author="showAuthorDetail" />
      <CanvasView v-else />
    </section>

    <AuthorDetailView
      v-if="selectedAuthorId"
      :author-id="selectedAuthorId"
      @close="closeAuthorDetail"
    />
  </main>
</template>
