<script setup lang="ts">
import { ref } from 'vue'
import ControlPanel from './components/control-panel/ControlPanel.vue'
import AuthorDetailView from './views/author-detail/AuthorDetailView.vue'
import AuthorView from './views/authors/AuthorView.vue'
import CanvasView from './views/canvas/CanvasView.vue'
import ReadView from './views/read/ReadView.vue'

const activeView = ref<'canvas' | 'read' | 'authors' | 'author-detail'>('read')
const selectedAuthorId = ref<string | null>(null)

function showAuthors() {
  selectedAuthorId.value = null
  activeView.value = 'authors'
}

function showAuthorDetail(authorId: string) {
  selectedAuthorId.value = authorId
  activeView.value = 'author-detail'
}
</script>

<template>
  <main class="app-shell">
    <ControlPanel v-if="activeView === 'canvas'" />
    <section
      class="workspace"
      :class="{ 'workspace--full': activeView === 'read' || activeView === 'authors' || activeView === 'author-detail' }"
    >
      <nav class="view-switch" aria-label="Ansicht wechseln">
        <button type="button" :class="{ active: activeView === 'read' }" @click="activeView = 'read'">
          Read
        </button>
        <button
          type="button"
          :class="{ active: activeView === 'authors' || activeView === 'author-detail' }"
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
      <AuthorDetailView
        v-else-if="activeView === 'author-detail' && selectedAuthorId"
        :author-id="selectedAuthorId"
        @back="showAuthors"
      />
      <CanvasView v-else />
    </section>
  </main>
</template>
