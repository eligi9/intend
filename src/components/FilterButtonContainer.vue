<script setup lang="ts">
import FilterButton from './FilterButton.vue'

interface FilterButtonContainerItem {
  active?: boolean
  color: string
  key: string
  label: string
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
  select: [key: string]
}>()
</script>

<template>
  <section class="filter-button-container" :aria-label="title || 'Filter'">
    <small v-if="title">{{ title }}</small>

    <div class="filter-button-container__buttons">
      <FilterButton
        v-for="item in labels"
        :key="item.key"
        :label="item.label"
        :color="item.color"
        :active="item.active"
        @click="$emit('select', item.key)"
      />
    </div>
  </section>
</template>

<style scoped>
@import '../css/components/FilterButtonContainer.css';
</style>
