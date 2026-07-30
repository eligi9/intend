<script setup lang="ts">
import type { PatternLabelKey } from '../../types/intentData'
import { intentLabelNames } from '../../utils/intentLabels'
import CustomButton from '../button/CustomButton.vue'

defineProps<{
  badges: readonly {
    color: string
    label: PatternLabelKey
  }[]
  hoveredLabel: PatternLabelKey | null
  selectedLabel: PatternLabelKey | null
}>()

const emit = defineEmits<{
  'toggle-label': [label: PatternLabelKey]
  'update:hoveredLabel': [label: PatternLabelKey | null]
}>()

function setHoveredLabel(label: PatternLabelKey | null) {
  emit('update:hoveredLabel', label)
}
</script>

<template>
  <span
    class="pattern-button-container"
    aria-label="Active patterns"
    @click.stop
  >
    <CustomButton
      v-for="badge in badges"
      :key="badge.label"
      :active="selectedLabel === badge.label"
      :color="badge.color"
      interaction-type="hover"
      :label="intentLabelNames[badge.label]"
      @interaction-change="setHoveredLabel($event ? badge.label : null)"
      @select="emit('toggle-label', badge.label)"
    />
  </span>
</template>

<style scoped>
@import '../../css/components/ui/PatternButtonContainer.css';
</style>
