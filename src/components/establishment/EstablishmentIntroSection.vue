<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  paragraphs: readonly string[]
}>()

const introCopyElement = ref<HTMLElement | null>(null)
const introRootElement = ref<HTMLElement | null>(null)
const introVisualElement = ref<HTMLElement | null>(null)

function splitLinkedText(text: string) {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
  const segments: { href?: string; text: string }[] = []
  let currentIndex = 0

  for (const match of text.matchAll(linkPattern)) {
    if (match.index > currentIndex) {
      segments.push({ text: text.slice(currentIndex, match.index) })
    }

    segments.push({ href: match[2], text: match[1] })
    currentIndex = match.index + match[0].length
  }

  if (currentIndex < text.length) {
    segments.push({ text: text.slice(currentIndex) })
  }

  return segments
}

function getIntroCopyElement() {
  return introCopyElement.value
}

function getIntroRootElement() {
  return introRootElement.value
}

function getIntroVisualElement() {
  return introVisualElement.value
}

defineExpose({
  getIntroCopyElement,
  getIntroRootElement,
  getIntroVisualElement,
})
</script>

<template>
  <div
    ref="introRootElement"
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
            <template
              v-for="(segment, index) in splitLinkedText(paragraph)"
              :key="`${paragraph}-${index}`"
            >
              <a
                v-if="segment.href"
                :href="segment.href"
                target="_blank"
                rel="noreferrer"
              >
                {{ segment.text }}
              </a>
              <template v-else>{{ segment.text }}</template>
            </template>
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
@import '../../css/components/establishment/EstablishmentIntroSection.css';
</style>
