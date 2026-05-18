<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AuthorPortrait from '../../components/author-portrait/AuthorPortrait.vue'
import { useAuthorStore } from '../../stores/authorStore'

const authorStore = useAuthorStore()
const { authorInstances } = storeToRefs(authorStore)
</script>

<template>
  <section class="author-view">
    <header class="author-view__header">
      <p class="eyebrow">Author View</p>
      <h2>Autoren</h2>
    </header>

    <section class="author-view__grid" aria-label="Autoren">
      <article v-for="author in authorInstances" :key="author.id" class="author-view__item">
        <AuthorPortrait :author="author" :size="220" />
      </article>
    </section>
  </section>
</template>

<style scoped>
@import './AuthorView.css';
</style>
