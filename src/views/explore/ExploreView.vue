<script setup lang="ts">
import { ref } from 'vue'
import ExploreNavButton from '../../components/explore/ExploreNavButton.vue'
import AuthorView from './AuthorView.vue'
import PatternsView from './PatternsView.vue'
import ReadView from './ReadView.vue'
import TimelineView from './TimelineView.vue'

type ExploreViewSection =
  | 'read'
  | 'authors'
  | 'patterns'
  | 'timeline'

const activeView = ref<ExploreViewSection>('timeline')

function showView(section: ExploreViewSection) {
  activeView.value = section
}
</script>

<template>
  <section id="explore" class="explore-view">
    <nav class="explore-view__nav" aria-label="Ansicht wechseln">
      <ExploreNavButton label="Read" :active="activeView === 'read'" @select="showView('read')" />
      <ExploreNavButton
        label="Authors"
        :active="activeView === 'authors'"
        @select="showView('authors')"
      />
      <ExploreNavButton
        label="Patterns"
        :active="activeView === 'patterns'"
        @select="showView('patterns')"
      />
      <ExploreNavButton
        label="Timeline"
        :active="activeView === 'timeline'"
        @select="showView('timeline')"
      />
    </nav>

    <div class="explore-view__content">
      <ReadView v-if="activeView === 'read'" />
      <AuthorView v-else-if="activeView === 'authors'" />
      <PatternsView v-else-if="activeView === 'patterns'" />
      <TimelineView v-else />
    </div>
  </section>
</template>

<style scoped>
@import '../../css/views/explore/ExploreView.css';
</style>
