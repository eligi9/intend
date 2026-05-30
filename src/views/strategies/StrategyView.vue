<script setup lang="ts">
import { storeToRefs } from 'pinia'
import StrategyCorrelationHeatmap from '../../components/strategy-correlation-heatmap/StrategyCorrelationHeatmap.vue'
import { useStatementStore } from '../../stores/statementStore'

const statementStore = useStatementStore()
const { records } = storeToRefs(statementStore)
</script>

<template>
  <section class="strategy-view">
    <header class="strategy-view__header">
      <h2>Strategien</h2>
    </header>

    <StrategyCorrelationHeatmap :records="records" />
  </section>
</template>

<style scoped>
@import './StrategyView.css';
</style>
