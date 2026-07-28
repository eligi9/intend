<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import type { IntentRecord } from '../../types/intentData'
import { getAcceleratedContainerScrollOffset } from '../../utils/scrollMotion'
import StatementPatternCard from '../common/StatementPatternCard.vue'

defineProps<{
  record: IntentRecord
}>()

const rootElement = ref<HTMLElement | null>(null)
let motionMedia: ReturnType<typeof gsap.matchMedia> | null = null
let prefersReducedMotion = false

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
    class="establishment-statement-interlude"
    aria-labelledby="statement-guide-title"
  >
    <div class="establishment-statement-interlude__inner">
      <div class="establishment-statement-interlude__guide">
        <h2 id="statement-guide-title">Reading the Statement</h2>
        <p>
          <span class="establishment-statement-interlude__measure-label">
            Measures and demands
          </span>
          are highlighted within the statement. Hover over the buttons below to see why a
          rhetorical pattern was assigned, and click to view its definition.
        </p>
      </div>

      <StatementPatternCard
        class="establishment-statement-interlude__statement"
        overlay-side="right"
        :record="record"
        show-author
        :show-representation="false"
      />
    </div>
  </section>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentStatementInterlude.css';
</style>
