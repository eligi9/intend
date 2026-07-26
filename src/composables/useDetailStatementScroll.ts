import { nextTick, onMounted, ref, watch, type Ref } from 'vue'

interface DetailStatementScrollOptions {
  container: Ref<HTMLElement | null>
  targetStatementId: Readonly<Ref<string | null | undefined>>
}

export function useDetailStatementScroll({
  container,
  targetStatementId,
}: DetailStatementScrollOptions) {
  const focusedStatementId = ref<string | null>(targetStatementId.value ?? null)

  async function scrollToTargetStatement() {
    const statementId = targetStatementId.value
    if (!statementId) return

    await nextTick()
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const scrollContainer = container.value
      if (!scrollContainer) return

      const target = Array.from(
        scrollContainer.querySelectorAll<HTMLElement>('[data-statement-id]'),
      ).find((element) => element.dataset.statementId === statementId)
      if (!target) {
        clearFocusedStatement()
        return
      }

      const header = scrollContainer.querySelector<HTMLElement>('.detail__header')
      const containerBounds = scrollContainer.getBoundingClientRect()
      const targetBounds = target.getBoundingClientRect()
      const targetTop = scrollContainer.scrollTop + targetBounds.top - containerBounds.top
      const headerHeight = header?.getBoundingClientRect().height ?? 0

      scrollContainer.scrollTo({
        behavior: 'smooth',
        top: Math.max(0, targetTop - headerHeight),
      })
    }))
  }

  function clearFocusedStatement() {
    focusedStatementId.value = null
  }

  watch(targetStatementId, (statementId) => {
    focusedStatementId.value = statementId ?? null
    scrollToTargetStatement()
  })
  onMounted(scrollToTargetStatement)

  return {
    clearFocusedStatement,
    focusedStatementId,
    scrollToTargetStatement,
  }
}
