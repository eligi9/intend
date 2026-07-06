import { onMounted, ref } from 'vue'

interface InitialViewportGridCellSizeOptions {
  columns: number
  fallback?: string
  fallbackPx?: number
}

export function useInitialViewportGridCell({
  columns,
  fallback = `calc(100vw / ${columns})`,
  fallbackPx = 80,
}: InitialViewportGridCellSizeOptions) {
  const cellSize = ref(fallback)
  const cellSizePx = ref(fallbackPx)

  onMounted(() => {
    const nextCellSize = window.innerWidth / columns

    cellSize.value = `${nextCellSize}px`
    cellSizePx.value = nextCellSize
  })

  return {
    cellSize,
    cellSizePx,
  }
}

export function useInitialViewportGridCellSize(options: InitialViewportGridCellSizeOptions) {
  return useInitialViewportGridCell(options).cellSize
}
