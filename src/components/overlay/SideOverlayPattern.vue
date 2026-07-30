<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import type { OverlaySide } from '../../types/overlay'

const props = defineProps<{
  color?: string
  definition?: string
  expanded?: boolean
  label?: string
  side?: OverlaySide
  title: string
  text: string
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const definitionElement = ref<HTMLElement | null>(null)
const whyElement = ref<HTMLElement | null>(null)
const whyTextElement = ref<HTMLElement | null>(null)
const whyTextIsRevealing = ref(false)
let prefersReducedMotion = false
let motionMedia: ReturnType<typeof gsap.matchMedia> | null = null
let switchTimeline: gsap.core.Timeline | null = null

const overlayStyle = computed(() => {
  return {
    '--side-overlay-pattern-background': props.color,
  }
})

watch(
  () => props.expanded,
  async (expanded, previousExpanded) => {
    if (!props.visible) {
      whyTextIsRevealing.value = false
      return
    }

    const element = whyElement.value
    if (!element || expanded === previousExpanded) return

    whyTextIsRevealing.value = !expanded
    const previousTop = element.getBoundingClientRect().top
    switchTimeline?.kill()
    switchTimeline = null
    gsap.killTweensOf(element)
    gsap.set(element, { clearProps: 'transform' })

    await nextTick()

    const updatedElement = whyElement.value
    if (!updatedElement) {
      whyTextIsRevealing.value = false
      return
    }

    const offsetY = previousTop - updatedElement.getBoundingClientRect().top
    const updatedDefinition = definitionElement.value
    const updatedWhyText = whyTextElement.value

    if (prefersReducedMotion) {
      gsap.set(updatedElement, { clearProps: 'transform' })
      if (updatedDefinition) {
        gsap.set(updatedDefinition, {
          autoAlpha: 1,
        })
      }
      if (updatedWhyText) {
        gsap.set(updatedWhyText, {
          autoAlpha: 1,
        })
      }
      whyTextIsRevealing.value = false
      return
    }

    switchTimeline = gsap.timeline()

    if (Math.abs(offsetY) >= 1) {
      switchTimeline.fromTo(
        updatedElement,
        { y: offsetY },
        {
          y: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          overwrite: 'auto',
          clearProps: 'transform',
        },
      )
    }

    if (expanded && updatedDefinition) {
      switchTimeline.fromTo(
        updatedDefinition,
        {
          autoAlpha: 0,
        },
        {
          autoAlpha: 1,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto',
          clearProps: 'opacity',
        },
        '>',
      )
    }

    if (!expanded && updatedWhyText) {
      switchTimeline.fromTo(
        updatedWhyText,
        {
          autoAlpha: 0,
        },
        {
          autoAlpha: 1,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto',
          clearProps: 'opacity',
          onComplete: () => {
            whyTextIsRevealing.value = false
          },
        },
        '>',
      )
    } else if (!expanded) {
      whyTextIsRevealing.value = false
    }
  },
)

watch(
  () => props.visible,
  (visible) => {
    if (visible) return

    switchTimeline?.kill()
    switchTimeline = null
    whyTextIsRevealing.value = false
  },
)

onMounted(() => {
  motionMedia = gsap.matchMedia()
  motionMedia.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      prefersReducedMotion = Boolean(context.conditions?.reduceMotion)
    },
  )
})

onBeforeUnmount(() => {
  switchTimeline?.kill()
  switchTimeline = null

  if (whyElement.value) {
    gsap.killTweensOf(whyElement.value)
  }

  if (definitionElement.value) {
    gsap.killTweensOf(definitionElement.value)
  }

  if (whyTextElement.value) {
    gsap.killTweensOf(whyTextElement.value)
  }

  motionMedia?.revert()
  motionMedia = null
})
</script>

<template>
  <Teleport to="body">
    <Transition name="side-overlay-pattern">
      <aside
        v-if="visible"
        class="side-overlay-pattern"
        :class="[
          `side-overlay-pattern--${side ?? 'right'}`,
          {
            'side-overlay-pattern--colored': color,
            'side-overlay-pattern--expanded': expanded,
          },
        ]"
        :style="overlayStyle"
        aria-live="polite"
        @click.stop="emit('close')"
      >
        <h3>{{ title }}</h3>
        <p
          v-if="expanded && definition"
          ref="definitionElement"
          class="side-overlay-pattern__definition"
        >
          {{ definition }}
        </p>

        <div
          ref="whyElement"
          class="side-overlay-pattern__why"
          :class="{ 'side-overlay-pattern__why--bottom': expanded }"
        >
          <span
            v-if="label"
            class="side-overlay-pattern__label"
            :class="{
              'side-overlay-pattern__label--without-text': expanded,
            }"
          >
            {{ label }}
          </span>
          <p
            v-if="!expanded"
            ref="whyTextElement"
            class="side-overlay-pattern__why-text"
            :class="{
              'side-overlay-pattern__why-text--revealing': whyTextIsRevealing,
            }"
          >
            {{ text }}
          </p>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
@import '../../css/components/overlay/SideOverlayPattern.css';
</style>
