export function getPercent(value: number, total: number) {
  return total > 0 ? Math.min(100, (value / total) * 100) : 0
}
