import { ref, type Ref } from 'vue'

export type FloatingPlacement = 'left' | 'right'

export function useFloatingPlacement(targetRef: Ref<HTMLElement | null>) {
  const placement = ref<FloatingPlacement>('right')

  function updatePlacement() {
    const target = targetRef.value
    if (!target) return

    const bounds = target.getBoundingClientRect()
    const targetCenter = bounds.left + bounds.width / 2
    placement.value = targetCenter > window.innerWidth / 2 ? 'left' : 'right'
  }

  return {
    placement,
    updatePlacement,
  }
}
