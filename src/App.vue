<script setup lang="ts">
import FourPointGrid from './components/common/FourPointGrid.vue'
import EstablishmentView from './views/EstablishmentView.vue'
</script>

<template>
  <main class="app-shell">
    <EstablishmentView />
  </main>

  <FourPointGrid :visible="false" />
</template>
