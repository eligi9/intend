<script setup lang="ts">
import StrategyButton from './StrategyButton.vue'

interface FilterButtonContainerItem {
  active?: boolean
  color: string
  key: string
  label: string
  minWidth?: string
}

withDefaults(
  defineProps<{
    labels: FilterButtonContainerItem[]
    title?: string
  }>(),
  {
    title: '',
  },
)

defineEmits<{
  hover: [key: string | null]
  select: [key: string]
}>()
</script>

<template>
  <section class="filter-button-container" :aria-label="title || 'Filter'">
    <small v-if="title">{{ title }}</small>

    <div class="filter-button-container__buttons">
      <StrategyButton
        v-for="item in labels"
        :key="item.key"
        :label="item.label"
        :color="item.color"
        :active="item.active"
        :min-width="item.minWidth"
        interaction-type="click"
        @blur="$emit('hover', null)"
        @focus="$emit('hover', item.key)"
        @mouseenter="$emit('hover', item.key)"
        @mouseleave="$emit('hover', null)"
        @select="$emit('select', item.key)"
      />
    </div>
  </section>
</template>

<style scoped>
@import '../../css/components/common/FilterButtonContainer.css';
</style>
