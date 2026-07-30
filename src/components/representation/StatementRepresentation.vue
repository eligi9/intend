<script setup lang="ts">
import { computed } from 'vue'
import type { Statement } from '../../types/intentData'
import { strategyColors } from '../../utils/intentLabels'
import { getActiveMainLabels } from '../../utils/sort'

const props = withDefaults(
  defineProps<{
    size?: 'default' | 'large'
    statement: Statement
  }>(),
  {
    size: 'default',
  },
)

const mainPatterns = computed(() =>
  getActiveMainLabels(props.statement).map((labelKey) => ({
    color: strategyColors[labelKey],
    labelKey,
  })),
)

function ringSize(index: number) {
  const ringStep = '(var(--statement-representation-ring-stroke) + var(--statement-representation-ring-gap))'
  const ringExpansion = Array.from({ length: (index + 1) * 2 }, () => ringStep).join(' + ')

  return `calc(var(--statement-representation-core-size) + ${ringExpansion})`
}

const representationSize = computed(() => {
  const outerRingIndex = mainPatterns.value.length - 1

  return outerRingIndex >= 0
    ? ringSize(outerRingIndex)
    : 'var(--statement-representation-core-size)'
})
</script>

<template>
  <span
    class="statement-representation"
    :class="`statement-representation--${size}`"
    :style="{
      '--statement-representation-size': representationSize,
    }"
    aria-hidden="true"
  >
    <span class="statement-representation__rings">
      <span
        v-for="(pattern, index) in mainPatterns"
        :key="pattern.labelKey"
        class="statement-representation__ring"
        :style="{
          '--ring-color': pattern.color,
          '--ring-size': ringSize(index),
        }"
      />
    </span>

    <span class="statement-representation__core" />
  </span>
</template>

<style scoped>
@import '../../css/components/representation/StatementRepresentation.css';
</style>
