import { defineStore } from 'pinia'
import { computed } from 'vue'
import authorDataset from '../../data/author-dataset.json'
import type { AuthorDataset } from '../types/authorData'
import { createAuthorInstance } from '../utils/authorInstances'
import { useStatementStore } from './statementStore'

const intentAuthorDataset = authorDataset as AuthorDataset

export const useAuthorStore = defineStore('authors', () => {
  const statementStore = useStatementStore()

  const authorProfiles = computed(() => intentAuthorDataset.authors)
  const authorInstances = computed(() =>
    authorProfiles.value.map((author) =>
      createAuthorInstance(author, statementStore.statementsByAuthor[author.name] ?? []),
    ),
  )
  const authorProfileCount = computed(() => authorProfiles.value.length)

  function getAuthorInstance(authorName: string) {
    return authorInstances.value.find((author) => author.name === authorName) ?? null
  }

  return {
    authorProfiles,
    authorInstances,
    authorProfileCount,
    getAuthorInstance,
  }
})
