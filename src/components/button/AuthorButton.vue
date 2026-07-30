<script setup lang="ts">
import { computed } from 'vue'
import type { AuthorInstance } from '../../types/authorData'
import AuthorTooltip from '../tooltips/AuthorTooltip.vue'
import AuthorRepresentation from '../representation/AuthorRepresentation.vue'

const props = withDefaults(
  defineProps<{
    author: AuthorInstance
    backgroundColor?: string
    disabled?: boolean
    showRings?: boolean
    size?: number
    variant?: 'default' | 'detail'
  }>(),
  {
    backgroundColor: 'transparent',
    disabled: false,
    showRings: true,
    size: 148,
    variant: 'default',
  },
)

const emit = defineEmits<{
  select: []
}>()

const ariaLabel = computed(() => `${props.author.name} Details anzeigen`)
</script>

<template>
  <AuthorTooltip
    class="author-button-tooltip"
    :author="author"
    :disabled="disabled"
    :focusable="false"
  >
    <button
      class="author-button"
      type="button"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click.stop="emit('select')"
    >
      <AuthorRepresentation
        :author="author"
        :background-color="backgroundColor"
        :show-rings="showRings"
        :size="size"
        :variant="variant"
      />
    </button>
  </AuthorTooltip>
</template>

<style scoped>
@import '../../css/components/button/AuthorButton.css';
</style>
