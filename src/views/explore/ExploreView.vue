<script setup lang="ts">
import { ref } from 'vue'
import AuthorDetailOverlay from '../../components/author/AuthorDetailOverlay.vue'
import type { ExploreHeaderSection, ExploreViewSection } from '../../types/exploreView'
import AuthorView from './AuthorView.vue'
import PatternsView from './PatternsView.vue'
import StatementView from './StatementView.vue'
import TimelineView from './TimelineView.vue'

const activeView = ref<ExploreViewSection>('statements')

const exploreSections: ExploreHeaderSection[] = [
  {
    key: 'statements',
    label: 'Statements',
  },
  {
    key: 'authors',
    label: 'Authors',
  },
  {
    key: 'patterns',
    label: 'Patterns',
  },
  {
    key: 'timeline',
    label: 'Timeline',
  },
]

function showView(section: ExploreViewSection) {
  activeView.value = section
}
</script>

<template>
  <section id="explore" class="explore-view">
    <div class="explore-view__content">
      <StatementView
        v-if="activeView === 'statements'"
        :active-section="activeView"
        :sections="exploreSections"
        @section-select="showView"
      />
      <AuthorView
        v-else-if="activeView === 'authors'"
        :active-section="activeView"
        :sections="exploreSections"
        @section-select="showView"
      />
      <PatternsView
        v-else-if="activeView === 'patterns'"
        :active-section="activeView"
        :sections="exploreSections"
        @section-select="showView"
      />
      <TimelineView
        v-else
        :active-section="activeView"
        :sections="exploreSections"
        @section-select="showView"
      />
    </div>

    <AuthorDetailOverlay />
  </section>
</template>

<style scoped>
@import '../../css/views/explore/ExploreView.css';
</style>
