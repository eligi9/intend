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
  <div
    class="dropdown-select"
    :class="{ 'dropdown-select--selected': Boolean(modelValue) }"
  >
    <select
      :aria-label="selectLabel"
      :value="modelValue"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :disabled="option.value === ''"
        :hidden="option.value === ''"
      >
        {{ option.label }}
      </option>
    </select>

    <button
      v-if="modelValue"
      type="button"
      class="dropdown-select__clear"
      :aria-label="`Clear ${selectLabel}`"
      @click="emit('update:modelValue', '')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
@import '../../css/components/ui/DropdownSelect.css';
</style>
