<script setup lang="ts">
import { ref } from 'vue'
import ControlPanel from './components/ControlPanel.vue'
import ReadView from './components/ReadView.vue'
import SketchCanvas from './components/SketchCanvas.vue'

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
      <SketchCanvas v-else />
    </section>
  </main>
</template>
