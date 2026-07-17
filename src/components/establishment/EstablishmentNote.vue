<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import type { NoteStartCorner, Point } from '../../types/geometry'

interface RectBox {
  bottom: number
  left: number
  right: number
  top: number
}

const props = defineProps<{
  progress: number
  startCorner: NoteStartCorner
  target: Point
  text: string
}>()

const emit = defineEmits<{
  animationEnd: []
}>()

const rootElement = ref<HTMLElement | null>(null)
const textElement = ref<HTMLElement | null>(null)
const lineElement = ref<SVGSVGElement | null>(null)
const pathElement = ref<SVGPathElement | null>(null)
const noteRect = ref<RectBox>({ bottom: 0, left: 0, right: 0, top: 0 })
const viewport = ref({ height: 1, width: 1 })
let geometryAnimationFrame = 0
let hasEmittedAnimationEnd = false

gsap.registerPlugin(DrawSVGPlugin)

const clampedProgress = computed(() => Math.min(Math.max(props.progress, 0), 1))
const typingProgress = computed(() => {
  const delayedProgress = clampedProgress.value / 0.82

  return Math.min(Math.max(delayedProgress, 0), 1)
})
const lineProgress = computed(() => {
  const delayedProgress = (clampedProgress.value - 0.82) / 0.18

  return Math.min(Math.max(delayedProgress, 0), 1)
})
const typedText = computed(() => {
  const visibleCharacters = Math.round(props.text.length * typingProgress.value)

  return props.text.slice(0, visibleCharacters)
})
const cursorVisible = computed(() => clampedProgress.value > 0 && typingProgress.value < 1)
const viewBox = computed(() => `0 0 ${viewport.value.width} ${viewport.value.height}`)

const linePath = computed(() => {
  const start = getLineStart()
  const target = props.target
  const dx = target.x - start.x
  const dy = target.y - start.y
  const distance = Math.hypot(dx, dy) || 1
  const bend = Math.min(Math.max(distance * 0.16, 34), 92)
  const normal = {
    x: -dy / distance,
    y: dx / distance,
  }
  const bendDirection = props.startCorner.includes('top') ? 1 : -1
  const controlOne = {
    x: start.x + dx * 0.34 + normal.x * bend * bendDirection,
    y: start.y + dy * 0.34 + normal.y * bend * bendDirection,
  }
  const controlTwo = {
    x: start.x + dx * 0.72 - normal.x * bend * 0.36 * bendDirection,
    y: start.y + dy * 0.72 - normal.y * bend * 0.36 * bendDirection,
  }

  return [
    `M ${round(start.x)} ${round(start.y)}`,
    `C ${round(controlOne.x)} ${round(controlOne.y)}`,
    `${round(controlTwo.x)} ${round(controlTwo.y)}`,
    `${round(target.x)} ${round(target.y)}`,
  ].join(' ')
})

function round(value: number) {
  return Math.round(value * 10) / 10
}

function getLineStart() {
  const rect = noteRect.value
  const gap = 28
  const isLeft = props.startCorner.endsWith('left')
  const isTop = props.startCorner.startsWith('top')

  return {
    x: isLeft ? rect.left - gap : rect.right + gap,
    y: isTop ? rect.top - gap : rect.bottom + gap,
  }
}

function updateGeometry() {
  if (!rootElement.value) {
    return
  }

  const rect = rootElement.value.getBoundingClientRect()
  noteRect.value = {
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
    top: rect.top,
  }
  viewport.value = {
    height: window.innerHeight,
    width: window.innerWidth,
  }
}

function requestGeometryUpdate() {
  if (geometryAnimationFrame) {
    return
  }

  geometryAnimationFrame = window.requestAnimationFrame(() => {
    geometryAnimationFrame = 0
    updateGeometry()
  })
}

function renderProgress(progress: number) {
  const text = textElement.value
  const line = lineElement.value
  const path = pathElement.value

  if (!text || !line || !path) {
    return
  }

  const currentLineProgress = lineProgress.value
  const lineOpacity = currentLineProgress > 0 ? Math.min(currentLineProgress * 4, 1) : 0
  const drawProgress = currentLineProgress > 0 ? Math.max(currentLineProgress, 0.045) : 0

  gsap.set(text, {
    autoAlpha: progress > 0 ? 1 : 0,
    rotation: (1 - progress) * -1,
    scale: 0.96 + progress * 0.04,
    y: (1 - progress) * 14,
  })
  gsap.set(line, {
    autoAlpha: lineOpacity,
  })
  gsap.set(path, {
    drawSVG: `${drawProgress * 100}%`,
  })

  if (progress >= 1 && !hasEmittedAnimationEnd) {
    hasEmittedAnimationEnd = true
    emit('animationEnd')
  }

  if (progress < 0.98) {
    hasEmittedAnimationEnd = false
  }
}

watch(() => props.target, requestGeometryUpdate, { deep: true })
watch(() => props.startCorner, requestGeometryUpdate)
watch(linePath, () => {
  void nextTick(() => renderProgress(clampedProgress.value))
})
watch(clampedProgress, renderProgress, { immediate: true })

onMounted(() => {
  void nextTick(() => {
    updateGeometry()
    gsap.set(textElement.value, { autoAlpha: 0, scale: 0.96, y: 14 })
    gsap.set(lineElement.value, { autoAlpha: 0 })
    gsap.set(pathElement.value, { drawSVG: 0 })
    renderProgress(clampedProgress.value)
  })
  window.addEventListener('resize', requestGeometryUpdate)
  window.visualViewport?.addEventListener('resize', requestGeometryUpdate)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', requestGeometryUpdate)
  window.visualViewport?.removeEventListener('resize', requestGeometryUpdate)
  if (geometryAnimationFrame) {
    window.cancelAnimationFrame(geometryAnimationFrame)
  }
})
</script>

<template>
  <article ref="rootElement" class="establishment-note">
    <svg
      ref="lineElement"
      class="establishment-note__line"
      aria-hidden="true"
      :viewBox="viewBox"
      preserveAspectRatio="none"
    >
      <path
        ref="pathElement"
        :d="linePath"
      />
    </svg>
    <p
      ref="textElement"
      class="establishment-note__text"
      :class="{ 'establishment-note__text--typing': cursorVisible }"
      :aria-label="text"
    >
      {{ typedText }}
    </p>
  </article>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentNote.css';
</style>
