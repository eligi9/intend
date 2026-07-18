<script setup lang="ts">
import type { IntentRecord } from '../../types/intentData'
import VerticalLineGrid from '../common/VerticalLineGrid.vue'
import EstablishmentFeaturedStatement from './EstablishmentFeaturedStatement.vue'

defineProps<{
  record: IntentRecord
}>()

const gridAreaCount = 7
const gridLabels: string[] = []
</script>

<template>
  <section class="establishment-statement-interlude" aria-label="Example statement">
    <VerticalLineGrid
      class="establishment-statement-interlude__grid"
      :area-count="gridAreaCount"
      :labels="gridLabels"
    />

    <div class="establishment-statement-interlude__inner">
      <EstablishmentFeaturedStatement
        class="establishment-statement-interlude__statement"
        :record="record"
      />
    </div>
  </section>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentStatementInterlude.css';
</style>
