export function toggleArrayItem<T>(items: readonly T[], item: T) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item]
}
