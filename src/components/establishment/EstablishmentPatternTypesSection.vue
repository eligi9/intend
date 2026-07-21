<script setup lang="ts">
import VerticalLineGrid from '../common/VerticalLineGrid.vue'

const gridLineCount = 8
const gridLabels: string[] = []
const patternTypes = [
  {
    className: 'establishment-pattern-types__card--enemy-image',
    description: 'portray an outgroup as dangerous, immoral, or fundamentally different. This can make violence against them seem more acceptable, reduce moral hesitation, and can lead to mobilization.',
    title: 'Enemy Image',
  },
  {
    className: 'establishment-pattern-types__card--just-cause',
    description: 'faming violent or harmful measures as rational, necessary, or morally justified. By linking a measure to a specific cause, these statements depict violence as logical answer.',
    title: 'Just Cause',
  },
  {
    className: 'establishment-pattern-types__card--individual-needs',
    description: 'addresses personal and collective needs, for example the individual’s status within the ingroup or the status of the ingroup compared to other groups. This can encourage support, by making people feel needed or part of a meaningful collective mission.',
    title: 'Individual Needs',
  },
  {
    className: 'establishment-pattern-types__card--rhetorical-foreclosure',
    description: 'exclude or devalue alternatives, criticism, or moral concerns. This narrows the space for doubt, reflection, and opposition.',
    title: 'Rhetorical Foreclosure',
  },
]
</script>

<template>
  <section class="establishment-pattern-types" aria-labelledby="pattern-types-title">
    <VerticalLineGrid
      class="establishment-pattern-types__grid"
      :labels="gridLabels"
      :line-count="gridLineCount"
    />

    <div class="establishment-pattern-types__inner">
      <header class="establishment-pattern-types__header">
        <h2 id="pattern-types-title">Pattern Types</h2>
        <p>Which main rhetorical pattern types are we looking for?</p>
      </header>

      <div class="establishment-pattern-types__body">
        <article
          v-for="patternType in patternTypes"
          :key="patternType.title"
          class="establishment-pattern-types__card"
          :class="patternType.className"
        >
          <h3>{{ patternType.title }}</h3>
          <p>{{ patternType.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentPatternTypesSection.css';
</style>
