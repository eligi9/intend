<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  paragraphs: readonly string[]
}>()

const introCopyElement = ref<HTMLElement | null>(null)
const introVisualElement = ref<HTMLElement | null>(null)

function getIntroCopyElement() {
  return introCopyElement.value
}

function getIntroVisualElement() {
  return introVisualElement.value
}

defineExpose({
  getIntroCopyElement,
  getIntroVisualElement,
})
</script>

<template>
  <div
    class="establishment-view__panel establishment-view__intro"
    aria-label="Einordnung der Analyse"
  >
    <div class="establishment-view__intro-inner">
      <div class="establishment-view__text">
        <div
          ref="introCopyElement"
          class="establishment-view__copy"
        >
          <p v-for="paragraph in paragraphs" :key="paragraph">
            {{ paragraph }}
          </p>
        </div>
      </div>
      <div
        ref="introVisualElement"
        class="establishment-view__visual"
        aria-hidden="true"
      >
        <span class="establishment-view__intro-bar establishment-view__intro-bar--one" />
        <span class="establishment-view__intro-bar establishment-view__intro-bar--two" />
        <span class="establishment-view__intro-bar establishment-view__intro-bar--three" />
        <span class="establishment-view__intro-bar establishment-view__intro-bar--four" />
        <span class="establishment-view__intro-bar establishment-view__intro-bar--five" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../css/components/EstablishmentIntroSection.css';
</style>
