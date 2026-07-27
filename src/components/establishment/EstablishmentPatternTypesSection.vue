<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { intentTaxonomy } from '../../utils/intentTaxonomy'
import { getAcceleratedContainerScrollOffset } from '../../utils/scrollMotion'

const rootElement = ref<HTMLElement | null>(null)
let motionMedia: ReturnType<typeof gsap.matchMedia> | null = null
let prefersReducedMotion = false
const patternTypes = intentTaxonomy.map((patternType) => {
  const firstSentenceEnd = patternType.description.indexOf('.')

  return {
    className: `establishment-pattern-types__card--${patternType.parentLabel.replace(/_/g, '-')}`,
    descriptionFirstSentence:
      firstSentenceEnd >= 0
        ? patternType.description.slice(0, firstSentenceEnd + 1)
        : patternType.description,
    title: patternType.label,
    titleLines: patternType.label.split(' '),
  }
})

function updateScrollState() {
  if (!rootElement.value) return

  const acceleration = prefersReducedMotion
    ? 0
    : getAcceleratedContainerScrollOffset(rootElement.value)

  gsap.set(rootElement.value, { y: acceleration })
}

onMounted(() => {
  motionMedia = gsap.matchMedia()
  motionMedia.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      prefersReducedMotion = Boolean(context.conditions?.reduceMotion)
      updateScrollState()
    },
    rootElement.value ?? undefined,
  )
})

onBeforeUnmount(() => {
  if (rootElement.value) {
    gsap.killTweensOf(rootElement.value)
    gsap.set(rootElement.value, { clearProps: 'transform' })
  }

  motionMedia?.revert()
  motionMedia = null
})

defineExpose({
  updateScrollState,
})
</script>

<template>
  <section
    ref="rootElement"
    class="establishment-pattern-types"
    aria-labelledby="pattern-types-title"
  >
    <div class="establishment-pattern-types__inner">
      <header class="establishment-pattern-types__header">
        <h2 id="pattern-types-title">Rhetorical Frames</h2>
        <p class="establishment-pattern-types__description">
          Statements were analyzed across four categories that either legitimize violence or drive
          mobilization.
        </p>
      </header>

      <div class="establishment-pattern-types__body">
        <article
          v-for="patternType in patternTypes"
          :key="patternType.title"
          class="establishment-pattern-types__card"
          :class="patternType.className"
        >
          <h3>
            <span
              v-for="(titleLine, index) in patternType.titleLines"
              :key="`${patternType.title}-${index}`"
            >
              {{ titleLine }}
            </span>
          </h3>
          <p>
            <span>{{ patternType.descriptionFirstSentence }}</span>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentPatternTypesSection.css';
</style>
