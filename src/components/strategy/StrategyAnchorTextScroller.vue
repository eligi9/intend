<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import type { PatternLabelKey, IntentRecord } from '../../types/intentData'
import { getPatternAnnotation } from '../../utils/intentRecordPatterns'

interface AnchorTextItem {
  statement: IntentRecord
  text: string
}

const props = defineProps<{
  highlightColor: string
  label: PatternLabelKey
  statements: IntentRecord[]
}>()

const emit = defineEmits<{
  anchorPressEnd: []
  anchorPressStart: [anchor: AnchorTextItem]
}>()

const AUTO_SCROLL_SPEED_PX_PER_SECOND = 105
const USER_PAUSE_MS = 450
const NEXT_TEXT_START_RATIO = 0.9

const rail = ref<HTMLElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
let pauseAutoScrollUntil = 0
let scrollX = 0
let isDragging = false
let isPointerDown = false
let isAnchorPressed = false
let dragStartX = 0
let dragStartScrollX = 0

const anchors = computed(() =>
  props.statements.flatMap((statement) =>
    (getPatternAnnotation(statement, props.label)?.anchors ?? []).map((text) => ({
      statement,
      text,
    })),
  ),
)
const hasAnchors = computed(() => anchors.value.length > 0)

// The sequence is rendered twice. We move the rail with a transform and keep
// scrollX inside one sequence, so the second copy can seamlessly continue it.
const loopCopies = [0, 1]

function getSequenceWidth() {
  const firstSequence = rail.value?.querySelector<HTMLElement>(
    '.strategy-anchor-text-scroller__sequence',
  )

  return firstSequence?.offsetWidth ?? 0
}

function keepScrollXInsideSequence() {
  const sequenceWidth = getSequenceWidth()

  if (sequenceWidth <= 0) return

  scrollX = ((scrollX % sequenceWidth) + sequenceWidth) % sequenceWidth
}

function renderRail() {
  if (!rail.value) return

  keepScrollXInsideSequence()
  rail.value.style.transform = `translate3d(${-scrollX}px, 0, 0)`
}

function moveScroll(delta: number) {
  scrollX += delta
  renderRail()
}

function pauseAutoScroll() {
  pauseAutoScrollUntil = window.performance.now() + USER_PAUSE_MS
}

function updateSlotWidths() {
  rail.value
    ?.querySelectorAll<HTMLElement>('.strategy-anchor-text-scroller__slot')
    .forEach((slot) => {
      const text = slot.querySelector<HTMLElement>('.strategy-anchor-text-scroller__item')
      if (!text) return

      // A slot is 90% of its text width. This means the next text starts when
      // roughly 90% of the previous text is already visible.
      slot.style.width = `${text.offsetWidth * NEXT_TEXT_START_RATIO}px`
    })
}

function refreshLayout() {
  updateSlotWidths()
  renderRail()
}

function autoScroll(_time: number, deltaTime: number) {
  if (!hasAnchors.value || isPointerDown || window.performance.now() < pauseAutoScrollUntil) return

  moveScroll((AUTO_SCROLL_SPEED_PX_PER_SECOND * deltaTime) / 1000)
}

function getWheelDelta(event: WheelEvent) {
  return event.deltaX || event.deltaY
}

function scrollWithWheel(event: WheelEvent) {
  event.preventDefault()
  pauseAutoScroll()
  moveScroll(getWheelDelta(event))
}

function startDrag(event: PointerEvent) {
  isPointerDown = true
  isDragging = true
  dragStartX = event.clientX
  dragStartScrollX = scrollX
  pauseAutoScroll()
}

function dragScroll(event: PointerEvent) {
  if (!isDragging) return

  pauseAutoScroll()
  scrollX = dragStartScrollX + dragStartX - event.clientX
  renderRail()
}

function releasePointer() {
  if (isAnchorPressed) {
    emit('anchorPressEnd')
  }

  isAnchorPressed = false
  isPointerDown = false
  isDragging = false
}

function showStatementOverlay(anchor: AnchorTextItem) {
  isPointerDown = true
  isAnchorPressed = true
  pauseAutoScroll()
  emit('anchorPressStart', anchor)
}

async function resetScrollPosition() {
  await nextTick()
  scrollX = 0
  refreshLayout()
}

onMounted(() => {
  gsap.ticker.add(autoScroll)
  resetScrollPosition()
  window.addEventListener('resize', refreshLayout)
  window.addEventListener('pointerup', releasePointer)
  window.addEventListener('pointercancel', releasePointer)
  window.addEventListener('blur', releasePointer)
  scroller.value?.addEventListener('wheel', scrollWithWheel, { passive: false })
})

watch(anchors, resetScrollPosition)

onBeforeUnmount(() => {
  gsap.ticker.remove(autoScroll)
  window.removeEventListener('resize', refreshLayout)
  window.removeEventListener('pointerup', releasePointer)
  window.removeEventListener('pointercancel', releasePointer)
  window.removeEventListener('blur', releasePointer)
  scroller.value?.removeEventListener('wheel', scrollWithWheel)
})
</script>

<template>
  <section
    ref="scroller"
    class="strategy-anchor-text-scroller"
    aria-label="Anchor texts"
    @pointercancel="releasePointer"
    @pointerdown="startDrag"
    @pointermove="dragScroll"
    @pointerup="releasePointer"
  >
    <div v-if="hasAnchors" ref="rail" class="strategy-anchor-text-scroller__rail">
      <div
        v-for="copy in loopCopies"
        :key="copy"
        class="strategy-anchor-text-scroller__sequence"
        :aria-hidden="copy === 1"
      >
        <div
          v-for="(anchor, index) in anchors"
          :key="`${copy}-${index}`"
          class="strategy-anchor-text-scroller__slot"
        >
          <button
            type="button"
            class="strategy-anchor-text-scroller__item"
            :style="{ gridRow: index % 2 === 0 ? '1' : '2' }"
            @click.stop.prevent
            @pointerdown.stop.prevent="showStatementOverlay(anchor)"
          >
            »{{ anchor.text }}«
          </button>
        </div>
      </div>
    </div>

    <p v-else class="strategy-anchor-text-scroller__empty">No anchor texts available.</p>

    <p class="strategy-anchor-text-scroller__note">
      Note: These are shortened excerpts. Press and hold an example to view the full statement.
    </p>
  </section>
</template>

<style scoped>
@import '../../css/components/strategy/StrategyAnchorTextScroller.css';
</style>
