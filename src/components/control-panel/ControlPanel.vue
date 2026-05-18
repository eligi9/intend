<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useVisualizationStore } from '../../stores/visualizationStore'

const store = useVisualizationStore()
const { nodes, settings, selectedNode, averageValue } = storeToRefs(store)
</script>

<template>
  <aside class="control-panel">
    <div>
      <p class="eyebrow">Open Canvas</p>
      <h1>Daten als bewegliche Objekte</h1>
    </div>

    <div class="metrics">
      <div>
        <span>{{ nodes.length }}</span>
        <small>Objekte</small>
      </div>
      <div>
        <span>{{ averageValue }}</span>
        <small>Mittelwert</small>
      </div>
    </div>

    <label>
      Geschwindigkeit
      <input
        :value="settings.speed"
        type="range"
        min="0.2"
        max="3"
        step="0.1"
        @input="store.setSpeed(Number(($event.target as HTMLInputElement).value))"
      />
    </label>

    <label>
      Anziehung
      <input
        :value="settings.attraction"
        type="range"
        min="0"
        max="1.2"
        step="0.05"
        @input="store.setAttraction(Number(($event.target as HTMLInputElement).value))"
      />
    </label>

    <button type="button" @click="store.toggleTrails">
      {{ settings.showTrails ? 'Trails aus' : 'Trails an' }}
    </button>

    <button type="button" @click="store.addNode">Objekt hinzufügen</button>
    <button type="button" @click="store.randomizeValues">Werte mischen</button>

    <div class="selection">
      <small>Auswahl</small>
      <strong>{{ selectedNode?.label ?? 'Kein Objekt gewählt' }}</strong>
      <span v-if="selectedNode">Wert {{ selectedNode.value }}</span>
    </div>
  </aside>
</template>

<style scoped>
@import './ControlPanel.css';
</style>
