<script setup lang="ts">
import authorDataset from '../../data/author-dataset.json'
import type { AuthorDataset } from '../types/authorData'

const emit = defineEmits<{
  close: []
}>()

const imageCredits = (authorDataset as AuthorDataset).authors.flatMap((author) =>
  author.image
    ? [
        {
          authorName: author.name,
          image: author.image,
        },
      ]
    : [],
)
</script>

<template>
  <aside
    class="image-credits-view"
    aria-label="Image credits and licenses"
    @scroll.stop
    @touchmove.stop
    @wheel.stop
  >
    <section class="image-credits-view__page">
      <header class="image-credits-view__header">
        <div class="image-credits-view__heading">
          <h2>Image credits and licenses</h2>
        </div>

        <button
          type="button"
          class="image-credits-view__close"
          aria-label="Close image credits"
          @click="emit('close')"
        >
          x
        </button>
      </header>

      <div class="image-credits-view__intro">
        <p>
          The portraits are sourced from Wikimedia Commons or related public records. Each entry lists
          the image source, creator or credit information, license, and the modifications used in this
          interface.
        </p>
      </div>

      <ol class="image-credits-view__list">
        <li
          v-for="{ authorName, image } in imageCredits"
          :key="authorName"
          class="image-credits-view__item"
        >
          <img
            class="image-credits-view__image"
            :src="image.url"
            :alt="`Portrait of ${authorName}`"
            draggable="false"
          />

          <div class="image-credits-view__content">
            <h3>{{ authorName }}</h3>

            <dl class="image-credits-view__meta">
              <div>
                <dt>Image title</dt>
                <dd>{{ image.title }}</dd>
              </div>

              <div v-if="image.creator">
                <dt>Creator</dt>
                <dd>{{ image.creator }}</dd>
              </div>

              <div v-if="image.credit">
                <dt>Credit</dt>
                <dd>{{ image.credit }}</dd>
              </div>

              <div>
                <dt>License</dt>
                <dd>
                  <a
                    v-if="image.licenseUrl"
                    :href="image.licenseUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ image.license }}
                  </a>
                  <span v-else>{{ image.license }}</span>
                </dd>
              </div>

              <div>
                <dt>Source</dt>
                <dd>
                  <a
                    :href="image.sourceUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ image.sourceUrl }}
                  </a>
                </dd>
              </div>

              <div>
                <dt>Original file</dt>
                <dd>
                  <a
                    :href="image.originalUrl"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ image.commonsFile }}
                  </a>
                </dd>
              </div>

              <div>
                <dt>Modifications</dt>
                <dd>{{ image.modifications }}</dd>
              </div>

              <div>
                <dt>Attribution</dt>
                <dd>{{ image.attribution }}</dd>
              </div>
            </dl>
          </div>
        </li>
      </ol>
    </section>
  </aside>
</template>

<style scoped>
@import '../css/views/ImageCreditsView.css';
</style>
