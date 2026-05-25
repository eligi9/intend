<script setup lang="ts">
import { computed, ref } from 'vue'
import type { IntentRecord } from '../../types/intentData'

const props = defineProps<{
  record: IntentRecord
}>()

const emit = defineEmits<{
  previous: []
  next: []
}>()

const swipeStart = ref<{ x: number; y: number } | null>(null)

const statementSegments = computed(() => splitBracketedText(props.record.statement))

function splitBracketedText(text: string) {
  const segments: { text: string; muted: boolean }[] = []
  const bracketPattern = /\[[^\]]*\]/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = bracketPattern.exec(text))) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), muted: false })
    }

    segments.push({ text: match[0], muted: true })
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), muted: false })
  }

  return segments
}

function startStatementSwipe(event: TouchEvent) {
  const touch = event.touches[0]
  if (!touch) return

  swipeStart.value = {
    x: touch.clientX,
    y: touch.clientY,
  }
}

function finishStatementSwipe(event: TouchEvent) {
  if (!swipeStart.value) return

  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - swipeStart.value.x
  const deltaY = touch.clientY - swipeStart.value.y
  swipeStart.value = null

  if (Math.abs(deltaX) < 56 || Math.abs(deltaY) > 72) return

  if (deltaX < 0) {
    emit('next')
    return
  }

  emit('previous')
}
</script>

<template>
  <article
    class="read-statement-card"
    @touchstart.passive="startStatementSwipe"
    @touchend.passive="finishStatementSwipe"
  >
    <span class="read-statement-card__heading">
      <strong>{{ record.author }}</strong>
      <span class="read-statement-card__meta">{{ record.sector }} · {{ record.date }}</span>

      <span class="read-statement-card__position">{{ record.position }}</span>
    </span>

    <span class="read-statement-card__quote">
      <span
        v-for="(segment, index) in statementSegments"
        :key="`${segment.text}-${index}`"
        :class="{ 'read-statement-card__quote-muted': segment.muted }"
      >
        {{ segment.text }}
      </span>
    </span>

    <span v-if="record.context" class="read-statement-card__context">{{ record.context }}</span>
  </article>
</template>

<style scoped>
@import './ReadStatementCard.css';
</style>
