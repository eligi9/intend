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
      <h2>Strategies</h2>
      <p>See how strategies appear together across the coded statements.</p>
    </header>

    <div class="strategy-view__matrix">
      <StrategyCorrelationHeatmap :records="records" />
    </div>
  </section>
</template>

<style scoped>
@import './StrategyView.css';
</style>
