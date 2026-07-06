<script setup lang="ts">
defineProps<{
  modelValue: string
  options: readonly {
    label: string
    value: string
  }[]
  selectLabel: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="dropdown-select">
    <select
      :aria-label="selectLabel"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
@import '../../css/components/common/DropdownSelect.css';
</style>
