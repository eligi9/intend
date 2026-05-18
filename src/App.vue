<script setup lang="ts">
import { ref } from 'vue'
import ControlPanel from './components/control-panel/ControlPanel.vue'
import CanvasView from './views/canvas/CanvasView.vue'
import ReadView from './views/read/ReadView.vue'

const activeView = ref<'canvas' | 'read'>('read')
</script>

<template>
  <main class="app-shell">
    <ControlPanel v-if="activeView === 'canvas'" />
    <section class="workspace" :class="{ 'workspace--full': activeView === 'read' }">
      <nav class="view-switch" aria-label="Ansicht wechseln">
        <button type="button" :class="{ active: activeView === 'read' }" @click="activeView = 'read'">
          Read
        </button>
        <button type="button" :class="{ active: activeView === 'canvas' }" @click="activeView = 'canvas'">
          Canvas
        </button>
      </nav>

      <ReadView v-if="activeView === 'read'" />
      <CanvasView v-else />
    </section>
  </main>
</template>
