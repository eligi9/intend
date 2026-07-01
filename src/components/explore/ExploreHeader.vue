<script setup lang="ts">
import type { ExploreHeaderSection, ExploreViewSection } from '../../types/exploreView'
import ViewHeadline from '../common/ViewHeadline.vue'
import ExploreNavButton from './ExploreNavButton.vue'

defineProps<{
  activeSection: ExploreViewSection
  sections: readonly ExploreHeaderSection[]
  subline?: string | null
  title: string
}>()

defineEmits<{
  select: [section: ExploreViewSection]
}>()
</script>

<template>
  <header class="explore-header">
    <ViewHeadline
      class="explore-header__headline"
      :title="title"
      :subline="subline"
    />

    <nav class="explore-header__nav" aria-label="Ansicht wechseln">
      <ExploreNavButton
        v-for="section in sections"
        :key="section.key"
        :label="section.label"
        :active="activeSection === section.key"
        @select="$emit('select', section.key)"
      />
    </nav>
  </header>
</template>

<style scoped>
@import '../../css/components/explore/ExploreHeader.css';
</style>
