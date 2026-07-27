<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  paragraphs: readonly string[]
}>()

const introCopyElement = ref<HTMLElement | null>(null)
const introRootElement = ref<HTMLElement | null>(null)
const paragraphColumns = computed(() => [
  props.paragraphs.slice(0, 2),
  props.paragraphs.slice(2),
])

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

defineExpose({
  getIntroCopyElement,
  getIntroRootElement,
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
        <h2 class="establishment-view__intro-heading-placeholder" aria-hidden="true">
          Incitement to<br />Genocide
        </h2>

        <div
          ref="introCopyElement"
          class="establishment-view__copy"
        >
          <div
            v-for="(paragraphsInColumn, columnIndex) in paragraphColumns"
            :key="`copy-column-${columnIndex}`"
            class="establishment-view__copy-column"
          >
            <p v-for="paragraph in paragraphsInColumn" :key="paragraph">
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
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentIntroSection.css';
</style>
