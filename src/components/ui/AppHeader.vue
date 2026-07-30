<script setup lang="ts">
import type { AppHeaderSection, ExploreViewSection } from '../../types/exploreView'
import ViewHeadline from './ViewHeadline.vue'
import TextButton from '../button/TextButton.vue'

defineProps<{
  activeSection: ExploreViewSection
  sections: readonly AppHeaderSection[]
  subline?: string | null
  title: string
}>()

defineEmits<{
  'establishment-select': []
  select: [section: ExploreViewSection]
}>()
</script>

<template>
  <header class="app-header">
    <ViewHeadline
      class="app-header__headline"
      :title="title"
      :subline="subline"
    />

    <nav class="app-header__nav" aria-label="Ansicht wechseln">
      <TextButton
        v-for="section in sections"
        :key="section.key"
        :label="section.label"
        :active="activeSection === section.key"
        @select="$emit('select', section.key)"
      />

      <TextButton
        :active="false"
        aria-label="Open establishment view"
        label="?"
        @select="$emit('establishment-select')"
      />
    </nav>
  </header>
</template>

<style scoped>
@import '../../css/components/ui/AppHeader.css';
</style>
