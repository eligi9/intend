<script setup lang="ts">
import { intentTaxonomy } from '../../utils/intentTaxonomy'
import VerticalLineGrid from '../common/VerticalLineGrid.vue'

const gridLineCount = 8
const gridLabels: string[] = []
const patternTypes = intentTaxonomy.map((patternType) => {
  const firstSentenceEnd = patternType.description.indexOf('.')

  return {
    className: `establishment-pattern-types__card--${patternType.parentLabel.replace(/_/g, '-')}`,
    descriptionFirstSentence:
      firstSentenceEnd >= 0
        ? patternType.description.slice(0, firstSentenceEnd + 1)
        : patternType.description,
    descriptionRemainder:
      firstSentenceEnd >= 0
        ? patternType.description.slice(firstSentenceEnd + 1).trim()
        : '',
    title: patternType.label,
  }
})
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
          <p>
            <span>{{ patternType.descriptionFirstSentence }}</span>
            <template v-if="patternType.descriptionRemainder">
              <br />
              <br />
              <span>{{ patternType.descriptionRemainder }}</span>
            </template>
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '../../css/components/establishment/EstablishmentPatternTypesSection.css';
</style>
